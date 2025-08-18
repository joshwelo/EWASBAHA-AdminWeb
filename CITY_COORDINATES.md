# City Coordinates Reference

This guide provides coordinates for popular cities to use with the OneCall API v3.0.

## How to Change Cities

1. **Edit `src/config/weather.js`**
2. **Update the coordinates** for your desired city
3. **Change the display name** if needed
4. **Restart your development server**

## Popular Cities

### Africa
- **Nairobi, Kenya**: `-1.2921, 36.8219`
- **Cairo, Egypt**: `30.0444, 31.2357`
- **Lagos, Nigeria**: `6.5244, 3.3792`
- **Johannesburg, South Africa**: `-26.2041, 28.0473`
- **Casablanca, Morocco**: `33.5731, -7.5898`

### Europe
- **London, UK**: `51.5074, -0.1278`
- **Paris, France**: `48.8566, 2.3522`
- **Berlin, Germany**: `52.5200, 13.4050`
- **Rome, Italy**: `41.9028, 12.4964`
- **Madrid, Spain**: `40.4168, -3.7038`

### North America
- **New York, USA**: `40.7128, -74.0060`
- **Los Angeles, USA**: `34.0522, -118.2437`
- **Toronto, Canada**: `43.6532, -79.3832`
- **Mexico City, Mexico**: `19.4326, -99.1332`
- **Chicago, USA**: `41.8781, -87.6298`

### Asia
- **Tokyo, Japan**: `35.6762, 139.6503`
- **Beijing, China**: `39.9042, 116.4074`
- **Mumbai, India**: `19.0760, 72.8777`
- **Seoul, South Korea**: `37.5665, 126.9780`
- **Singapore**: `1.3521, 103.8198`

### South America
- **São Paulo, Brazil**: `-23.5505, -46.6333`
- **Buenos Aires, Argentina**: `-34.6118, -58.3960`
- **Lima, Peru**: `-12.0464, -77.0428`
- **Bogotá, Colombia**: `4.7110, -74.0721`
- **Santiago, Chile**: `-33.4489, -70.6693`

### Australia & Oceania
- **Sydney, Australia**: `-33.8688, 151.2093`
- **Melbourne, Australia**: `-37.8136, 144.9631`
- **Auckland, New Zealand**: `-36.8485, 174.7633`
- **Honolulu, USA**: `21.3099, -157.8581`

## Example Configuration

```javascript
// For London, UK
export const WEATHER_CONFIG = {
  API_KEY: "your_api_key_here",
  LATITUDE: 51.5074,
  LONGITUDE: -0.1278,
  CITY_NAME: "London",
  UNITS: "metric",
  LANGUAGE: "en",
  REFRESH_INTERVAL_MINUTES: 30
};
```

## Finding Your Own Coordinates

### Method 1: Google Maps
1. Go to [Google Maps](https://maps.google.com)
2. Right-click on your desired location
3. Copy the coordinates from the popup

### Method 2: Online Tools
- [LatLong.net](https://www.latlong.net/)
- [GPS Coordinates](https://gps-coordinates.org/)
- [Find Latitude and Longitude](https://www.findlatitudeandlongitude.com/)

### Method 3: OpenWeatherMap Geocoding
Use the geocoding API to convert city names to coordinates:
```
https://api.openweathermap.org/geo/1.0/direct?q=CityName&limit=1&appid=YOUR_API_KEY
```

## Tips

- **Precision**: 4-6 decimal places are sufficient
- **Format**: Use decimal degrees (not degrees/minutes/seconds)
- **Negative values**: 
  - Latitude: Negative = South, Positive = North
  - Longitude: Negative = West, Positive = East
- **Testing**: Use the `test_api_key.html` page to verify coordinates work 