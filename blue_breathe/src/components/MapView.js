import React, { useState, useEffect } from "react";
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

// Component to update map view when location changes
function ChangeView({ center, firstLoad }) {
  const map = useMap();

  React.useEffect(() => {
    if (firstLoad) {
      // Set bounds for Malaysia (approximate bounds that cover Peninsular and East Malaysia)
      const malaysiaBounds = L.latLngBounds(
        [1.0, 99.5], // Southwest corner
        [7.5, 119.5] // Northeast corner
      );
      map.fitBounds(malaysiaBounds);
    } else if (center) {
      map.setView([center.lat, center.lon], 13);
    }
  }, [center, map, firstLoad]);

  return null;
}

const MapView = ({ location, aqi }) => {
  // Need a state to track map rerender
  const [mapKey, setMapKey] = useState(Date.now());
  // Track if this is the first load
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Update map key when location changes to force remount
  useEffect(() => {
    if (location) {
      setMapKey(Date.now());
      // Once user selects a location, it's no longer first load
      setIsFirstLoad(false);
    }
  }, [location]);

  // Determine the marker popup content
  const getPopupContent = () => {
    let aqiText = "Unknown";
    let aqiClass = "text-gray-500";

    if (aqi !== undefined) {
      if (aqi <= 50) {
        aqiText = "Good";
        aqiClass = "text-green-500";
      } else if (aqi <= 100) {
        aqiText = "Moderate";
        aqiClass = "text-yellow-500";
      } else if (aqi <= 150) {
        aqiText = "Unhealthy for Sensitive Groups";
        aqiClass = "text-orange-500";
      } else if (aqi <= 200) {
        aqiText = "Unhealthy";
        aqiClass = "text-red-500";
      } else if (aqi <= 300) {
        aqiText = "Very Unhealthy";
        aqiClass = "text-purple-500";
      } else {
        aqiText = "Hazardous";
        aqiClass = "text-purple-800";
      }
    }

    return (
      <div>
        <p>
          <strong>Air Quality: </strong>
          <span className={aqiClass}>
            {aqi} AQI ({aqiText})
          </span>
        </p>
      </div>
    );
  };

  // Default center to middle of Malaysia if location is not provided
  const defaultCenter = [4.2105, 109.4053]; // Approximate center of Malaysia
  const center = location ? [location.lat, location.lon] : defaultCenter;

  // For initial view, use a more zoomed out setting
  const initialZoom = 6; // Lower value means more zoomed out

  return (
    <MapContainer
      key={mapKey} // Force remount when location changes
      center={center}
      zoom={isFirstLoad ? initialZoom : 13} // Use lower zoom on first load
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ChangeView center={location} firstLoad={isFirstLoad} />

      {location && (
        <Marker position={[location.lat, location.lon]}>
          <Popup>{getPopupContent()}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;
