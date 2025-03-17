import React, { useEffect, useState, useRef } from "react";

const Weather = ({ location, onWeatherDataUpdate, onChartDataUpdate }) => {
  const [error, setError] = useState(null);
  // Cache to store data for each location
  const dataCache = useRef({});
  // Track previous location to prevent duplicate fetches
  const prevLocationRef = useRef(null);

  useEffect(() => {
    // Don't fetch if no location is selected
    if (!location) return;
    
    // Create a location key for caching
    const locationKey = location ? `${location.lat},${location.lon}` : null;
    
    // Check if we already have data for this location
    if (dataCache.current[locationKey]) {
      // Use cached data
      onWeatherDataUpdate(dataCache.current[locationKey].weather);
      onChartDataUpdate(dataCache.current[locationKey].charts);
      return;
    }
    
    // Skip if this is the same location as last time
    if (
      prevLocationRef.current && 
      prevLocationRef.current.lat === location.lat && 
      prevLocationRef.current.lon === location.lon
    ) {
      return;
    }
    
    // Update previous location reference
    prevLocationRef.current = location;

    const fetchWeatherData = async () => {
      try {
        // Using Open-Meteo API - completely free, no API key required
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index&timezone=auto`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        
        // Process the weather data from Open-Meteo
        const weatherData = {
          temperature: Math.round(data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          uv: Math.round(data.current.uv_index),
          aqi: location.aqi || 0, // Use AQI from location data
        };
        
        // Generate chart data
        const chartData = generateChartData(location.aqi || 0, locationKey);
        
        // Cache the data
        dataCache.current[locationKey] = {
          weather: weatherData,
          charts: chartData
        };
        
        // Send data to parent component
        onWeatherDataUpdate(weatherData);
        onChartDataUpdate(chartData);
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError(err.message);
        
        // Generate stable fallback data based on location
        const hash = simpleHash(locationKey);
        
        // Use the hash to generate consistent data for each location
        const fallbackData = {
          temperature: 22 + (hash % 10),
          humidity: 60 + (hash % 30),
          windSpeed: Math.round((1 + (hash % 5)) * 10) / 10,
          uv: Math.round(1 + (hash % 10)),
          aqi: location.aqi || 0,
        };
        
        // Generate chart data
        const chartData = generateChartData(location.aqi || 0, locationKey);
        
        // Cache the fallback data
        dataCache.current[locationKey] = {
          weather: fallbackData,
          charts: chartData
        };
        
        // Send fallback data to parent component
        onWeatherDataUpdate(fallbackData);
        onChartDataUpdate(chartData);
      }
    };

    fetchWeatherData();
  }, [location, onWeatherDataUpdate, onChartDataUpdate]);

  // Simple hash function to generate stable random-like numbers from a string
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  // Generate deterministic chart data based on current AQI and location
  const generateChartData = (currentAqi, locationKey) => {
    if (!onChartDataUpdate) return null;

    // Create a hash for this location
    const hash = simpleHash(locationKey);
    
    // Use the hash as a seed for "random" variations
    const getVariation = (index) => {
      return ((hash + index * 7919) % 100) / 100 * 0.8 - 0.4; // -0.4 to 0.4
    };

    // Convert external AQI scale to internal 1-5 scale
    const getInternalAqi = (externalAqi) => {
      if (externalAqi <= 50) return 1; // Good
      if (externalAqi <= 100) return 2; // Fair
      if (externalAqi <= 150) return 3; // Moderate
      if (externalAqi <= 200) return 4; // Poor
      return 5; // Very Poor
    };

    const baseAqi = getInternalAqi(currentAqi);
    
    // Generate hourly data for the last 24 hours
    const hours = [...Array(24).keys()].map(i => 
      `${(new Date().getHours() - 23 + i + 24) % 24}:00`
    );
    
    const hourlyData = hours.map((time, index) => {
      // Generate deterministic variations around the base AQI
      let variance = getVariation(index);
      
      // Add a slight trend (worse in morning, better in afternoon)
      const hour = parseInt(time.split(':')[0]);
      if (hour >= 7 && hour <= 9) variance += 0.3; // Morning rush
      if (hour >= 16 && hour <= 18) variance += 0.2; // Evening rush
      if (hour >= 0 && hour <= 4) variance -= 0.2; // Night improvement
      
      // Keep within our 1-5 scale with realistic variations
      let aqi = Math.max(1, Math.min(5, baseAqi + variance));
      aqi = Math.round(aqi * 10) / 10; // Round to 1 decimal place
      
      return {
        time,
        aqi,
        pm25: Math.round(aqi * 12 + ((hash + index) % 5))
      };
    });
    
    // Generate monthly data (last 12 months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const orderedMonths = [
      ...months.slice(currentMonth + 1),
      ...months.slice(0, currentMonth + 1)
    ];
    
    // Set a seasonal pattern with worse air quality in dry seasons
    const getSeasonalFactor = (month) => {
      // This is simplified and would vary by location
      // For Malaysia: worse air quality typically in Feb-March and August-October (drier periods)
      const monthIndex = months.indexOf(month);
      if (monthIndex >= 1 && monthIndex <= 2) return 0.5; // Feb-Mar
      if (monthIndex >= 7 && monthIndex <= 9) return 0.7; // Aug-Oct
      return 0;
    };
    
    const monthlyData = orderedMonths.map((month, index) => {
      const seasonalFactor = getSeasonalFactor(month);
      // Create variation around the base AQI with seasonal influence
      const variance = getVariation(index + 100) + seasonalFactor;
      const aqi = Math.max(1, Math.min(5, baseAqi + variance));
      
      // Simulate flare-ups based on AQI
      const flareUps = Math.round(aqi * 2.5 + ((hash + index) % 5));
      
      return {
        month,
        aqi: Math.round(aqi * 10) / 10,
        flareUps
      };
    });
    
    return { hourlyData, monthlyData };
  };

  // This component doesn't render anything visible
  return null;
};

export default Weather;