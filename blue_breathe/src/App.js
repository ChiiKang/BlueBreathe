import React, { useState, useEffect } from 'react';
import { Bell, Wind, Thermometer, Droplets, Sun, AlertTriangle, MapPin, Activity, Users, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AirQualityDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userLocation, setUserLocation] = useState('New York, NY');
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
            AsthmaAir Monitor
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              {userLocation}
            </div>
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-8">
            {['dashboard', 'analytics', 'alerts', 'profiles'].map((tab) => (
              <button
                key={tab}
                className={`px-3 py-4 text-sm font-medium border-b-2 ${
                  activeTab === tab 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

          {activeTab === 'alerts' && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Alert Settings</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Alert Thresholds</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input id="aqi-alerts" name="aqi-alerts" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                          <label htmlFor="aqi-alerts" className="ml-2 block text-sm text-gray-900">
                            AQI exceeds
                          </label>
                        </div>
                        <select className="mt-1 block w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <option>50</option>
                          <option>100</option>
                          <option>150</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input id="pm25-alerts" name="pm25-alerts" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                          <label htmlFor="pm25-alerts" className="ml-2 block text-sm text-gray-900">
                            PM2.5 exceeds
                          </label>
                        </div>
                        <select className="mt-1 block w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <option>12 μg/m³</option>
                          <option>35 μg/m³</option>
                          <option>55 μg/m³</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input id="pollen-alerts" name="pollen-alerts" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                          <label htmlFor="pollen-alerts" className="ml-2 block text-sm text-gray-900">
                            Pollen count is
                          </label>
                        </div>
                        <select className="mt-1 block w-24 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                          <option>Moderate</option>
                          <option>High</option>
                          <option>Very High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Notification Methods</h4>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <input id="push-notifications" name="push-notifications" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                        <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-900">
                          Push notifications
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input id="email-notifications" name="email-notifications" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                        <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
                          Email
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input id="sms-notifications" name="sms-notifications" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                        <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900">
                          SMS
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Alert Frequency</h4>
                    <div className="mt-4">
                      <select className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <option>Immediately when conditions change</option>
                        <option>Maximum once per hour</option>
                        <option>Maximum once per day</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Cancel
                      </button>
                      <button type="submit" className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Child Profiles</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your children's asthma profiles</p>
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Add Profile
                </button>
              </div>
              <div className="border-t border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  {childProfiles.map((profile) => (
                    <div key={profile.id} className="mb-6 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-3">
                            <Users className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="ml-3">
                            <h4 className="text-lg font-medium text-gray-900">{profile.name}</h4>
                            <p className="text-sm text-gray-500">Age: {profile.age}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium text-gray-500">Asthma Severity</div>
                          <div className="mt-1 font-medium">{profile.asthmaLevel}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium text-gray-500">Last Flare-up</div>
                          <div className="mt-1 font-medium">{profile.lastFlareUp}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium text-gray-500">Medication</div>
                          <div className="mt-1 font-medium">Albuterol</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm font-medium text-gray-500">Triggers</div>
                          <div className="mt-1 font-medium">Pollen, Exercise, Cold air</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Detailed History</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AirQualityDashboard;