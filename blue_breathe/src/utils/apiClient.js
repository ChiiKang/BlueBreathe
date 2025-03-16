// utils/apiClient.js
import { checkAPILimit } from "../lib/apiLimiter";

const CACHE_TTL = 300000; // 5 minutes

export const safeFetch = async (url, options = {}) => {
  try {
    checkAPILimit();
    const cacheKey = `apiCache_${btoa(url)}`;
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch(url, options);
    const data = await response.json();

    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );

    return data;
  } catch (error) {
    console.error("API Error:", error);
    return { error: error.message };
  }
};
