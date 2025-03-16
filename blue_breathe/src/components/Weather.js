import React, { useState, useEffect, useRef } from "react";
import { safeFetch } from "../utils/apiClient"; // Import the API limiter

// Safely access API key; fallback to null to avoid errors if not defined
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || null;

const Weather = ({
  location,
  onWeatherDataUpdate,
  onPollutantsUpdate,
  onChartDataUpdate,
}) => {
  const [weatherData, setWeatherData] = useState(null);
  const [pollutantData, setPollutantData] = useState(null);
  const [chartData, setChartData] = useState({
    hourlyData: [],
    monthlyData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiLimitReached, setApiLimitReached] = useState(false);
  

  // Use ref to track previous location to prevent unnecessary updates
  const prevLocationRef = useRef(null);

  // Track if component is mounted for cleanup
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag when component mounts
    isMountedRef.current = true;

    // Cleanup function to set mounted flag to false when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if there's no location
    if (!location) return;

    // Skip if the location hasn't changed (prevents infinite loops)
    if (
      prevLocationRef.current &&
      prevLocationRef.current.lat === location.lat &&
      prevLocationRef.current.lon === location.lon
    ) {
      return;
    }

    // Update our reference to current location
    prevLocationRef.current = { ...location };

    const fetchData = async () => {
      // If API limit has been reached, use mock data instead
      if (apiLimitReached) {
        const { mockWeatherData, mockPollutants, mockChartData } =
          getMockData(location);
        if (isMountedRef.current) {
          setWeatherData(mockWeatherData);
          setPollutantData(mockPollutants);
          setChartData(mockChartData);
          onWeatherDataUpdate(mockWeatherData);
          onPollutantsUpdate(mockPollutants);
          onChartDataUpdate(mockChartData);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (API_KEY) {
          // Calculate time ranges for history API
          const now = Math.floor(Date.now() / 1000); // Current time in seconds
          const oneDayAgo = now - 24 * 60 * 60; // 24 hours ago

          // Parallel fetch multiple API endpoints
          const [weatherData, currentAqiData, historicalAqiData] =
            await Promise.all([
              // Current weather
              safeFetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${API_KEY}`
              ),
              // Current air quality
              safeFetch(
                `https://api.openweathermap.org/data/2.5/air_pollution?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}`
              ),
              // Historical air quality (past 24 hours)
              safeFetch(
                `https://api.openweathermap.org/data/2.5/air_pollution/history?lat=${location.lat}&lon=${location.lon}&start=${oneDayAgo}&end=${now}&appid=${API_KEY}`
              ),
            ]);


            const convertAQI = (aqi) => {
              // Convert OpenWeatherMap AQI (1-5) to standard 0-500
              const aqiScale = {
                1: 0,    // Good (0-50)
                2: 50,   // Fair (51-100)
                3: 100,  // Moderate (101-150)
                4: 200,  // Poor (151-200)
                5: 300   // Very Poor (201-300+)
              };
            
              return aqiScale[aqi] || 0; // Default to 0 if undefined
            };

          // Check if we got valid responses
          if (weatherData?.main && currentAqiData?.list?.[0]) {
            // Process current weather data
            const combinedWeatherData = {
              location: location.name || "Current Location",
              temperature: Math.round(weatherData.main.temp),
              humidity: weatherData.main.humidity,
              windSpeed: weatherData.wind.speed,
              description: weatherData.weather[0].description,
              aqi: convertAQI(currentAqiData.list[0].main.aqi),
              uv: getUVIndex(weatherData.weather[0].id),
            };

            // Process current pollutant data
            const components = currentAqiData.list[0].components;
            const pollutants = [
              {
                name: "PM2.5",
                value: `${components.pm2_5.toFixed(1)} μg/m³`,
                rawValue: components.pm2_5,
                status: getAQILevel(components.pm2_5, "pm2_5"),
                description: "Fine particulate matter",
              },
              {
                name: "O3",
                value: `${components.o3.toFixed(1)} μg/m³`,
                rawValue: components.o3,
                status: getAQILevel(components.o3, "o3"),
                description: "Ground level ozone",
              },
              {
                name: "NO2",
                value: `${components.no2.toFixed(1)} μg/m³`,
                rawValue: components.no2,
                status: getAQILevel(components.no2, "no2"),
                description: "Nitrogen dioxide",
              },
              {
                name: "PM10",
                value: `${components.pm10.toFixed(1)} μg/m³`,
                rawValue: components.pm10,
                status: getAQILevel(components.pm10, "pm10"),
                description: "Coarse particulate matter",
              },
            ];

            // Process historical data for charts
            const processedChartData = processChartData(
              historicalAqiData,
              currentAqiData
            );

            if (isMountedRef.current) {
              setWeatherData(combinedWeatherData);
              setPollutantData(pollutants);
              setChartData(processedChartData);
              onWeatherDataUpdate(combinedWeatherData);
              onPollutantsUpdate(pollutants);
              onChartDataUpdate(processedChartData);
            }
          } else {
            throw new Error("Invalid API response format");
          }
        } else {
          // No API key, use mock data
          throw new Error("API key not available");
        }
      } catch (err) {
        console.error("Error fetching weather data:", err);

        // Check if it's an API limit error
        if (err.message === "Daily API limit exceeded") {
          setApiLimitReached(true);

          // Use mock data instead
          const { mockWeatherData, mockPollutants, mockChartData } =
            getMockData(location);
          if (isMountedRef.current) {
            setWeatherData(mockWeatherData);
            setPollutantData(mockPollutants);
            setChartData(mockChartData);
            onWeatherDataUpdate(mockWeatherData);
            onPollutantsUpdate(mockPollutants);
            onChartDataUpdate(mockChartData);
          }
        } else {
          if (isMountedRef.current) {
            setError(err.message || "Failed to fetch weather data");

            // Still provide mock data to prevent UI breakage
            const { mockWeatherData, mockPollutants, mockChartData } =
              getMockData(location);
            setWeatherData(mockWeatherData);
            setPollutantData(mockPollutants);
            setChartData(mockChartData);
            onWeatherDataUpdate(mockWeatherData);
            onPollutantsUpdate(mockPollutants);
            onChartDataUpdate(mockChartData);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [
    location,
    onWeatherDataUpdate,
    onPollutantsUpdate,
    onChartDataUpdate,
    apiLimitReached,
  ]);

  // Process API data into chart-friendly format
  const processChartData = (historicalAqiData, currentAqiData) => {
    // Default empty data
    const result = {
      hourlyData: [],
      monthlyData: [],
    };

    // Process historical hourly air quality data
    if (historicalAqiData?.list && historicalAqiData.list.length > 0) {
      // Sort by timestamp
      const sortedData = [...historicalAqiData.list].sort(
        (a, b) => a.dt - b.dt
      );

      // Take data points at regular intervals to create a chart with 8 points
      const step = Math.max(1, Math.floor(sortedData.length / 8));
      const sampledData = [];

      for (let i = 0; i < sortedData.length; i += step) {
        if (sampledData.length < 8 && i < sortedData.length) {
          const point = sortedData[i];
          const date = new Date(point.dt * 1000);
          const hour = date.getHours();
          const formattedHour = `${hour}:00`;

          sampledData.push({
            time: formattedHour,
            aqi: point.main.aqi,
            pm25: point.components.pm2_5,
            o3: point.components.o3,
            no2: point.components.no2,
          });
        }
      }

      // Add current data point if available
      if (currentAqiData?.list && currentAqiData.list.length > 0) {
        const currentPoint = currentAqiData.list[0];
        const now = new Date();
        const currentHour = now.getHours();
        const formattedCurrentHour = `${currentHour}:00`;

        // Check if we already have this hour
        const existingIndex = sampledData.findIndex(
          (item) => item.time === formattedCurrentHour
        );

        if (existingIndex >= 0) {
          // Replace with current data
          sampledData[existingIndex] = {
            time: formattedCurrentHour,
            aqi: currentPoint.main.aqi,
            pm25: currentPoint.components.pm2_5,
            o3: currentPoint.components.o3,
            no2: currentPoint.components.no2,
          };
        } else {
          // Add current data
          sampledData.push({
            time: formattedCurrentHour,
            aqi: currentPoint.main.aqi,
            pm25: currentPoint.components.pm2_5,
            o3: currentPoint.components.o3,
            no2: currentPoint.components.no2,
          });
        }
      }

      // Sort by time for proper chart display
      sampledData.sort((a, b) => {
        const hourA = parseInt(a.time.split(":")[0]);
        const hourB = parseInt(b.time.split(":")[0]);
        return hourA - hourB;
      });

      result.hourlyData = sampledData;
    }

    // Generate monthly data based on current air quality
    // Since we don't have actual historical monthly data from the API,
    // we'll generate realistic data based on current conditions
    const currentAQI = currentAqiData?.list?.[0]?.main?.aqi || 2;
    result.monthlyData = generateMonthlyData(currentAQI);

    return result;
  };

  // Generate realistic monthly data based on current conditions
  const generateMonthlyData = (currentAQI) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Asthma flare-ups are typically correlated with air quality,
    // with more flare-ups during months with poor air quality
    // We'll simulate this correlation for realistic data
    const baseFlareUps = currentAQI >= 3 ? 3 : currentAQI === 2 ? 2 : 1;

    // Generate data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      // Calculate month index with wrap-around for previous year
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = monthNames[monthIndex];

      // Spring months (typically worse for asthma due to pollen)
      const isSpringMonth = monthIndex >= 2 && monthIndex <= 4; // Mar-May

      // Create semi-random but realistic AQI and flare-ups data
      // More severe in spring months
      const monthAqi = isSpringMonth
        ? Math.min(5, currentAQI + Math.floor(Math.random() * 2)) // Spring months tend to be worse
        : Math.max(
            1,
            Math.min(
              5,
              currentAQI +
                (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2)
            )
          ); // Other months vary randomly

      // Flare-ups correlate with AQI
      const flareUps = Math.max(
        0,
        baseFlareUps +
          (isSpringMonth ? 2 : 0) +
          (monthAqi >= 3 ? 1 : -1) +
          Math.floor(Math.random() * 3) -
          1
      );

      monthlyData.push({ month: monthName, aqi: monthAqi, flareUps });
    }

    return monthlyData;
  };

  // Helper function to get AQI level status using OpenWeatherMap's scale
  const getAQILevel = (value, pollutant) => {
    // OpenWeatherMap Air Quality Index thresholds based on their documentation
    const thresholds = {
      pm2_5: {
        good: 10, // 0-10 μg/m³
        fair: 25, // 10-25 μg/m³
        moderate: 50, // 25-50 μg/m³
        poor: 75, // 50-75 μg/m³
        // ≥75 μg/m³ is "Very Poor"
      },
      pm10: {
        good: 20, // 0-20 μg/m³
        fair: 50, // 20-50 μg/m³
        moderate: 100, // 50-100 μg/m³
        poor: 200, // 100-200 μg/m³
        // ≥200 μg/m³ is "Very Poor"
      },
      o3: {
        good: 60, // 0-60 μg/m³
        fair: 100, // 60-100 μg/m³
        moderate: 140, // 100-140 μg/m³
        poor: 180, // 140-180 μg/m³
        // ≥180 μg/m³ is "Very Poor"
      },
      no2: {
        good: 40, // 0-40 μg/m³
        fair: 70, // 40-70 μg/m³
        moderate: 150, // 70-150 μg/m³
        poor: 200, // 150-200 μg/m³
        // ≥200 μg/m³ is "Very Poor"
      },
      so2: {
        good: 20, // 0-20 μg/m³
        fair: 80, // 20-80 μg/m³
        moderate: 250, // 80-250 μg/m³
        poor: 350, // 250-350 μg/m³
        // ≥350 μg/m³ is "Very Poor"
      },
      co: {
        good: 4400, // 0-4400 μg/m³
        fair: 9400, // 4400-9400 μg/m³
        moderate: 12400, // 9400-12400 μg/m³
        poor: 15400, // 12400-15400 μg/m³
        // ≥15400 μg/m³ is "Very Poor"
      },
    };

    // Use the appropriate thresholds for the pollutant or default to pm2_5
    const threshold = thresholds[pollutant] || thresholds.pm2_5;

    if (value < threshold.good) return "Good";
    if (value < threshold.fair) return "Fair";
    if (value < threshold.moderate) return "Moderate";
    if (value < threshold.poor) return "Poor";
    return "Very Poor";
  };

  // Helper function to get mock data based on location
  const getMockData = (location) => {
    // Simple mapping of location to mock data with AQI and pollutant values
    const mockDataMap = {
      "3.139-101.6869": {
        aqi: 2, // Fair
        temp: 29,
        humidity: 65,
        windSpeed: 3.2,
        uv: "Moderate",
        pm2_5: 15.2, // Fair
        o3: 68.4, // Fair
        no2: 45.2, // Fair
        pm10: 32.7, // Fair
        so2: 10.5, // Good
        co: 420.3, // Good
      }, // KL
      "3.0833-101.65": {
        aqi: 3, // Moderate
        temp: 30,
        humidity: 68,
        windSpeed: 2.8,
        uv: "High",
        pm2_5: 28.4, // Moderate
        o3: 112.6, // Moderate
        no2: 72.1, // Moderate
        pm10: 62.3, // Moderate
        so2: 45.8, // Fair
        co: 1250.6, // Good
      }, // PJ
      "3.0731-101.518": {
        aqi: 2, // Fair
        temp: 28,
        humidity: 62,
        windSpeed: 3.5,
        uv: "Moderate",
        pm2_5: 12.8, // Fair
        o3: 75.5, // Fair
        no2: 52.3, // Fair
        pm10: 31.5, // Fair
        so2: 25.6, // Fair
        co: 580.4, // Good
      }, // Shah Alam
      "3.0586-101.5851": {
        aqi: 3, // Moderate
        temp: 31,
        humidity: 70,
        windSpeed: 2.5,
        uv: "High",
        pm2_5: 32.6, // Moderate
        o3: 125.8, // Moderate
        no2: 110.2, // Moderate
        pm10: 68.3, // Moderate
        so2: 62.7, // Fair
        co: 2250.1, // Good
      }, // Subang
      "5.4141-100.3288": {
        aqi: 1, // Good
        temp: 27,
        humidity: 72,
        windSpeed: 4.0,
        uv: "Moderate",
        pm2_5: 8.5, // Good
        o3: 42.7, // Good
        no2: 25.8, // Good
        pm10: 15.2, // Good
        so2: 12.6, // Good
        co: 350.5, // Good
      }, // Penang
      "1.4927-103.7414": {
        aqi: 3, // Moderate
        temp: 32,
        humidity: 75,
        windSpeed: 2.2,
        uv: "High",
        pm2_5: 26.8, // Moderate
        o3: 118.4, // Moderate
        no2: 85.7, // Moderate
        pm10: 55.7, // Moderate
        so2: 48.3, // Fair
        co: 1860.2, // Good
      }, // JB
    };

    // Generate a key from the location
    const locationKey = `${location.lat}-${location.lon}`;

    // Get the matching data or use a default
    const mockData = mockDataMap[locationKey] || mockDataMap["3.139-101.6869"];

    // Create weather data object
    const mockWeatherData = {
      location: location.name || "Current Location",
      temperature: mockData.temp,
      feelsLike: mockData.temp + 2,
      humidity: mockData.humidity,
      windSpeed: mockData.windSpeed,
      description: mockData.aqi <= 2 ? "Clear sky" : "Partly cloudy",
      aqi: mockData.aqi,
      uv: mockData.uv,
    };

    // Create pollutants data using OpenWeatherMap scale
    const mockPollutants = [
      {
        name: "PM2.5",
        value: `${mockData.pm2_5.toFixed(1)} μg/m³`,
        rawValue: mockData.pm2_5,
        status: getAQILevel(mockData.pm2_5, "pm2_5"),
        description: "Fine particulate matter",
      },
      {
        name: "O3",
        value: `${mockData.o3.toFixed(1)} μg/m³`,
        rawValue: mockData.o3,
        status: getAQILevel(mockData.o3, "o3"),
        description: "Ground level ozone",
      },
      {
        name: "NO2",
        value: `${mockData.no2.toFixed(1)} μg/m³`,
        rawValue: mockData.no2,
        status: getAQILevel(mockData.no2, "no2"),
        description: "Nitrogen dioxide",
      },
      {
        name: "PM10",
        value: `${mockData.pm10.toFixed(1)} μg/m³`,
        rawValue: mockData.pm10,
        status: getAQILevel(mockData.pm10, "pm10"),
        description: "Coarse particulate matter",
      },
    ];

    // Create mock chart data
    // Hourly data for today
    const now = new Date();
    const currentHour = now.getHours();
    const mockHourlyData = [];

    // Create 8 hourly data points throughout the day
    for (let i = 0; i < 8; i++) {
      // Calculate hour (go backward from current hour)
      const hour = (currentHour - (7 - i) + 24) % 24;
      const formattedHour = `${hour}:00`;

      // Fluctuate the AQI and PM2.5 values realistically throughout the day
      // Morning and evening rush hours tend to have worse air quality
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const hourAdjustment = isRushHour ? 1 : 0;

      // AQI tends to be worse in afternoons due to heat and ozone formation
      const isAfternoon = hour >= 12 && hour <= 16;
      const afternoonAdjustment = isAfternoon ? 1 : 0;

      // Calculate the hourly AQI and pollutant values
      const hourlyAqi = Math.min(
        5,
        Math.max(1, mockData.aqi + hourAdjustment + afternoonAdjustment)
      );
      const hourlyPm25 =
        mockData.pm2_5 *
        (0.8 +
          (isRushHour ? 0.4 : 0) +
          (isAfternoon ? 0.2 : 0) +
          Math.random() * 0.2);
      const hourlyO3 =
        mockData.o3 * (0.7 + (isAfternoon ? 0.5 : 0) + Math.random() * 0.2);
      const hourlyNo2 =
        mockData.no2 * (0.8 + (isRushHour ? 0.4 : 0) + Math.random() * 0.2);

      mockHourlyData.push({
        time: formattedHour,
        aqi: hourlyAqi,
        pm25: hourlyPm25,
        o3: hourlyO3,
        no2: hourlyNo2,
      });
    }

    // Monthly data for historical and current patterns
    const mockMonthlyData = generateMonthlyData(mockData.aqi);

    return {
      mockWeatherData,
      mockPollutants,
      mockChartData: {
        hourlyData: mockHourlyData,
        monthlyData: mockMonthlyData,
      },
    };
  };

  // Helper function to estimate UV index based on weather condition
  const getUVIndex = (weatherId) => {
    if (weatherId >= 800 && weatherId <= 802) return "High";
    if (weatherId >= 803 && weatherId <= 804) return "Moderate";
    return "Low";
  };

  // This component doesn't need to render any visible UI
  return null;
};

export default Weather;
