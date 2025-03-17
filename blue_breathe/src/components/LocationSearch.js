import React, { useState } from "react";
import { MapPin, Search } from "lucide-react";

const LocationSearch = ({ onLocationChange, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Sample Malaysian locations for validation
  const validLocations = [
    "Kuala Lumpur",
    "Penang",
    "Johor Bahru",
    "Kota Kinabalu",
    "Kuching",
    "Melaka",
    "Ipoh",
    "Cameron Highlands",
    "Petaling Jaya",
    "Shah Alam",
    "Subang Jaya",
  ];

  // Add to your location search component
  const validateLocation = (query) => {
    // Check if the query matches or contains any valid location (case insensitive)
    return validLocations.some(
      (location) =>
        query.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!searchQuery.trim()) {
      setError("Please enter a location");
      return;
    }

    if (!validateLocation(searchQuery)) {
      setError("Please enter a valid Malaysian location");
      return;
    }

    // Only trigger location change when form is submitted
    onLocationChange(searchQuery);
  };

  const handleInputChange = (e) => {
    // Just update local state, don't trigger location change yet
    setSearchQuery(e.target.value);
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Enter location (e.g., Kuala Lumpur, Malaysia)"
            value={searchQuery}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center px-3 rounded-r-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : <Search className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        <div className="mt-2 text-xs text-gray-500">
          Try one of these: Kuala Lumpur, Penang, Johor Bahru, Petaling Jaya,
          Shah Alam
        </div>
      </form>
    </div>
  );
};

export default LocationSearch;
