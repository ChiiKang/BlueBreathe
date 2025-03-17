import React, { useState, useEffect } from "react";
import axios from "axios";

const Weather = ({ city }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        );
        setWeather(response.data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    };

    fetchWeather();
  }, [city]);

  if (!weather) return <p>Loading weather...</p>;

  return (
    <div>
      <h2>Weather in {weather.name}</h2>
      <p>🌡️ Temperature: {weather.main.temp}°C</p>
      <p>💨 Wind Speed: {weather.wind.speed} m/s</p>
      <p>🌍 Condition: {weather.weather[0].description}</p>
      <img
        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
        alt="Weather Icon"
      />
    </div>
  );
};

export default Weather;
