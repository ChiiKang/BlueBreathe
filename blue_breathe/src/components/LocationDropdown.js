import React, { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";

const LocationDropdown = ({ onLocationChange, isLoading, onAllCityDataUpdate }) => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [cityCoordinates, setCityCoordinates] = useState({});
  const [aqiData, setAqiData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // List of Malaysian cities
  const malaysianCities = [
    "Banting, Selangor",
    "Petaling Jaya, Selangor",
    "Shah Alam, Selangor",
    "Pelabuhan Kelang, Selangor",
    "Batu Muda, Kuala Lumpur, Wilayah Persekutuan",
    "Cheras, Kuala Lumpur, Wilayah Persekutuan",
    "Putrajaya, W.P. Putrajaya",
    "Jerantut, Pahang",
    "Port Dickson, Negeri Sembilan",
    "Kota Bharu, Kelantan",
    "Kg. Air Putih, Taiping, Perak",
    "Bakar Arang, Sg. Petani, Kedah",
    "Kulim Hi-Tech, Kedah",
    "Batu Pahat, Johor",
    "Tangkak, Johor",
    "Seberang Jaya 2, Perai, Pulau Pinang",
    "Perai, Pulau Pinang",
    "Kemaman, Terengganu",
    "Tawau, Sabah",
    "Samalaju, Sarawak"
  ];

  // Static AQI values for consistent display
  const getStaticAqiValue = (cityName) => {
    // Predetermined AQI values for each city
    const staticAqiValues = {
      "Banting, Selangor": 45,
      "Petaling Jaya, Selangor": 72,
      "Shah Alam, Selangor": 68,
      "Pelabuhan Kelang, Selangor": 85,
      "Batu Muda, Kuala Lumpur, Wilayah Persekutuan": 76,
      "Cheras, Kuala Lumpur, Wilayah Persekutuan": 81,
      "Putrajaya, W.P. Putrajaya": 52,
      "Jerantut, Pahang": 32,
      "Port Dickson, Negeri Sembilan": 48,
      "Kota Bharu, Kelantan": 41,
      "Kg. Air Putih, Taiping, Perak": 38,
      "Bakar Arang, Sg. Petani, Kedah": 56,
      "Kulim Hi-Tech, Kedah": 61,
      "Batu Pahat, Johor": 102,
      "Tangkak, Johor": 94,
      "Seberang Jaya 2, Perai, Pulau Pinang": 115,
      "Perai, Pulau Pinang": 125,
      "Kemaman, Terengganu": 47,
      "Tawau, Sabah": 35,
      "Samalaju, Sarawak": 29
    };
    
    // Return the static value or a default value if not found
    return staticAqiValues[cityName] || 50;
  };

  // Fetch coordinates and AQI data for all cities on component mount
  useEffect(() => {
    const fetchAllCityData = async () => {
      // Create an object to store coordinates and AQI data
      const coordinates = {};
      const aqiValues = {};
      const allCityData = {};

      // Fetch coordinates for each city
      for (const city of malaysianCities) {
        try {
          // Hard-coded coordinates for common Malaysian cities to avoid API rate limiting
          const cityCoords = {
            "Banting, Selangor": { lat: 2.8184, lon: 101.5022 },
            "Petaling Jaya, Selangor": { lat: 3.1073, lon: 101.6067 },
            "Shah Alam, Selangor": { lat: 3.0738, lon: 101.5183 },
            "Pelabuhan Kelang, Selangor": { lat: 3.0017, lon: 101.4043 },
            "Batu Muda, Kuala Lumpur, Wilayah Persekutuan": { lat: 3.2089, lon: 101.6866 },
            "Cheras, Kuala Lumpur, Wilayah Persekutuan": { lat: 3.1073, lon: 101.7532 },
            "Putrajaya, W.P. Putrajaya": { lat: 2.9264, lon: 101.6964 },
            "Jerantut, Pahang": { lat: 3.9360, lon: 102.3630 },
            "Port Dickson, Negeri Sembilan": { lat: 2.5289, lon: 101.8094 },
            "Kota Bharu, Kelantan": { lat: 6.1256, lon: 102.2389 },
            "Kg. Air Putih, Taiping, Perak": { lat: 4.8576, lon: 100.7199 },
            "Bakar Arang, Sg. Petani, Kedah": { lat: 5.6478, lon: 100.4918 },
            "Kulim Hi-Tech, Kedah": { lat: 5.4134, lon: 100.5592 },
            "Batu Pahat, Johor": { lat: 1.8550, lon: 102.9328 },
            "Tangkak, Johor": { lat: 2.2726, lon: 102.5453 },
            "Seberang Jaya 2, Perai, Pulau Pinang": { lat: 5.3896, lon: 100.3984 },
            "Perai, Pulau Pinang": { lat: 5.3839, lon: 100.3915 },
            "Kemaman, Terengganu": { lat: 4.2323, lon: 103.4184 },
            "Tawau, Sabah": { lat: 4.2448, lon: 117.8914 },
            "Samalaju, Sarawak": { lat: 3.9833, lon: 113.3000 }
          };

          let lat, lon;
          
          // Use hard-coded coordinates if available
          if (cityCoords[city]) {
            lat = cityCoords[city].lat;
            lon = cityCoords[city].lon;
          } else {
            // Fallback to Nominatim API if we don't have hard-coded coordinates
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}, Malaysia`
            );
            const data = await response.json();
            
            if (data && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lon = parseFloat(data[0].lon);
            } else {
              // Use Kuala Lumpur's coordinates as fallback
              lat = 3.139 + (Math.random() - 0.5) * 0.5;
              lon = 101.6869 + (Math.random() - 0.5) * 0.5;
            }
          }
          
          coordinates[city] = { lat, lon };
          
          // Use static AQI values instead of random generation
          const aqi = getStaticAqiValue(city);
          aqiValues[city] = aqi;
          
          // Store all city data
          allCityData[city] = { lat, lon, aqi };
        } catch (error) {
          console.error(`Error fetching data for ${city}:`, error);
          // Fallback coordinates and AQI for demo purposes
          const lat = 3.139 + (Math.random() - 0.5) * 0.5;
          const lon = 101.6869 + (Math.random() - 0.5) * 0.5;
          const aqi = getStaticAqiValue(city);
          
          coordinates[city] = { lat, lon };
          aqiValues[city] = aqi;
          allCityData[city] = { lat, lon, aqi };
        }
      }

      setCityCoordinates(coordinates);
      setAqiData(aqiValues);
      
      // Update the parent component with all city data
      if (onAllCityDataUpdate) {
        onAllCityDataUpdate(allCityData);
      }
      
      // Don't set a default city - just send all the data to parent
      if (isInitialLoad) {
        setIsInitialLoad(false);
        // Send all city data to parent for initial map display
        if (onAllCityDataUpdate) {
          onAllCityDataUpdate(allCityData);
        }
      }
    };

    fetchAllCityData();
  }, [isInitialLoad, onAllCityDataUpdate, onLocationChange]);

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setIsOpen(false);

    if (cityCoordinates[location] && aqiData[location] !== undefined) {
      onLocationChange({
        location,
        ...cityCoordinates[location],
        aqi: aqiData[location]
      });
    }
  };

  return (
    <div className="mb-4">
      <div className="relative" style={{ zIndex: 9999 }}>
        <div className="flex flex-col">
          <label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1">
            Select Location
          </label>
          <div className="relative">
            <button
              type="button"
              className="bg-white relative w-full border border-gray-300 rounded-lg shadow-sm pl-10 pr-10 py-2.5 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onClick={() => setIsOpen(!isOpen)}
              disabled={isLoading}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              style={{ position: "relative", zIndex: 9999 }}
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <span className="block truncate">
                {selectedLocation || "Select a city"}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </span>
            </button>

            {isOpen && (
              <ul
                className="absolute z-9999 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                tabIndex="-1"
                role="listbox"
                style={{ position: "relative", zIndex: 9999 }}
              >
                {malaysianCities.map((city, index) => (
                  <li
                    key={index}
                    className="text-gray-900 cursor-default select-none relative py-2 pl-10 pr-4 hover:bg-blue-50"
                    onClick={() => handleLocationSelect(city)}
                    role="option"
                    aria-selected={selectedLocation === city}
                  >
                    <span className="font-normal block truncate">
                      {city}
                    </span>
                    {selectedLocation === city && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                        <MapPin className="h-5 w-5" />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDropdown;