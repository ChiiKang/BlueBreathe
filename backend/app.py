

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from slugify import slugify
import pandas as pd

from urllib.parse import unquote

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},  # Change "*" to your frontend domain for security
    supports_credentials=True,
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Load environment variables
load_dotenv()

# MySQL Database Configuration
# Database config
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": os.getenv("DB_PORT"),
    "ssl_ca": "ca-certificate.pem",  # Add the path to your SSL CA certificate
    "ssl_verify_cert": True,
    "use_pure": True,
}


def get_db_connection():
    """Get a connection to the MySQL database"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"Connected to MySQL Server version {db_info}")
            return connection
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        return None

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# example
# conn = get_db_connection()
# if not conn:
#     return jsonify({"error": "Database connection failed"}), 500

# try:
#     cursor = conn.cursor(dictionary=True)
#     # Execute queries...
#     # enter queries
#     results = cursor.fetchall()
#     return jsonify({"data": results})
# except Exception as e:
#     return jsonify({"error": str(e)}), 500
# finally:
#     if conn:
#         cursor.close()
#         conn.close()


# Mapbox API Key
MAPBOX_API_KEY = "pk.eyJ1IjoiY2hpaWthbmd0YW5nIiwiYSI6ImNtODh5ZzJtYzB2Z28ycXBzeWtkMzB3bTUifQ.fed8V4KeNrBiEGMxeiCtWg"

# Cache for geocoding results to avoid repeated API calls
geocode_cache = {}


def geocode_address(address):
    """Convert an address to coordinates using Nominatim"""
    if address in geocode_cache:
        return geocode_cache[address]

    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": address, "format": "json", "limit": 1}
    headers = {"User-Agent": "asthma-safe-route-planner/1.0"}

    response = requests.get(url, params=params, headers=headers)
    if response.status_code != 200 or not response.json():
        return None

    result = response.json()[0]
    lat, lon = float(result["lat"]), float(result["lon"])
    geocode_cache[address] = {"lat": lat, "lon": lon}
    return geocode_cache[address]


def get_mapbox_routes(start_coords, end_coords):
    """Fetch driving routes from Mapbox API with higher precision"""
    start_lon, start_lat = start_coords["lon"], start_coords["lat"]
    end_lon, end_lat = end_coords["lon"], end_coords["lat"]

    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
    params = {
        "geometries": "polyline6",  # Higher precision polyline
        "overview": "full",  # Full detail (not simplified)
        "steps": "true",  # Turn-by-turn navigation
        "alternatives": "true",  # Get multiple route options
        "access_token": MAPBOX_API_KEY,
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error getting routes from Mapbox: {str(e)}")
        return None


def get_air_quality(lat, lon):
    """Get air quality data using the WAQI API"""
    api_token = "902652703a4a6401a924447f3dedbf1574177445"
    url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={api_token}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if data.get("status") == "ok" and "data" in data:
            aqi_data = data["data"]
            aqi_value = aqi_data.get("aqi", 50)
            pollutants = {
                k: v.get("v")
                for k, v in aqi_data.get("iaqi", {}).items()
                if k in ["pm25", "pm10", "o3", "no2", "so2", "co"]
            }
            return {
                "aqi": aqi_value,
                "pollutants": pollutants,
                "station": aqi_data.get("city", {}).get("name", "Unknown"),
            }
        return {"aqi": 50, "pollutants": {}, "station": "No Data"}
    except Exception as e:
        print(f"Error fetching air quality data: {e}")
        return {"aqi": 50, "pollutants": {}, "station": "Error Fetching Data"}


def calculate_route_air_quality(route):
    """Calculate air quality metrics along the route and preserve road geometry"""
    # Extract all waypoints from the polyline to preserve road geometry
    geometry = route.get("geometry", "")
    if not geometry:
        return {"points": [], "average_aqi": 50}

    # Get all steps for sampling air quality
    steps = [
        step["maneuver"]["location"]
        for leg in route.get("legs", [])
        for step in leg.get("steps", [])
    ]

    # Sample air quality at strategic points along the route
    if len(steps) > 6:
        # For longer routes, sample at start, end, and some intermediate points
        step_count = min(4, len(steps) - 2)
        sampled_steps = (
            [steps[0]]
            + [steps[i] for i in range(1, len(steps) - 1, len(steps) // step_count)]
            + [steps[-1]]
        )
    else:
        # For shorter routes, sample at all steps
        sampled_steps = steps

    # Get air quality data for sampled points
    aq_samples = {}
    for i, (lon, lat) in enumerate(sampled_steps):
        aq = get_air_quality(lat, lon)
        aq_samples[(lat, lon)] = {
            "position": [lat, lon],
            "aqi": aq["aqi"],
            "name": f"Point {i+1}",
        }

    # Decode the polyline to get detailed road geometry
    import polyline

    decoded_coords = polyline.decode(
        geometry, 6
    )  # Use precision=6 for Mapbox polyline6 format

    # Create points array with both geometry and air quality data
    points = []

    # Add start point with AQ data
    start_lat, start_lon = decoded_coords[0]
    closest_sample = min(
        aq_samples.keys(),
        key=lambda coord: ((coord[0] - start_lat) ** 2 + (coord[1] - start_lon) ** 2),
    )
    start_aq = aq_samples[closest_sample]
    points.append(
        {"position": [start_lat, start_lon], "aqi": start_aq["aqi"], "name": "Start"}
    )

    # Process intermediate waypoints - we'll include detailed geometry but interpolate AQ values
    if len(decoded_coords) > 2:
        # Skip first and last points (they're handled separately)
        # For performance, only include a fraction of points for longer routes
        step_size = max(1, len(decoded_coords) // 100)  # Limit to ~100 points max

        for i in range(step_size, len(decoded_coords) - step_size, step_size):
            lat, lon = decoded_coords[i]

            # Find closest sampled point for air quality
            closest_sample = min(
                aq_samples.keys(),
                key=lambda coord: ((coord[0] - lat) ** 2 + (coord[1] - lon) ** 2),
            )

            points.append(
                {
                    "position": [lat, lon],
                    "aqi": aq_samples[closest_sample]["aqi"],
                    "name": f"Waypoint {i}",
                }
            )

    # Add end point with AQ data
    end_lat, end_lon = decoded_coords[-1]
    closest_sample = min(
        aq_samples.keys(),
        key=lambda coord: ((coord[0] - end_lat) ** 2 + (coord[1] - end_lon) ** 2),
    )
    end_aq = aq_samples[closest_sample]
    points.append(
        {"position": [end_lat, end_lon], "aqi": end_aq["aqi"], "name": "Destination"}
    )

    # Calculate average AQI
    avg_aqi = sum(point["aqi"] for point in points) / len(points) if points else 50

    return {"points": points, "average_aqi": round(avg_aqi, 1)}


@app.route("/api/routes", methods=["GET"])
def get_routes():
    """API endpoint to get routes with air quality data"""
    origin = request.args.get("origin")
    destination = request.args.get("destination")

    if not origin or not destination:
        return jsonify({"error": "Missing origin or destination"}), 400

    origin_coords = geocode_address(origin)
    destination_coords = geocode_address(destination)
    if not origin_coords or not destination_coords:
        return jsonify({"error": "Could not geocode locations"}), 400

    routes_data = get_mapbox_routes(origin_coords, destination_coords)
    if not routes_data or "routes" not in routes_data:
        return jsonify({"error": "No routes found"}), 404

    processed_routes = []
    for i, route in enumerate(routes_data["routes"]):
        distance_km = round(route["distance"] / 1000, 2)
        duration_min = round(route["duration"] / 60, 2)
        air_quality = calculate_route_air_quality(route)

        processed_routes.append(
            {
                "id": f"route{i+1}",
                "name": f"Route {i+1}" + (" (Fastest)" if i == 0 else ""),
                "distance": f"{distance_km} km",
                "duration": f"{duration_min} min",
                "points": air_quality["points"],
                "avgAQI": air_quality["average_aqi"],
            }
        )

    processed_routes.sort(key=lambda r: r["avgAQI"])
    if processed_routes:
        processed_routes[0]["name"] += " (Lowest Pollution)"
        max_aqi_route = max(processed_routes, key=lambda r: r["avgAQI"])
        if max_aqi_route["id"] != processed_routes[0]["id"]:
            max_aqi_route["name"] += " (Highest Pollution)"

    return jsonify(
        {
            "origin": {
                "name": origin,
                "coords": [origin_coords["lat"], origin_coords["lon"]],
            },
            "destination": {
                "name": destination,
                "coords": [destination_coords["lat"], destination_coords["lon"]],
            },
            "routes": processed_routes,
        }
    )


@app.route("/api/air-quality", methods=["GET"])
def get_location_air_quality():
    """Get air quality for a specific location"""
    lat, lon = request.args.get("lat"), request.args.get("lon")
    if not lat or not lon:
        return jsonify({"error": "Missing lat or lon"}), 400

    try:
        lat, lon = float(lat), float(lon)
    except ValueError:
        return jsonify({"error": "Invalid lat or lon"}), 400

    return jsonify(get_air_quality(lat, lon))


# get station data from database
@app.route("/stations")
def get_stations():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT station_name FROM aqi_records")
    stations = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(stations)


@app.route("/data/<station>")
def get_data(station):

    station = unquote(station).strip()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    today = datetime.today().date()
    past_7_days = today - timedelta(days=7)
    forecast_start = today + timedelta(days=1)

    # Query historical data
    cursor.execute(
        """
        SELECT date, aqi 
        FROM aqi_records
        WHERE station_name = %s AND date >= %s AND date < %s
        ORDER BY date
    """,
        (station, past_7_days, forecast_start),
    )
    historical = cursor.fetchall()

    # Query forecast data
    cursor.execute(
        """
        SELECT date, aqi 
        FROM aqi_records
        WHERE station_name = %s AND date >= %s
        ORDER BY date LIMIT 7
    """,
        (station, forecast_start),
    )
    forecast = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({"historical": historical, "forecast": forecast})


# Define port for Render deployment
port = int(os.environ.get("PORT", 5000))

# Disable debug mode in production
debug_mode = os.environ.get("ENVIRONMENT") == "development"

# Configure logging
import logging

if not debug_mode:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

@app.route("/")
def home():
    return jsonify({"message": "Welcome to BlueBreathe API", "status": "running"})

if __name__ == "__main__":
    app.run()


