import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Function to create colored marker icons based on AQI - MODIFIED to remove city name
const createAqiMarkerIcon = (aqi, isSelected) => {
  // Define AQI colors - using consistent colors for marker, legend, and text
  let markerColor = "#22C55E"; // Green (Good) - using Tailwind green-500
  if (aqi > 50 && aqi <= 100) {
    markerColor = "#FACC15"; // Yellow (Moderate) - using Tailwind yellow-400
  } else if (aqi > 100 && aqi <= 150) {
    markerColor = "#F97316"; // Orange (Unhealthy for Sensitive Groups) - using Tailwind orange-500
  } else if (aqi > 150 && aqi <= 200) {
    markerColor = "#DC2626"; // Red (Unhealthy) - using Tailwind red-600
  } else if (aqi > 200 && aqi <= 300) {
    markerColor = "#9333EA"; // Purple (Very Unhealthy) - using Tailwind purple-600
  } else if (aqi > 300) {
    markerColor = "#581C87"; // Maroon (Hazardous) - using Tailwind purple-900
  }

  // Change size and add border if selected
  const size = isSelected ? 40 : 30;
  const border = isSelected ? "3px solid #3B82F6" : "2px solid white";
  const zIndex = isSelected ? 1000 : 500;
  const valueFontWeight = isSelected ? "800" : "700";

  return L.divIcon({
    className: "custom-aqi-marker",
    html: `
      <div style="position: relative; z-index: ${zIndex}; cursor: pointer;">
        <div style="background-color: ${markerColor}; 
                    color: ${aqi > 150 ? 'white' : 'black'}; 
                    border-radius: 50%; 
                    width: ${size}px; 
                    height: ${size}px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: ${valueFontWeight}; 
                    border: ${border};
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${aqi}</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
    interactive: true // Make sure the icon is interactive
  });
};

// Component to update map view when location changes - with error handling
function ChangeView({ center, zoom, resetView }) {
  const map = useMap();
  const isInitialViewRef = useRef(true);

  React.useEffect(() => {
    // Safely set view only after map is ready
    if (!map._loaded) {
      console.log("Map not fully loaded yet");
      return;
    }

    // Check if we need to reset to show all stations
    if (resetView) {
      console.log("Resetting view to show all of Malaysia");
      try {
        const malaysiaBounds = L.latLngBounds(
          [1.0, 99.5], // Southwest corner
          [7.5, 119.5] // Northeast corner
        );
        
        map.fitBounds(malaysiaBounds, { 
          padding: [20, 20],
          animate: false 
        });
        return;
      } catch (error) {
        console.error("Error resetting map view:", error);
      }
    }

    // Handle initialization vs. updates differently
    try {
      if (center) {
        // Specific location selected - zoom to it
        console.log("Setting view to specific location:", center);
        map.setView([center.lat, center.lon], zoom || 12, {
          animate: true,
          duration: 1 // Shorter animation to reduce chances of errors
        });
        isInitialViewRef.current = false;
      } else if (isInitialViewRef.current) {
        // Initial view - show all of Malaysia
        console.log("Setting initial Malaysia view");
        const malaysiaBounds = L.latLngBounds(
          [1.0, 99.5], // Southwest corner
          [7.5, 119.5] // Northeast corner
        );
        
        // Use fitBounds with a slight delay to ensure the map is ready
        setTimeout(() => {
          if (map && map._loaded) {
            map.fitBounds(malaysiaBounds, { 
              padding: [20, 20],
              animate: false // Disable animation for initial view
            });
          }
        }, 100);
        
        isInitialViewRef.current = false;
      }
    } catch (error) {
      console.error("Error updating map view:", error);
      // Fallback to a safe default view of Malaysia
      try {
        map.setView([4.2105, 109.4053], 6, { animate: false });
      } catch (fallbackError) {
        console.error("Fallback view also failed:", fallbackError);
      }
    }
  }, [center, map, zoom, resetView]);

  return null;
}

// Get AQI status text
const getAqiStatusText = (aqi) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// Get CSS class for AQI text coloring - using consistent Tailwind classes
const getAqiClass = (aqi) => {
  if (aqi <= 50) return "text-green-500";
  if (aqi <= 100) return "text-yellow-400";
  if (aqi <= 150) return "text-orange-500";
  if (aqi <= 200) return "text-red-600";
  if (aqi <= 300) return "text-purple-600";
  return "text-purple-900";
};

const MapView = ({ location, allCityData, selectedLocation, onLocationSelect, resetView }) => {
  // Need a state to track map rerender
  const [mapKey, setMapKey] = useState(Date.now());
  const [hasError, setHasError] = useState(false);
  const mapContainerRef = useRef(null);

  // Update map key when location changes to force remount
  useEffect(() => {
    // Only force remount if there was an error
    if (hasError) {
      setMapKey(Date.now());
      setHasError(false);
    }
  }, [location, hasError]);

  // Function to handle marker click
  const handleMarkerClick = (cityName, cityData) => {
    console.log("Marker clicked:", cityName, cityData);
    // Call the parent component's function to handle location selection
    if (onLocationSelect) {
      onLocationSelect(cityName, cityData);
    }
  };

  // Determine the marker popup content
  const getPopupContent = (name, aqi) => {
    const aqiValue = aqi || 0;
    const aqiText = getAqiStatusText(aqiValue);
    const aqiClass = getAqiClass(aqiValue);

    // Get button color based on AQI value for consistent styling
    let buttonClass = "bg-green-500 hover:bg-green-600";
    if (aqi > 50 && aqi <= 100) {
      buttonClass = "bg-yellow-400 hover:bg-yellow-500";
    } else if (aqi > 100 && aqi <= 150) {
      buttonClass = "bg-orange-500 hover:bg-orange-600";
    } else if (aqi > 150 && aqi <= 200) {
      buttonClass = "bg-red-600 hover:bg-red-700";
    } else if (aqi > 200 && aqi <= 300) {
      buttonClass = "bg-purple-600 hover:bg-purple-700";
    } else if (aqi > 300) {
      buttonClass = "bg-purple-900 hover:bg-purple-950";
    }

    return (
      <div className="text-center">
        <h3 className="font-bold">{name}</h3>
        <p>
          Air Quality: <span className={aqiClass + " font-medium"}>{aqiValue} AQI</span>
        </p>
        <p>Status: <span className={aqiClass + " font-medium"}>{aqiText}</span></p>
        <button 
          className={`mt-2 px-3 py-1 text-white rounded ${buttonClass}`}
          onClick={(e) => {
            e.stopPropagation();
            handleMarkerClick(name, { lat: 0, lon: 0, aqi: aqiValue });
          }}
        >
          Select This City
        </button>
      </div>
    );
  };

  // Error boundary for the map
  const handleMapError = (error) => {
    console.error("Map error caught:", error);
    setHasError(true);
  };

  // Set a safer default center of Malaysia
  const defaultCenter = [4.2105, 109.4053];
  
  return (
    <div className="relative h-full">
      <div 
        ref={mapContainerRef} 
        className="h-full w-full"
        style={{ position: 'relative' }}
      >
        <MapContainer
          key={mapKey}
          center={defaultCenter}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          whenReady={() => console.log("Map is ready")}
          whenCreated={(map) => {
            // Prevent and log any errors
            map.on('error', handleMapError);
          }}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Change the map view based on selected location */}
          <ChangeView 
            center={location} 
            zoom={location ? 12 : 6} 
            resetView={resetView}
          />

          {/* Render markers for all cities in the data */}
          {allCityData && Object.entries(allCityData).map(([cityName, cityData]) => {
            // Create a wrapper function to handle click for this specific city
            const cityClickHandler = () => {
              console.log("City marker clicked:", cityName);
              handleMarkerClick(cityName, cityData);
            };
            
            return (
              <Marker 
                key={cityName}
                position={[cityData.lat, cityData.lon]}
                icon={createAqiMarkerIcon(cityData.aqi, cityName === selectedLocation)}
                zIndexOffset={cityName === selectedLocation ? 1000 : 0}
                eventHandlers={{
                  click: cityClickHandler
                }}
              >
                <Popup>
                  {getPopupContent(cityName, cityData.aqi)}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-2 right-2 bg-white p-2 rounded-lg shadow-md z-[1000] text-xs">
        <h4 className="font-bold mb-1">AQI Legend</h4>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-green-500 mr-1"></div>
          <span className="text-green-500 font-medium">0-50: Good</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-yellow-400 mr-1"></div>
          <span className="text-yellow-400 font-medium">51-100: Moderate</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-orange-500 mr-1"></div>
          <span className="text-orange-500 font-medium">101-150: Unhealthy for Sensitive Groups</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-red-600 mr-1"></div>
          <span className="text-red-600 font-medium">151-200: Unhealthy</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 rounded-full bg-purple-600 mr-1"></div>
          <span className="text-purple-600 font-medium">201-300: Very Unhealthy</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-purple-900 mr-1"></div>
          <span className="text-purple-900 font-medium">300+: Hazardous</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;