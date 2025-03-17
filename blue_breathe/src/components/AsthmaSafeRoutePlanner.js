import React, { useState, useEffect } from "react";
import { MapPin, Navigation, AlertTriangle } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  FeatureGroup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// This component handles map updates
const MapController = ({ routes, selectedRoute }) => {
  const map = useMap();

  useEffect(() => {
    if (
      selectedRoute &&
      selectedRoute.points &&
      selectedRoute.points.length >= 2
    ) {
      // Create bounds from all points
      const bounds = L.latLngBounds(
        selectedRoute.points.map((point) => point.position)
      );

      // Fit the map to these bounds with some padding
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 12,
      });
    }
  }, [map, selectedRoute, routes]);

  return null;
};

const AsthmaSafeRoutePlanner = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customOrigin, setCustomOrigin] = useState(true);
  const [customDestination, setCustomDestination] = useState(true);

  // API base URL - in production, point to your deployed backend
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://bluebreathe-backend.onrender.com";

  // Sample location suggestions - Malaysian locations
  const sampleLocations = [
    "Kuala Lumpur, Malaysia",
    "Penang, Malaysia",
    "Johor Bahru, Malaysia",
    "Kota Kinabalu, Malaysia",
    "Kuching, Malaysia",
    "Melaka, Malaysia",
    "Ipoh, Malaysia",
    "Cameron Highlands, Malaysia",
  ];

  // Fix Leaflet's default icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  // Function to get AQI color
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return "text-green-500";
    if (aqi <= 100) return "text-yellow-500";
    if (aqi <= 150) return "text-orange-500";
    if (aqi <= 200) return "text-red-500";
    if (aqi <= 300) return "text-purple-500";
    return "text-rose-800";
  };

  // Add a unique identifier for each route search
  const [searchId, setSearchId] = useState(Date.now());

  // Update the fetchRoutes function
  const fetchRoutes = async () => {
    if (!origin || !destination) {
      setError("Please enter both origin and destination");
      return;
    }

    setLoading(true);
    setError("");

    // Generate a new searchId for this search request
    const newSearchId = Date.now();
    setSearchId(newSearchId);

    try {
      // Call the backend API
      const response = await fetch(
        `${API_URL}/api/routes?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(destination)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch routes");
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        setRoutes(data.routes);
        setSelectedRoute(data.routes[0]); // Select first route by default
      } else {
        setError("No routes found between these locations");
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError(err.message || "Failed to fetch routes");
    } finally {
      setLoading(false);
    }
  };

  // Get AQI status description
  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-gray-100">
      <div className="flex flex-col md:flex-row h-full">
        {/* Control panel */}
        <div className="w-full md:w-1/3 p-4 bg-white shadow-md overflow-y-auto">
          <div className="mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Origin
              </label>
              <div className="flex items-center mb-1">
                <input
                  type="text"
                  className="flex-grow p-2 border border-gray-300 rounded-md"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Enter address or location"
                />
              </div>
              {customOrigin && (
                <div className="text-xs text-gray-500 mt-1">
                  <p>Try one of these: </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sampleLocations.slice(0, 4).map((loc) => (
                      <button
                        key={loc}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        onClick={() => setOrigin(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <div className="flex items-center mb-1">
                <input
                  type="text"
                  className="flex-grow p-2 border border-gray-300 rounded-md"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter address or location"
                />
              </div>
              {customDestination && (
                <div className="text-xs text-gray-500 mt-1">
                  <p>Try one of these: </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {sampleLocations
                      .slice(0, 4)
                      .filter((loc) => loc !== origin)
                      .map((loc) => (
                        <button
                          key={loc}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          onClick={() => setDestination(loc)}
                        >
                          {loc}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={fetchRoutes}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Calculating Routes...
                </span>
              ) : (
                "Find Routes"
              )}
            </button>

            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertTriangle
                  size={16}
                  className="text-red-500 mt-0.5 mr-2 flex-shrink-0"
                />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                This app uses OpenStreetMap for routing and the World Air
                Quality Index for real-time air quality data.
              </p>
            </div>
          </div>

          {routes.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-2">Available Routes</h2>
              <div className="space-y-3">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className={`p-3 border rounded-md cursor-pointer ${
                      selectedRoute?.id === route.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300"
                    }`}
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className="font-medium">{route.name}</div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {route.distance} • {route.duration}
                      </span>
                      <span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            route.avgAQI <= 50
                              ? "bg-green-100 text-green-800"
                              : route.avgAQI <= 100
                              ? "bg-yellow-100 text-yellow-800"
                              : route.avgAQI <= 150
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          AQI: {route.avgAQI}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <h3 className="font-medium mb-1">Air Quality Index (AQI)</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    <span>0-50: Good</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                    <span>51-100: Moderate</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                    <span>101-150: Unhealthy for Sensitive Groups</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span>151+: Unhealthy</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Based on{" "}
                  <a
                    href="https://www.airnow.gov/aqi/aqi-basics/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    EPA AQI standards
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Route visualization area with map */}
        <div className="flex-1 bg-gray-100 p-4 overflow-hidden flex flex-col">
          {!origin || !destination || routes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center p-8">
                <Navigation className="mx-auto h-12 w-12" />
                <h3 className="mt-2 text-sm font-medium">No route selected</h3>
                <p className="mt-1 text-sm">
                  Select an origin and destination to view routes.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">
                  Route: {origin} to {destination}
                </h2>
                <div className="text-sm text-gray-500">
                  {selectedRoute?.distance} • {selectedRoute?.duration}
                </div>
              </div>

              {/* Map display */}
              <div className="w-full h-64 mb-4 border border-gray-200 rounded-lg overflow-hidden">
                {selectedRoute &&
                  selectedRoute.points &&
                  selectedRoute.points.length >= 2 && (
                    <MapContainer
                      center={[3.139, 101.6869]} // Center of KL as default
                      zoom={12}
                      style={{ height: "100%", width: "100%" }}
                      key={`map-${searchId}-${selectedRoute?.id || "no-route"}`} // Force re-render with searchId + routeId
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />

                      <MapController
                        routes={routes}
                        selectedRoute={selectedRoute}
                      />

                      {/* Start and end markers */}
                      <Marker position={selectedRoute.points[0].position}>
                        <Popup>
                          <b>Start:</b> {selectedRoute.points[0].name}
                        </Popup>
                      </Marker>

                      <Marker
                        position={
                          selectedRoute.points[selectedRoute.points.length - 1]
                            .position
                        }
                      >
                        <Popup>
                          <b>Destination:</b>{" "}
                          {
                            selectedRoute.points[
                              selectedRoute.points.length - 1
                            ].name
                          }
                        </Popup>
                      </Marker>

                      {/* Route polyline with colored segments based on AQI */}
                      {/* Route polyline with colored segments based on AQI */}
                      {/* Route polyline with colored segments based on current point AQI */}
                      {/* Route polyline that follows actual road geometry */}
                      {selectedRoute.points.map((point, idx) => {
                        if (idx === selectedRoute.points.length - 1)
                          return null; // Skip last point

                        const nextPoint = selectedRoute.points[idx + 1];

                        // Use the current point's AQI for both color and popup
                        const pointAQI = point.aqi;

                        // Get color based on current point's AQI
                        const color =
                          pointAQI <= 50
                            ? "#22c55e" // Green (Good)
                            : pointAQI <= 100
                            ? "#eab308" // Yellow (Moderate)
                            : pointAQI <= 150
                            ? "#f97316" // Orange (Unhealthy for Sensitive Groups)
                            : "#ef4444"; // Red (Unhealthy)

                        return (
                          <Polyline
                            key={`polyline-${searchId}-${selectedRoute.id}-${idx}`} // More unique key
                            positions={[point.position, nextPoint.position]}
                            color={color}
                            weight={5}
                            opacity={0.8}
                          >
                            <Popup>
                              <div>
                                <b>Air Quality:</b> {pointAQI} AQI
                                <br />
                                <span style={{ color: color }}>●</span>{" "}
                                {getAQIStatus(pointAQI)}
                              </div>
                            </Popup>
                          </Polyline>
                        );
                      })}
                    </MapContainer>
                  )}
              </div>

              {/* Simple route visualization */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <MapPin className="text-blue-600 mr-2" size={24} />
                    <span className="font-medium">{origin}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">{destination}</span>
                    <MapPin className="text-red-600 ml-2" size={24} />
                  </div>
                </div>

                {selectedRoute && (
                  <div className="relative pt-4">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      {(() => {
                        const totalPoints = selectedRoute.points.length;
                        let sampledPoints = [];

                        if (totalPoints <= 10) {
                          // If there are 10 or fewer points, use all
                          sampledPoints = selectedRoute.points;
                        } else {
                          // Always include start and end, then evenly sample the rest
                          sampledPoints = [selectedRoute.points[0]];
                          const step = Math.floor((totalPoints - 2) / 8); // Get 8 samples in between
                          for (let i = 1; i <= 8; i++) {
                            sampledPoints.push(selectedRoute.points[i * step]);
                          }
                          sampledPoints.push(
                            selectedRoute.points[totalPoints - 1]
                          );
                        }

                        return sampledPoints.map((point, index) => {
                          const segmentWidth = 100 / (sampledPoints.length - 1);
                          const bgColorClass =
                            point.aqi <= 50
                              ? "bg-green-500"
                              : point.aqi <= 100
                              ? "bg-yellow-500"
                              : point.aqi <= 150
                              ? "bg-orange-500"
                              : "bg-red-500";

                          return (
                            <div
                              key={index}
                              style={{ width: `${segmentWidth}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${bgColorClass}`}
                            ></div>
                          );
                        });
                      })()}
                    </div>

                    {/* Route point markers */}
                    <div className="flex justify-between">
                      {(() => {
                        const totalPoints = selectedRoute.points.length;
                        let sampledPoints = [];

                        if (totalPoints <= 10) {
                          sampledPoints = selectedRoute.points;
                        } else {
                          sampledPoints = [selectedRoute.points[0]];
                          const step = Math.floor((totalPoints - 2) / 8);
                          for (let i = 1; i <= 8; i++) {
                            sampledPoints.push(selectedRoute.points[i * step]);
                          }
                          sampledPoints.push(
                            selectedRoute.points[totalPoints - 1]
                          );
                        }

                        return sampledPoints.map((point, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 border-white ${
                                point.aqi <= 50
                                  ? "bg-green-500"
                                  : point.aqi <= 100
                                  ? "bg-yellow-500"
                                  : point.aqi <= 150
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            <span className="mt-1 text-xs text-gray-500">
                              {point.aqi} AQI
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="font-bold mb-2">Asthma Risk Assessment</h3>
                <div
                  className={`p-3 rounded-md ${
                    selectedRoute?.avgAQI <= 50
                      ? "bg-green-50 border border-green-200"
                      : selectedRoute?.avgAQI <= 100
                      ? "bg-yellow-50 border border-yellow-200"
                      : selectedRoute?.avgAQI <= 150
                      ? "bg-orange-50 border border-orange-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="font-medium mb-1">
                    {selectedRoute?.avgAQI <= 50
                      ? "Low Risk"
                      : selectedRoute?.avgAQI <= 100
                      ? "Moderate Risk"
                      : selectedRoute?.avgAQI <= 150
                      ? "High Risk - Consider Alternatives"
                      : "Very High Risk - Not Recommended"}
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedRoute?.avgAQI <= 50
                      ? "Air quality is good and poses little or no risk for asthma symptoms."
                      : selectedRoute?.avgAQI <= 100
                      ? "Air quality is acceptable but may cause mild symptoms for very sensitive individuals."
                      : selectedRoute?.avgAQI <= 150
                      ? "Members of sensitive groups may experience health effects. Consider bringing medication."
                      : "Health warnings of emergency conditions. Everyone may experience more serious health effects."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsthmaSafeRoutePlanner;
