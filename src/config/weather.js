// Weather Configuration
// Replace these values with your own

export const WEATHER_CONFIG = {
  // Your OpenWeatherMap API key
  // Get one for free at: https://openweathermap.org/api
  API_KEY: "954a2ba5f1e3abd1d9850f12c33fff6d",
  
  // City coordinates for weather forecast
  // The OneCall API v3.0 requires latitude and longitude
  // You can change these coordinates to any city you want
  LATITUDE: 13.940560649028146,  // Nairobi, Kenya
  LONGITUDE: 121.19740620904733,
  
  // City display name (for UI purposes) , 
  CITY_NAME: "Lipa City, Batangas",
  
  // Units: "metric" for Celsius, "imperial" for Fahrenheit
  UNITS: "metric",
  
  // Language for weather descriptions
  LANGUAGE: "en",
  
  // Auto-refresh interval in minutes
  REFRESH_INTERVAL_MINUTES: 30
};

// OpenWeatherMap API v3.0 endpoints
export const WEATHER_API = {
  ONECALL: `https://api.openweathermap.org/data/3.0/onecall`,
  GEOCODING: `https://api.openweathermap.org/geo/1.0/direct` // For converting city names to coordinates
}; 