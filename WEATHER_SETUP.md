# Weather Forecast Setup Guide

This guide will help you set up real-time weather forecast functionality on the Alerts page.

## Prerequisites

1. **OpenWeatherMap Account**: You need a free account to get an API key
2. **API Key**: Required to fetch weather data

## Step 1: Get Your API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "My API keys" section
4. Copy your API key

## Step 2: Configure Weather Settings

1. Open `src/config/weather.js`
2. Replace `YOUR_OPENWEATHERMAP_API_KEY` with your actual API key
3. Change the coordinates (`LATITUDE` and `LONGITUDE`) to your desired city
4. Update `CITY_NAME` for display purposes

### Configuration Options

```javascript
export const WEATHER_CONFIG = {
  API_KEY: "your_actual_api_key_here",
  CITY_NAME: "Your City Name", // Change this to your city
  UNITS: "metric", // "metric" for Celsius, "imperial" for Fahrenheit
  LANGUAGE: "en", // Language for weather descriptions
  REFRESH_INTERVAL_MINUTES: 30 // Auto-refresh interval
};
```

### City Examples

- **Nairobi, Kenya**: `-1.2921, 36.8219`
- **London, UK**: `51.5074, -0.1278`
- **New York, USA**: `40.7128, -74.0060`
- **Tokyo, Japan**: `35.6762, 139.6503`

See `CITY_COORDINATES.md` for a complete list of popular cities and their coordinates.

## Step 3: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to the Alerts page
3. You should see a weather forecast section at the top
4. The weather will automatically refresh every 30 minutes

## Features

✅ **Real-time weather data**
✅ **Automatic refresh every 30 minutes**
✅ **Beautiful UI with weather icons**
✅ **Detailed weather information**:
   - Current temperature
   - Feels like temperature
   - Humidity
   - Wind speed
   - Pressure
   - Sunrise/sunset times
✅ **Error handling**
✅ **Loading states**
✅ **Manual refresh button**

## Troubleshooting

### "Please configure your OpenWeatherMap API key" Error
- Make sure you've updated the API key in `src/config/weather.js`
- Ensure the API key is correct and active

### "Failed to fetch weather data" Error
- Check your internet connection
- Verify the city name is correct
- Ensure your API key has the necessary permissions

### Weather Not Displaying
- Check the browser console for errors
- Verify the API key is valid
- Make sure the city name is supported by OpenWeatherMap

## API Limits

- **Free tier**: 1,000 calls per day
- **Weather refresh**: Every 30 minutes (configurable)
- **Data accuracy**: Real-time data from weather stations

## Customization

You can customize the weather display by modifying:
- `src/components/Alerts.jsx` - Weather UI layout and styling
- `src/config/weather.js` - Weather settings and configuration
- Refresh intervals, units, and language preferences

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is correct
3. Ensure the city name is valid
4. Check OpenWeatherMap service status 