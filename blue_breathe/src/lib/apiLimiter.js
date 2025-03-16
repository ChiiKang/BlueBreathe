// lib/apiLimiter.js
const DAILY_LIMIT = 990;
const STORAGE_KEY = "apiUsage";

export const checkAPILimit = () => {
  const now = new Date();
  const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    count: 0,
    lastReset: now.setHours(0, 0, 0, 0),
  };

  // Reset counter daily at midnight local time
  if (now > storedData.lastReset + 86400000) {
    storedData.count = 0;
    storedData.lastReset = now.setHours(0, 0, 0, 0);
  }

  if (storedData.count >= DAILY_LIMIT) {
    throw new Error("Daily API limit exceeded");
  }

  storedData.count++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  return true;
};
