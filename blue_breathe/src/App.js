import React, { useState, useEffect } from "react";
import {
  Wind,
  Thermometer,
  Droplets,
  Sun,
  AlertTriangle,
  Activity,
  Navigation,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import dayjs from 'dayjs';

import MapView from "./components/MapView";
import Weather from "./components/Weather";
import LocationDropdown from "./components/LocationDropdown";
import AsthmaSafeRoutePlanner from "./components/AsthmaSafeRoutePlanner";
import EducationalInsights from "./components/EducationalInsights";

const AirQualityDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userLocation, setUserLocation] = useState("All Stations, Malaysia");
  const [currentAQI, setCurrentAQI] = useState(0);
  const [riskLevel, setRiskLevel] = useState("Select a city to see details");
  const [isLoading, setIsLoading] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [allCityData, setAllCityData] = useState({});
  const [selectedCityName, setSelectedCityName] = useState("");

  const [weatherData, setWeatherData] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Chart data with default empty arrays
  const [airQualityData, setAirQualityData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  //7day-forecat
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('/stations');
        const data = await response.json();
        setStations(data);
        if (data.length > 0) {
          setSelectedStation(data[0]);
        }
      } catch (err) {
        console.error("Error fetching stations:", err);
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    if (selectedStation) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/data/${selectedStation}`);
          const data = await response.json();
          const historical = data.historical;
          const forecast = data.forecast;

          const mergedData = historical.map(d => ({
            date: d.date,
            aqi: d.aqi,
            isForecast: false
          })).concat(forecast.map(d => ({
            date: d.date,
            aqi: d.aqi,
            isForecast: true
          })));
          
          setChartData(mergedData);
          
        } catch (err) {
          console.error("Error fetching AQI data:", err);
        }
      };
      fetchData();
    }
  }, [selectedStation]);

  // Determine whether it is a prediction segment
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isForecast = payload.find(p => p.payload.isForecast); 
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-medium mb-1">{label}</p>
          {isForecast ? (
            <p className="text-red-500">Forecast AQI : {payload[0].value}</p>
          ) : (
            <p className="text-blue-500">Historical AQI : {payload[0].value}</p>
          )}
        </div>
      );
    }
    return null;
  };





  const [childProfiles, setChildProfiles] = useState([
    {
      id: 1,
      name: "Alex",
      age: 8,
      asthmaLevel: "Moderate",
      lastFlareUp: "2 weeks ago",
    },
  ]);

  // Default pollutants (will be replaced with live data)
  const [pollutants, setPollutants] = useState([
    {
      name: "PM2.5",
      value: "15 μg/m³",
      status: "Fair",
      description: "Fine particulate matter",
    },
    {
      name: "O3",
      value: "68.4 μg/m³",
      status: "Fair",
      description: "Ground level ozone",
    },
    {
      name: "NO2",
      value: "45.2 μg/m³",
      status: "Fair",
      description: "Nitrogen dioxide",
    },
    {
      name: "PM10",
      value: "32.7 μg/m³",
      status: "Fair",
      description: "Coarse particulate matter",
    },
  ]);

  const [weatherFactors, setWeatherFactors] = useState([
    {
      name: "Temperature",
      value: "No city selected",
      icon: <Thermometer className="h-5 w-5" />,
    },
    {
      name: "Humidity",
      value: "No city selected",
      icon: <Droplets className="h-5 w-5" />,
    },
    {
      name: "Wind Speed",
      value: "No city selected",
      icon: <Wind className="h-5 w-5" />,
    },
    {
      name: "UV Index",
      value: "No city selected",
      icon: <Sun className="h-5 w-5" />,
    },
  ]);

  // Function to handle weather data updates from Weather component
  const handleWeatherDataUpdate = (data) => {
    if (!data) return; // Guard clause to prevent errors with null data

    setWeatherData(data);
    
    // If AQI was provided by the weather service, update it
    if (data.aqi && data.aqi !== currentAQI) {
      setCurrentAQI(data.aqi);
      setRiskLevel(determineRiskLevel(data.aqi));
    }

    // Update weather factors with real data
    setWeatherFactors([
      {
        name: "Temperature",
        value: data.temperature ? `${data.temperature}°C` : "N/A",
        icon: <Thermometer className="h-5 w-5" />,
      },
      {
        name: "Humidity",
        value: data.humidity ? `${data.humidity}%` : "N/A",
        icon: <Droplets className="h-5 w-5" />,
      },
      {
        name: "Wind Speed",
        value: data.windSpeed ? `${data.windSpeed} m/s` : "N/A",
        icon: <Wind className="h-5 w-5" />,
      },
      {
        name: "UV Index",
        value: data.uv || "N/A",
        icon: <Sun className="h-5 w-5" />,
      },
    ]);
  };

  // Handler for pollutants update from Weather component
  const handlePollutantsUpdate = (data) => {
    if (!data || !Array.isArray(data)) return;
  };

  // Handler for chart data updates
  const handleChartDataUpdate = (data) => {
    if (!data) return;

    // Update hourly air quality data
    if (data.hourlyData && Array.isArray(data.hourlyData)) {
      setAirQualityData(data.hourlyData);
    }

    // Update monthly data
    if (data.monthlyData && Array.isArray(data.monthlyData)) {
      setMonthlyData(data.monthlyData);
    }
  };

  // Function to handle location selection from dropdown
  const handleLocationChange = (locationData) => {
    setIsLoading(true);
    try {
      const { location, lat, lon, aqi } = locationData;
      
      // Update the selected location
      setSelectedCityName(location);
      setMapLocation({ lat, lon });
      setCurrentAQI(aqi);
      setUserLocation(location);
      setRiskLevel(determineRiskLevel(aqi));
      
      // Add to allCityData if not already there
      setAllCityData(prevData => ({
        ...prevData,
        [location]: { lat, lon, aqi }
      }));
    } catch (error) {
      console.error("Error handling location data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle marker click on the map
  const handleMapMarkerClick = (cityName, cityData) => {
    setIsLoading(true);
    try {
      // Update the selected location
      setSelectedCityName(cityName);
      setMapLocation({ lat: cityData.lat, lon: cityData.lon });
      setCurrentAQI(cityData.aqi);
      setUserLocation(cityName);
      setRiskLevel(determineRiskLevel(cityData.aqi));
    } catch (error) {
      console.error("Error handling marker click:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset map view to show all of Malaysia
  const [resetView, setResetView] = useState(false);
  
  const handleResetMapView = () => {
    setMapLocation(null);
    setSelectedCityName("");
    setUserLocation("All Stations, Malaysia");
    setCurrentAQI(0);
    setRiskLevel("Select a city to see details");
    // Reset weather factors to "No city selected"
    setWeatherFactors([
      {
        name: "Temperature",
        value: "No city selected",
        icon: <Thermometer className="h-5 w-5" />,
      },
      {
        name: "Humidity",
        value: "No city selected",
        icon: <Droplets className="h-5 w-5" />,
      },
      {
        name: "Wind Speed",
        value: "No city selected",
        icon: <Wind className="h-5 w-5" />,
      },
      {
        name: "UV Index",
        value: "No city selected",
        icon: <Sun className="h-5 w-5" />,
      },
    ]);
    
    // Trigger map reset
    setResetView(true);
    // Reset after a short delay
    setTimeout(() => {
      setResetView(false);
    }, 100);
  };

  // Function to update all city data with AQI values
  const updateAllCityData = (cityData) => {
    if (!cityData) return;
    setAllCityData(prevData => ({
      ...prevData,
      ...cityData
    }));
  };

  // Helper function to determine risk level based on AQI
  const determineRiskLevel = (aqi) => {
    if (aqi <= 50) {
      return "Good";
    } else if (aqi <= 100) {
      return "Moderate";
    } else if (aqi <= 150) {
      return "Unhealthy for Sensitive Groups";
    } else if (aqi <= 200) {
      return "Unhealthy";
    } else if (aqi <= 300) {
      return "Very Poor";
    } else {
      return "Hazardous";
    }
  };

  const getRiskColor = (aqi) => {
    if (aqi <= 50) return "text-green-500"; // Good
    if (aqi <= 100) return "text-yellow-400"; // Fair (matches button)
    if (aqi <= 150) return "text-orange-500"; // Moderate (matches button)
    if (aqi <= 200) return "text-red-600"; // Poor (matches button)
    if (aqi <= 300) return "text-purple-600"; // Very Unhealthy (matches button)
    return "text-purple-900"; // Hazardous (matches button)
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Hidden Weather component to fetch data */}
      <Weather
        location={mapLocation}
        onWeatherDataUpdate={handleWeatherDataUpdate}
        onPollutantsUpdate={handlePollutantsUpdate}
        onChartDataUpdate={handleChartDataUpdate}
      />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-500" />
            Blue Breath
          </h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              {["dashboard", "routes", "learn-about-air-quality"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "routes"
                    ? "Route Planner"
                    : tab.replace(/-/g, " ").charAt(0).toUpperCase() +
                      tab.replace(/-/g, " ").slice(1)}
                </button>
              ))}
            </div>
            {activeTab === "dashboard" && (
              <button
                onClick={handleResetMapView}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Show All Stations
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <>
              {/* Location Dropdown and Map */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Select Location
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Choose a city to view air quality data
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {/* Create a stacking context for proper z-index behavior */}
                  <div style={{ position: 'relative', zIndex: 1000 }}>
                    <LocationDropdown
                      onLocationChange={handleLocationChange}
                      isLoading={isLoading}
                      onAllCityDataUpdate={updateAllCityData}
                    />
                  </div>
                  
                  {/* Map section */}
                  <div className="h-96 mt-4" style={{ position: 'relative', zIndex: 1 }}>
                    <MapView 
                      location={mapLocation} 
                      allCityData={allCityData}
                      selectedLocation={selectedCityName}
                      onLocationSelect={handleMapMarkerClick}
                      resetView={resetView}
                    />
                  </div>
                </div>
              </div>

          
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

              {/* Forecast Chart left 2/3 */}
              <div className="md:col-span-2 flex flex-col h-full" >
                <div className="mb-6 bg-white overflow-hidden shadow rounded-lg p-6 flex flex-col h-full">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">7-days AQI Forecast</h3>
                  <div className="flex items-center mb-4">
                    <label htmlFor="station-select" className="mr-3 text-sm font-medium text-gray-700">Choose Station:</label>
                    <select
                      id="station-select"
                      className="border-gray-300 rounded-md shadow-sm text-sm"
                      value={selectedStation}
                      onChange={(e) => setSelectedStation(e.target.value)}
                    >
                      {stations.map((station) => (
                        <option key={station} value={station}>{station}</option>
                      ))}
                    </select>
                  </div>
                  <div className="h-[500px]">  {/* You can adjust the height yourself */}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          interval={0} 
                          angle={-45} 
                          textAnchor="end" 
                          height={100} 
                          tickFormatter={(tick) => dayjs(tick).format('YYYY-MM-DD')} 
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />}/>
                        <Line 
                          type="monotone" 
                          dataKey="aqi"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={true}
                          connectNulls
                          name="AQI"
                        />
                        <Line 
                          type="monotone" 
                          dataKey={(d) => d.isForecast ? d.aqi : null} 
                          stroke="#EF4444" 
                          strokeWidth={2}
                          dot={true}
                          connectNulls
                          name="Forecast AQI"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

                {/* Right Side - Air Quality Alert with Weather Factors (1/3 width) */}
                <div className="bg-white shadow rounded-lg md:col-span-1 flex flex-col h-full">
                  <div className="px-4 py-5 sm:px-6 flex flex-col h-full">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-md font-medium text-gray-900">
                          Current Air Quality
                        </h3>
                        <p className="text-xs text-gray-500">
                          Real-time monitoring
                        </p>
                      </div>
                      <div className="text-center">
                        {selectedCityName ? (
                          <div>
                            <div
                              className={`text-4xl font-bold ${getRiskColor(
                                currentAQI
                              )}`}
                            >
                              {currentAQI} AQI
                            </div>
                            <div className="text-sm text-gray-500">AQI</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Select a city to view AQI
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-base font-medium text-gray-900">
                        Risk Level:{" "}
                        {selectedCityName ? (
                          <span className={getRiskColor(currentAQI)}>
                            {riskLevel}
                          </span>
                        ) : (
                          <span className="text-gray-500">No city selected</span>
                        )}
                      </h4>
                      {selectedCityName ? (
                        <p className="mt-1 text-sm text-gray-600">
                          {riskLevel === "Good"
                            ? "Air quality is good and poses little or no risk for asthma symptoms."
                            : riskLevel === "Fair"
                            ? "Air quality is acceptable but may cause minor symptoms for very sensitive individuals."
                            : riskLevel === "Moderate"
                            ? "Members of sensitive groups may experience health effects. Consider medication."
                            : riskLevel === "Poor"
                            ? "Health alert: Everyone may experience health effects. Limit outdoor activities."
                            : "Health warning: Everyone may experience serious health effects. Avoid outdoor activities."}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-600">
                          Select a city from the dropdown above to view detailed air quality information.
                        </p>
                      )}
                    </div>

                    {/* Weather Factors - Inside the Current Air Quality box */}
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Weather Factors
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {weatherFactors.map((factor) => (
                          <div key={factor.name} className="flex items-center">
                            <div className="flex-shrink-0 mr-3 text-gray-400">
                              {factor.icon}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                {factor.name}
                              </div>
                              <div className="font-medium">{factor.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "routes" && (
            <div className="bg-white overflow-hidden shadow rounded-lg h-full">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Asthma-Safe Route Planner
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Find travel routes with minimal exposure to pollutants
                </p>
              </div>
              <div className="h-full">
                <AsthmaSafeRoutePlanner />
              </div>
            </div>
          )}

          {activeTab === "learn-about-air-quality" && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Learn About Air Quality
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Educational content, self-tests, and preventive measures
                </p>
              </div>
              <div className="h-full">
                <EducationalInsights />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AirQualityDashboard;