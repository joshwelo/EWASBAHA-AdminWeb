# API Key Troubleshooting Guide

## Current Issue: 401 Unauthorized Error

You're getting a 401 (Unauthorized) error when trying to fetch weather data. This means the API key is not working properly.

## Possible Causes & Solutions

### 1. **API Key Not Activated Yet** ⏰
**Most Common Cause**: New API keys take 2-4 hours to activate after creation.

**Solution**: 
- Wait 2-4 hours after creating your API key
- Try again later
- Check your email for activation confirmation

### 2. **API Key Incorrect** 🔑
**Check**: Verify the API key in `src/config/weather.js` matches exactly what's shown in OpenWeatherMap.

**Solution**:
- Go to [OpenWeatherMap My API Keys](https://home.openweathermap.org/api_keys)
- Copy the exact key (no extra spaces or characters)
- Update `src/config/weather.js`

### 3. **API Key Doesn't Have Permissions** 🚫
**Check**: Ensure your API key has access to the "Current Weather Data" API.

**Solution**:
- Log into OpenWeatherMap
- Go to "My API Keys"
- Verify the key has "Current Weather Data" access
- If not, you may need to subscribe to the free tier

### 4. **Account Not Verified** ✅
**Check**: Your OpenWeatherMap account might not be verified.

**Solution**:
- Check your email for verification link
- Verify your account
- Wait for activation

## Test Your API Key

### Method 1: Browser Test
Copy and paste this URL in your browser (replace YOUR_API_KEY):
```
https://api.openweathermap.org/data/3.0/onecall?lat=-1.2921&lon=36.8219&appid=YOUR_API_KEY&units=metric
```

**Expected Response**: JSON data with weather information
**Error Response**: `{"cod":401,"message":"Invalid API key. Please see https://openweathermap.org/faq#error401 for more info."}`

### Method 2: Using curl (Command Line)
```bash
curl "https://api.openweathermap.org/data/3.0/onecall?lat=-1.2921&lon=36.8219&appid=YOUR_API_KEY&units=metric"
```

## Immediate Solutions

### Option 1: Wait for Activation
- Wait 2-4 hours after creating the API key
- This is the most common solution

### Option 2: Check Account Status
- Log into OpenWeatherMap
- Check if your account is verified
- Ensure you have access to free tier

### Option 3: Create New API Key
- Delete the current API key
- Create a new one
- Wait for activation

## Alternative Weather APIs

If OpenWeatherMap continues to have issues, consider these alternatives:

### 1. **WeatherAPI.com** (Free tier: 1M calls/month)
- More generous free tier
- Faster activation
- Similar API structure

### 2. **AccuWeather** (Free tier: 50 calls/day)
- Limited but reliable
- Good documentation

### 3. **Tomorrow.io** (Free tier: 1000 calls/day)
- Modern API
- Good free tier

## Current Status

**Your API Key**: `954a2ba5f1e3abd1d9850f12c33fff6d`
**City**: Nairobi
**Error**: 401 Unauthorized

## Next Steps

1. **Wait 2-4 hours** for API key activation
2. **Test the API key** using the browser method above
3. **Check your OpenWeatherMap account** status
4. **Contact OpenWeatherMap support** if issues persist

## Support

- **OpenWeatherMap Support**: https://openweathermap.org/support
- **API Documentation**: https://openweathermap.org/api
- **FAQ**: https://openweathermap.org/faq 