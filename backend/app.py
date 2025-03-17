import flask
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import random  # Just for simulating air quality data in this demo

app = Flask(__name__)
# Update CORS configuration to allow specific origins
CORS(app, resources={r"/*": {"origins": [
   "https://bluebreathe-frontend.onrender.com", 
   "http://localhost:3000"
]}})

# Cache for geocoding results to avoid repeated API calls
geocode_cache = {}

def geocode_address(address):
   """Convert an address to coordinates using Nominatim (OpenStreetMap's geocoder)"""
   # First check our cache
   if address in geocode_cache:
       print(f"Using cached coordinates for '{address}'")
       return geocode_cache[address]
   
   # Use Nominatim API for geocoding
   url = "https://nominatim.openstreetmap.org/search"
   params = {
       "q": address,
       "format": "json",
       "limit": 1
   }
   
   # Add a user-agent header (required by Nominatim's terms of use)
   headers = {
       "User-Agent": "asthma-safe-route-planner/1.0"
   }
   
   response = requests.get(url, params=params, headers=headers)
   
   if response.status_code != 200 or not response.json():
       print(f"Error: Could not geocode address '{address}'")
       return None
   
   # Extract latitude and longitude
   result = response.json()[0]
   lat = float(result["lat"])
   lon = float(result["lon"])
   display_name = result["display_name"]
   
   # Cache the result
   geocode_cache[address] = {
       "lat": lat,
       "lon": lon,
       "display_name": display_name
   }
   
   print(f"Geocoded '{address}' to '{display_name}' at coordinates: {lat}, {lon}")
   return geocode_cache[address]

def get_osrm_routes(start_coords, end_coords):
   """Get routes from OSRM service"""
   # OSRM expects coordinates as lon,lat (not lat,lon)
   start_lon, start_lat = start_coords["lon"], start_coords["lat"]
   end_lon, end_lat = end_coords["lon"], end_coords["lat"]
   
   # Construct the OSRM API URL
   url = f"https://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
   
   # Add parameters
   params = {
       "overview": "full",  # Get detailed route geometry
       "alternatives": "true",  # Get alternative routes
       "steps": "true",     # Include turn-by-turn directions
       "annotations": "true"  # Get additional data
   }
   
   # Make the request
   try:
       response = requests.get(url, params=params)
       response.raise_for_status()
       
       return response.json()
   except Exception as e:
       print(f"Error getting routes: {str(e)}")
       return None

def get_air_quality(lat, lon):
   """
   Get air quality data for a location using the OpenAQ API
   """
   # Use OpenAQ API to get real air quality data
   url = "https://api.openaq.org/v2/latest"
   params = {
       "coordinates": f"{lat},{lon}",
       "radius": 10000,  # 10km radius
       "limit": 5,
       "order_by": "distance"
   }
   
   try:
       response = requests.get(url, params=params)
       response.raise_for_status()  # Raise exception for error status codes
       data = response.json()
       
       # Check if we got any results
       if data.get("results") and len(data["results"]) > 0:
           result = data["results"][0]  # Get the closest station
           measurements = result.get("measurements", [])
           
           # Extract measurements
           pollutants = {}
           aqi_value = None
           
           for m in measurements:
               parameter = m.get("parameter")
               value = m.get("value")
               
               if parameter and value is not None:
                   pollutants[parameter.lower()] = value
                   
                   # Use pm2.5 as the main AQI indicator if available
                   if parameter.lower() == "pm25" and aqi_value is None:
                       # Convert PM2.5 to AQI (simplified)
                       aqi_value = convert_pm25_to_aqi(value)
           
           # If we have data but no PM2.5, use another parameter or a default value
           if aqi_value is None:
               if "pm10" in pollutants:
                   aqi_value = convert_pm10_to_aqi(pollutants["pm10"])
               elif "o3" in pollutants:
                   aqi_value = convert_o3_to_aqi(pollutants["o3"])
               else:
                   # Use a default value based on available data
                   aqi_value = 50  # Default to moderate
           
           air_quality_data = {
               "aqi": aqi_value,
               "status": get_aqi_status(aqi_value),
               "pollutants": pollutants,
               "station": result.get("location", "Unknown Station"),
               "last_updated": result.get("lastUpdated")
           }
           
           return air_quality_data
   
   except Exception as e:
       print(f"Error fetching air quality data: {e}")
   
   # Fallback to simulated data if API fails or no data available
   print("Using fallback simulated air quality data")
   return get_simulated_air_quality(lat, lon)

def get_simulated_air_quality(lat, lon):
   """Fallback simulation when API fails"""
   base_aqi = 35
   location_factor = hash(f"{lat:.3f},{lon:.3f}") % 100 / 100.0
   
   # Make Malaysia have realistic AQI patterns
   if 1.0 <= lat <= 6.5 and 99.5 <= lon <= 104.5:  # Malaysia
       # Kuala Lumpur and urban areas
       if 3.0 <= lat <= 3.2 and 101.6 <= lon <= 101.8:
           base_aqi += 30  # Higher pollution in KL
       # Industrial areas
       elif 5.3 <= lat <= 5.5 and 100.2 <= lon <= 100.4:
           base_aqi += 25  # Higher pollution in industrial zones
   
   aqi = int(base_aqi + location_factor * 20)
   aqi = max(15, min(aqi, 150))
   
   air_quality_data = {
       "aqi": aqi,
       "status": get_aqi_status(aqi),
       "pollutants": {
           "pm25": round(aqi * 0.8, 1),
           "pm10": round(aqi * 1.2, 1),
           "o3": round(aqi * 0.5, 1),
           "no2": round(aqi * 0.3, 1)
       },
       "station": "Simulated Data",
       "last_updated": None
   }
   
   return air_quality_data

# Conversion functions for different pollutants to AQI
def convert_pm25_to_aqi(pm25):
   """Convert PM2.5 concentration to AQI (simplified)"""
   if pm25 <= 12.0:
       return linear_scale(pm25, 0, 12.0, 0, 50)
   elif pm25 <= 35.4:
       return linear_scale(pm25, 12.1, 35.4, 51, 100)
   elif pm25 <= 55.4:
       return linear_scale(pm25, 35.5, 55.4, 101, 150)
   elif pm25 <= 150.4:
       return linear_scale(pm25, 55.5, 150.4, 151, 200)
   elif pm25 <= 250.4:
       return linear_scale(pm25, 150.5, 250.4, 201, 300)
   else:
       return linear_scale(pm25, 250.5, 500.4, 301, 500)

def convert_pm10_to_aqi(pm10):
   """Convert PM10 concentration to AQI (simplified)"""
   if pm10 <= 54:
       return linear_scale(pm10, 0, 54, 0, 50)
   elif pm10 <= 154:
       return linear_scale(pm10, 55, 154, 51, 100)
   elif pm10 <= 254:
       return linear_scale(pm10, 155, 254, 101, 150)
   elif pm10 <= 354:
       return linear_scale(pm10, 255, 354, 151, 200)
   elif pm10 <= 424:
       return linear_scale(pm10, 355, 424, 201, 300)
   else:
       return linear_scale(pm10, 425, 604, 301, 500)

def convert_o3_to_aqi(o3):
   """Convert Ozone concentration to AQI (simplified)"""
   if o3 <= 54:
       return linear_scale(o3, 0, 54, 0, 50)
   elif o3 <= 70:
       return linear_scale(o3, 55, 70, 51, 100)
   elif o3 <= 85:
       return linear_scale(o3, 71, 85, 101, 150)
   elif o3 <= 105:
       return linear_scale(o3, 86, 105, 151, 200)
   elif o3 <= 200:
       return linear_scale(o3, 106, 200, 201, 300)
   else:
       return linear_scale(o3, 201, 504, 301, 500)

def linear_scale(value, in_min, in_max, out_min, out_max):
   """Linear scaling function to convert between ranges"""
   return round(((value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min))

def get_aqi_status(aqi):
   """Get text status for AQI value"""
   if aqi <= 50:
       return "Good"
   elif aqi <= 100:
       return "Moderate"
   elif aqi <= 150:
       return "Unhealthy for Sensitive Groups"
   elif aqi <= 200:
       return "Unhealthy"
   elif aqi <= 300:
       return "Very Unhealthy"
   else:
       return "Hazardous"

def sample_route_points(encoded_polyline, num_samples=10):
   """
   Sample points along a route polyline
   For a real implementation, you'd use a library like polyline to decode the geometry
   """
   # TODO: Use polyline library to decode geometry
   # For now, we'll use a simplified approach using the route legs/steps

   # Extract step locations from route
   route_points = []
   
   return route_points

def calculate_route_air_quality(route):
   """Calculate air quality metrics for route"""
   # Extract steps from route
   steps = []
   for leg in route.get("legs", []):
       for step in leg.get("steps", []):
           if "maneuver" in step and "location" in step["maneuver"]:
               # OSRM returns [lon, lat]
               lon, lat = step["maneuver"]["location"]
               steps.append({"lon": lon, "lat": lat})
   
   # Sample points along the route (use steps as our samples)
   # For a more accurate approach, would need to sample evenly along the route geometry
   
   # Limit to max 10 samples to avoid overwhelming air quality API
   if len(steps) > 10:
       # Take evenly spaced samples
       step_size = len(steps) // 10
       sampled_steps = [steps[i] for i in range(0, len(steps), step_size)]
       sampled_steps.append(steps[-1])  # Always include the last point
   else:
       sampled_steps = steps
   
   # Get air quality for each sample point
   air_quality_data = []
   
   for i, step in enumerate(sampled_steps):
       # For start and end points, use meaningful names
       name = "Start" if i == 0 else "End" if i == len(sampled_steps) - 1 else f"Point {i}"
       
       # Get air quality
       aq = get_air_quality(step["lat"], step["lon"])
       
       # Add to data
       air_quality_data.append({
           "position": [step["lat"], step["lon"]],
           "aqi": aq["aqi"],
           "name": name,
           "status": aq["status"]
       })
   
   # Calculate average AQI
   if air_quality_data:
       avg_aqi = sum(point["aqi"] for point in air_quality_data) / len(air_quality_data)
   else:
       avg_aqi = 0
   
   return {
       "points": air_quality_data,
       "average_aqi": round(avg_aqi, 1)
   }

@app.route('/api/routes', methods=['GET'])
def get_routes():
   """API endpoint to get routes with air quality data"""
   # Get origin and destination from query parameters
   origin = request.args.get('origin')
   destination = request.args.get('destination')
   
   if not origin or not destination:
       return jsonify({
           "error": "Missing origin or destination parameter"
       }), 400
   
   # Geocode addresses to coordinates
   origin_coords = geocode_address(origin)
   destination_coords = geocode_address(destination)
   
   if not origin_coords or not destination_coords:
       return jsonify({
           "error": "Could not geocode one or both locations"
       }), 400
   
   # Get routes from OSRM
   routes_data = get_osrm_routes(origin_coords, destination_coords)
   
   if not routes_data or "routes" not in routes_data:
       return jsonify({
           "error": "Could not find routes between these locations"
       }), 404
   
   # Process each route to add air quality data
   processed_routes = []
   
   for i, route in enumerate(routes_data["routes"]):
       # Extract basic route info
       distance_km = round(route["distance"] / 1000, 2)
       duration_min = round(route["duration"] / 60, 2)
       
       # Calculate air quality for route
       air_quality = calculate_route_air_quality(route)
       
       # Create route object
       processed_route = {
           "id": f"route{i+1}",
           "name": f"Route {i+1}" + (" (Fastest)" if i == 0 else ""),
           "distance": f"{distance_km} km",
           "duration": f"{duration_min} min",
           "points": air_quality["points"],
           "avgAQI": air_quality["average_aqi"]
       }
       
       processed_routes.append(processed_route)
   
   # Sort routes by air quality (best first)
   processed_routes.sort(key=lambda r: r["avgAQI"])
   
   # Add route descriptions based on air quality
   if len(processed_routes) > 0:
       processed_routes[0]["name"] += " (Lowest Pollution)"
   
   if len(processed_routes) > 1:
       max_aqi_route = max(processed_routes, key=lambda r: r["avgAQI"])
       if max_aqi_route["id"] != processed_routes[0]["id"]:
           max_aqi_route["name"] += " (Highest Pollution)"
   
   # Return data to client
   return jsonify({
       "origin": {
           "name": origin,
           "coords": [origin_coords["lat"], origin_coords["lon"]]
       },
       "destination": {
           "name": destination,
           "coords": [destination_coords["lat"], destination_coords["lon"]]
       },
       "routes": processed_routes
   })

@app.route('/api/air-quality', methods=['GET'])
def get_location_air_quality():
   """Get air quality for a specific location"""
   lat = request.args.get('lat')
   lon = request.args.get('lon')
   
   if not lat or not lon:
       return jsonify({
           "error": "Missing lat or lon parameter"
       }), 400
   
   try:
       lat = float(lat)
       lon = float(lon)
   except ValueError:
       return jsonify({
           "error": "Invalid lat or lon value"
       }), 400
   
   # Get air quality
   aq = get_air_quality(lat, lon)
   
   return jsonify(aq)

if __name__ == '__main__':
   app.run(debug=True, port=5000)