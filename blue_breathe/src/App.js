import React, { useState, useEffect } from "react";
import {
  Bell,
  Wind,
  Thermometer,
  Droplets,
  Sun,
  AlertTriangle,
  MapPin,
  Activity,
  Users,
  Calendar,
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
  AreaChart,
  Area,
} from "recharts";

import dayjs from 'dayjs';

import MapView from "./components/MapView";
import Weather from "./components/Weather";
import LocationSearch from "./components/LocationSearch";
import AsthmaSafeRoutePlanner from "./components/AsthmaSafeRoutePlanner";
import EducationalInsights from "./components/EducationalInsights";

const AirQualityDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userLocation, setUserLocation] = useState("Kuala Lumpur, MY");
  const [currentAQI, setCurrentAQI] = useState(2); // Default AQI (Fair)
  const [riskLevel, setRiskLevel] = useState("Fair");
  const [isLoading, setIsLoading] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

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

          // const historicalPoints = historical.map(d => ({
          //   date: d.date,
          //   historicalAQI: d.aqi,
          //   forecastAQI: null
          // }));

          // const forecastPoints = forecast.map(d => ({
          //   date: d.date,
          //   historicalAQI: null,
          //   forecastAQI: d.aqi
          // }));

          // setChartData([...historicalPoints, ...forecastPoints]);

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




  // Chart data with default empty arrays
  const [airQualityData, setAirQualityData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

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
      value: "Loading...",
      icon: <Thermometer className="h-5 w-5" />,
    },
    {
      name: "Humidity",
      value: "Loading...",
      icon: <Droplets className="h-5 w-5" />,
    },
    {
      name: "Wind Speed",
      value: "Loading...",
      icon: <Wind className="h-5 w-5" />,
    },
    {
      name: "UV Index",
      value: "Loading...",
      icon: <Sun className="h-5 w-5" />,
    },
  ]);

  // Function to handle weather data updates from Weather component
  const handleWeatherDataUpdate = (data) => {
    if (!data) return; // Guard clause to prevent errors with null data

    setWeatherData(data);
    setCurrentAQI(data.aqi || currentAQI); // Fallback to current value if aqi is undefined
    setRiskLevel(determineRiskLevel(data.aqi || currentAQI));

    // Update weather factors with real data
    if (data) {
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
    }
  };

  // Handler for pollutants update from Weather component
  const handlePollutantsUpdate = (data) => {
    if (!data || !Array.isArray(data)) return;
    setPollutants(data);
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

  // Function to get current weather factors
  const getWeatherFactors = () => {
    if (!weatherData) {
      return [
        {
          name: "Temperature",
          value: "Loading...",
          icon: <Thermometer className="h-5 w-5" />,
        },
        {
          name: "Humidity",
          value: "Loading...",
          icon: <Droplets className="h-5 w-5" />,
        },
        {
          name: "Wind Speed",
          value: "Loading...",
          icon: <Wind className="h-5 w-5" />,
        },
        {
          name: "UV Index",
          value: "Loading...",
          icon: <Sun className="h-5 w-5" />,
        },
      ];
    }

    return [
      {
        name: "Temperature",
        value: weatherData.temperature ? `${weatherData.temperature}°C` : "N/A",
        icon: <Thermometer className="h-5 w-5" />,
      },
      {
        name: "Humidity",
        value: weatherData.humidity ? `${weatherData.humidity}%` : "N/A",
        icon: <Droplets className="h-5 w-5" />,
      },
      {
        name: "Wind Speed",
        value: weatherData.windSpeed ? `${weatherData.windSpeed} m/s` : "N/A",
        icon: <Wind className="h-5 w-5" />,
      },
      {
        name: "UV Index",
        value: weatherData.uv || "N/A",
        icon: <Sun className="h-5 w-5" />,
      },
    ];
  };

  // Function to handle location search
  const handleLocationChange = async (location) => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll use a simple mapping of locations to coordinates
      const locationMap = {
        "kuala lumpur": { lat: 3.139, lon: 101.6869, aqi: 2 },
        "petaling jaya": { lat: 3.0833, lon: 101.65, aqi: 3 },
        "shah alam": { lat: 3.0731, lon: 101.518, aqi: 2 },
        "subang jaya": { lat: 3.0586, lon: 101.5851, aqi: 3 },
        penang: { lat: 5.4141, lon: 100.3288, aqi: 1 },
        "johor bahru": { lat: 1.4927, lon: 103.7414, aqi: 3 },
      };

      // Find the matching location (case insensitive)
      const locationKey = Object.keys(locationMap).find((key) =>
        location.toLowerCase().includes(key)
      );

      if (locationKey) {
        const { lat, lon, aqi } = locationMap[locationKey];
        setMapLocation({ lat, lon });
        setCurrentAQI(aqi);
        setUserLocation(location);
        setRiskLevel(determineRiskLevel(aqi));
      } else {
        // In a real app, you would call a geocoding API here
        console.log("Location not found in our demo data");
        // For demo, we'll just use KL as fallback
        setMapLocation({ lat: 3.139, lon: 101.6869 });
        setCurrentAQI(2);
        setUserLocation(location);
        setRiskLevel("Fair");
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine risk level based on AQI from OpenWeatherMap
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Good":
        return "bg-green-100 text-green-800";
      case "Fair":
        return "bg-blue-100 text-blue-800";
      case "Moderate":
        return "bg-yellow-100 text-yellow-800";
      case "Poor":
        return "bg-orange-100 text-orange-800";
      case "Very Poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskColor = (aqi) => {
    if (aqi <= 50) {
      return "text-green-500"; // Good
    } else if (aqi <= 100) {
      return "text-blue-500"; // Fair
    } else if (aqi <= 150) {
      return "text-yellow-500"; // Moderate
    } else if (aqi <= 200) {
      return "text-orange-500"; // Poor
    } else if (aqi <= 300) {
      return "text-red-500"; // Very Unhealthy
    } else {
      return "text-purple-600"; // Hazardous
    }
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              {userLocation}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === "dashboard" && (
            <>
              {/* Location Search and Map */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Search Location
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Enter a location to view air quality data
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <LocationSearch
                    onLocationChange={handleLocationChange}
                    isLoading={isLoading}
                  />
                  <div className="h-96 mt-4">
                    {" "}
                    {/* Changed from h-64 to h-96 (384px) */}
                    <MapView location={mapLocation} aqi={currentAQI} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Side - Today's Trend (2/3 width) */}
                <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      Today's Air Quality Trend
                    </h3>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="h-64">
                      {airQualityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={airQualityData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="time" />
                            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                            <Tooltip
                              formatter={(value, name) => {
                                if (name === "aqi") {
                                  const labels = [
                                    "",
                                    "Good",
                                    "Fair",
                                    "Moderate",
                                    "Poor",
                                    "Very Poor",
                                  ];
                                  const aqiLabel = labels[value] || value;
                                  const dataPoint = airQualityData.find(
                                    (d) => d.aqi === value
                                  );
                                  const pm25Value = dataPoint?.pm25
                                    ? `PM2.5: ${dataPoint.pm25.toFixed(
                                        1
                                      )} μg/m³`
                                    : "";
                                  return [
                                    `${aqiLabel} ${
                                      pm25Value ? `(${pm25Value})` : ""
                                    }`,
                                    "AQI",
                                  ];
                                }
                                return [value, name];
                              }}
                            />
                            <Line
                              type="monotone"
                              name="AQI"
                              dataKey="aqi"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              dot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-gray-400">
                            Loading chart data...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Air Quality Alert with Weather Factors (1/3 width) */}
                <div className="bg-white shadow rounded-lg md:col-span-1">
                  <div className="px-4 py-5 sm:px-6">
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
                        <div
                          className={`text-4xl font-bold ${getRiskColor(
                            currentAQI
                          )}`}
                        >
                          {currentAQI} AQI
                        </div>
                        <div className="text-sm text-gray-500">AQI</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-base font-medium text-gray-900">
                        Risk Level:{" "}
                        <span className={getRiskColor(currentAQI)}>
                          {riskLevel}
                        </span>
                      </h4>
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
                    </div>

                    {/* Weather Factors - Inside the Current Air Quality box */}
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Weather Factors
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {getWeatherFactors().map((factor) => (
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

              {/* Two-column layout for Key Pollutants & Weather Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
              {/* Pollutants */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Key Pollutants
                  </h3>
                </div>
                <div className="px-4 py-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pollutants.map((item) => (
                      <div
                        key={item.name}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-2xl font-bold mt-1">
                          {item.value}
                        </div>
                        <div
                          className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg p-6">
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
                <div className="h-[800px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {/* <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" interval={0} angle={-45} textAnchor="end" height={300} tickFormatter={(tick) => dayjs(tick).format('YYYY-MM-DD')}/>
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="historicalAQI" stroke="#3B82F6" name="Historical AQI" />
                      <Line type="monotone" dataKey="forecastAQI" stroke="#EF4444" strokeDasharray="5 5" name="Forecast AQI" />
                    </LineChart> */}
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
                        <Tooltip />

                        {/* Blue line, the entire AQI line, no gaps */}
                        <Line 
                          type="monotone" 
                          dataKey="aqi"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={true}
                          connectNulls
                          name="AQI"
                        />

                        {/* The forecast segment has an additional red line overlaying the forecast area */}
                        <Line 
                          type="monotone" 
                          dataKey={(d) => d.isForecast ? d.aqi : null} 
                          stroke="#EF4444" 
                          // strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={true}
                          connectNulls
                          name="Forecast AQI"
                        />
                      </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>




            </>
          )}

          {activeTab === "analytics" && (
            <>
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Air Quality & Asthma Correlation
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-80">
                    {monthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={monthlyData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis
                            yAxisId="left"
                            domain={[0, 5]}
                            ticks={[1, 2, 3, 4, 5]}
                          />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            formatter={(value, name) => {
                              if (name === "aqi") {
                                const labels = [
                                  "",
                                  "Good",
                                  "Fair",
                                  "Moderate",
                                  "Poor",
                                  "Very Poor",
                                ];
                                return [labels[value] || value, "AQI"];
                              }
                              return [
                                value,
                                name === "flareUps" ? "Flare-ups" : name,
                              ];
                            }}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            name="AQI"
                            dataKey="aqi"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.3}
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            name="Flare-ups"
                            dataKey="flareUps"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-gray-400">
                          Loading chart data...
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <div className="flex justify-center space-x-8 mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-300 mr-2"></div>
                        <span>Air Quality Index (AQI)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-300 mr-2"></div>
                        <span>Asthma Flare-ups</span>
                      </div>
                    </div>
                    <div className="text-xs text-center">
                      AQI Scale: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Insights & Recommendations
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Pattern Detected
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          Higher asthma flare-ups occur when AQI is Moderate or
                          worse for 3+ consecutive days.
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Seasonal Impact
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          March-April showed highest correlation between poor
                          air quality and asthma symptoms.
                        </p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Droplets className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Humidity Factor
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          Asthma symptoms increase when humidity exceeds 70%
                          combined with moderate AQI.
                        </p>
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
