import React, { useState, useEffect } from 'react';
import { Bell, Wind, Thermometer, Droplets, Sun, AlertTriangle, MapPin, Activity, Users, Calendar, Navigation } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AsthmaSafeRoutePlanner from './components/AsthmaSafeRoutePlanner';
import EducationalInsights from './components/EducationalInsights';

const AirQualityDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userLocation, setUserLocation] = useState('Kuala Lumpur, MY');
  const [currentAQI, setCurrentAQI] = useState(42);
  const [riskLevel, setRiskLevel] = useState('Good');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [childProfiles, setChildProfiles] = useState([
    { id: 1, name: 'Alex', age: 8, asthmaLevel: 'Moderate', lastFlareUp: '2 weeks ago' }
  ]);

  // Sample data for charts
  const airQualityData = [
    { time: '6 AM', aqi: 32, pm25: 12 },
    { time: '9 AM', aqi: 38, pm25: 15 },
    { time: '12 PM', aqi: 45, pm25: 18 },
    { time: '3 PM', aqi: 52, pm25: 22 },
    { time: '6 PM', aqi: 48, pm25: 20 },
    { time: '9 PM', aqi: 42, pm25: 17 }
  ];

  const monthlyData = [
    { month: 'Jan', aqi: 38, flareUps: 2 },
    { month: 'Feb', aqi: 42, flareUps: 3 },
    { month: 'Mar', aqi: 55, flareUps: 5 },
    { month: 'Apr', aqi: 48, flareUps: 3 },
    { month: 'May', aqi: 35, flareUps: 1 },
    { month: 'Jun', aqi: 40, flareUps: 2 }
  ];

  const weatherFactors = [
    { name: 'Temperature', value: '72°F', icon: <Thermometer className="h-5 w-5" /> },
    { name: 'Humidity', value: '65%', icon: <Droplets className="h-5 w-5" /> },
    { name: 'Wind Speed', value: '8 mph', icon: <Wind className="h-5 w-5" /> },
    { name: 'UV Index', value: 'Moderate', icon: <Sun className="h-5 w-5" /> }
  ];

  const pollutants = [
    { name: 'PM2.5', value: '15 μg/m³', status: 'Good', description: 'Fine particulate matter' },
    { name: 'Ozone', value: '0.048 ppm', status: 'Moderate', description: 'Ground level ozone' },
    { name: 'NO2', value: '25 ppb', status: 'Good', description: 'Nitrogen dioxide' },
    { name: 'Pollen', value: 'Moderate', status: 'Caution', description: 'Tree and grass pollen' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Caution': return 'bg-orange-100 text-orange-800';
      case 'Unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (aqi) => {
    if (aqi <= 50) return 'text-green-500';
    if (aqi <= 100) return 'text-yellow-500';
    if (aqi <= 150) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
          {['dashboard', 'routes', 'learn-about-air-quality'].map((tab) => (
            <button
              key={tab}
              className={`px-3 py-4 text-sm font-medium border-b-2 ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'routes' ? 'Route Planner' : tab.replace(/-/g, ' ').charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <>
              {/* Alert */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Current Air Quality</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Real-time monitoring for your location</p>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getRiskColor(currentAQI)}`}>{currentAQI}</div>
                    <div className="text-sm text-gray-500">AQI</div>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="sm:flex sm:items-center sm:justify-between">
                    <div className="mb-4 sm:mb-0">
                      <h4 className="text-base font-medium text-gray-900">Risk Level: <span className={getRiskColor(currentAQI)}>{riskLevel}</span></h4>
                      <p className="mt-1 text-sm text-gray-600">Air quality is currently good for children with asthma.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Trend */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Today's Air Quality Trend</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={airQualityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="aqi" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Pollutants */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Key Pollutants</h3>
                </div>
                <div className="px-4 py-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pollutants.map((item) => (
                      <div key={item.name} className="bg-gray-50 rounded-lg p-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-2xl font-bold mt-1">{item.value}</div>
                        <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weather Factors */}
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Weather Factors</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {weatherFactors.map((factor) => (
                      <div key={factor.name} className="flex items-center">
                        <div className="flex-shrink-0 mr-3 text-gray-400">
                          {factor.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">{factor.name}</div>
                          <div className="font-medium">{factor.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <>
              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Air Quality & Asthma Correlation</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Area yAxisId="left" type="monotone" dataKey="aqi" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                        <Area yAxisId="right" type="monotone" dataKey="flareUps" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-sm text-gray-500 flex justify-center space-x-8">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-300 mr-2"></div>
                      <span>Average AQI</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-300 mr-2"></div>
                      <span>Asthma Flare-ups</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">Insights & Recommendations</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Pattern Detected</h4>
                        <p className="mt-1 text-sm text-gray-500">Higher asthma flare-ups occur when AQI exceeds 50 for 3+ consecutive days.</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Seasonal Impact</h4>
                        <p className="mt-1 text-sm text-gray-500">March-April showed highest correlation between poor air quality and asthma symptoms.</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Droplets className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Humidity Factor</h4>
                        <p className="mt-1 text-sm text-gray-500">Asthma symptoms increase when humidity exceeds 70% combined with moderate AQI.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'routes' && (
            <div className="bg-white overflow-hidden shadow rounded-lg h-full">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Asthma-Safe Route Planner</h3>
                <p className="mt-1 text-sm text-gray-500">Find travel routes with minimal exposure to pollutants</p>
              </div>
              <div className="h-full">
                <AsthmaSafeRoutePlanner />
              </div>
            </div>
          )}

          {activeTab === 'learn-about-air-quality' && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Learn About Air Quality</h3>
                <p className="mt-1 text-sm text-gray-500">Educational content, self-tests, and preventive measures</p>
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