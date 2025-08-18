import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { WEATHER_CONFIG, WEATHER_API } from '../config/weather';

const Alerts = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const alerts = [
    {
      title: 'Flood Warning',
      type: 'Warning',
      status: 'Active',
      createdAt: '2024-07-26 10:00 AM'
    },
    {
      title: 'Severe Weather Alert',
      type: 'Alert',
      status: 'Active',
      createdAt: '2024-07-25 03:00 PM'
    },
    {
      title: 'Evacuation Notice',
      type: 'Notice',
      status: 'Inactive',
      createdAt: '2024-07-24 09:00 AM'
    },
    {
      title: 'Emergency Assistance Request',
      type: 'Request',
      status: 'Active',
      createdAt: '2024-07-23 05:00 PM'
    },
    {
      title: 'Safety Check-In',
      type: 'Check-In',
      status: 'Inactive',
      createdAt: '2024-07-22 11:00 AM'
    }
  ];

  const fetchWeather = async () => {
    if (!WEATHER_CONFIG.API_KEY || WEATHER_CONFIG.API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
      setError("Please configure your OpenWeatherMap API key in src/config/weather.js");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Using OneCall API v3.0 for current weather and forecast
      const response = await fetch(
        `${WEATHER_API.ONECALL}?lat=${WEATHER_CONFIG.LATITUDE}&lon=${WEATHER_CONFIG.LONGITUDE}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANGUAGE}`
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API key unauthorized. Please check if your OpenWeatherMap API key is activated.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
      console.error('Weather API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather based on configuration
    const interval = setInterval(fetchWeather, WEATHER_CONFIG.REFRESH_INTERVAL_MINUTES * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (weatherMain) => {
    const icons = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '🌫️',
      'Dust': '🌫️',
      'Sand': '🌫️',
      'Ash': '🌫️',
      'Squall': '💨',
      'Tornado': '🌪️'
    };
    return icons[weatherMain] || '🌤️';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Layout>
      <div className="w-full h-full">
        {/* Page Header */}
        <div className="px-6 py-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-3">
              <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Alerts</p>
              <p className="text-[#60758a] text-sm font-normal leading-normal">
                View and manage emergency alerts, warnings, and notifications.
              </p>
            </div>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal">
              <span className="truncate">New Alert</span>
            </button>
          </div>
        </div>

        {/* Weather Section */}
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Weather Forecast - {WEATHER_CONFIG.CITY_NAME}</h3>
                {loading && <p className="text-blue-100">Loading weather data...</p>}
                {error && (
                  <div className="space-y-2">
                    <p className="text-red-200 font-semibold">Error: {error}</p>
                    {error.includes('401') && (
                      <div className="bg-red-900/20 p-3 rounded-lg border border-red-300/30">
                        <p className="text-red-100 text-sm mb-2">🔑 API Key Issue Detected</p>
                        <ul className="text-red-100 text-xs space-y-1">
                          <li>• New API keys take 2-4 hours to activate</li>
                          <li>• Check your OpenWeatherMap account status</li>
                          <li>• Verify the API key is correct</li>
                          <li>• See WEATHER_SETUP.md for troubleshooting</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {weather && !loading && !error && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{getWeatherIcon(weather.current?.weather[0]?.main)}</span>
                      <div>
                        <p className="text-3xl font-bold">{Math.round(weather.current.temp)}°C</p>
                        <p className="text-blue-100 capitalize">{weather.current.weather[0]?.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-100">Feels like</p>
                        <p className="font-semibold">{Math.round(weather.current.feels_like)}°C</p>
                      </div>
                      <div>
                        <p className="text-blue-100">Humidity</p>
                        <p className="font-semibold">{weather.current.humidity}%</p>
                      </div>
                      <div>
                        <p className="text-blue-100">Wind</p>
                        <p className="font-semibold">{Math.round(weather.current.wind_speed * 3.6)} km/h</p>
                      </div>
                      <div>
                        <p className="text-blue-100">Pressure</p>
                        <p className="font-semibold">{weather.current.pressure} hPa</p>
                      </div>
                    </div>
                    <div className="text-xs text-blue-100">
                      <p>Last updated: {formatTime(weather.current.dt)}</p>
                      <p>Sunrise: {formatTime(weather.daily[0]?.sunrise)} | Sunset: {formatTime(weather.daily[0]?.sunset)}</p>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={fetchWeather}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pb-3">
          <div className="flex border-b border-[#dbe0e6] px-6 gap-8">
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-[#dce8f3] text-[#111418] pb-[13px] pt-4" href="#">
              <p className="text-[#111418] text-sm font-bold leading-normal tracking-[0.015em]">All</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#60758a] pb-[13px] pt-4" href="#">
              <p className="text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">Active</p>
            </a>
            <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#60758a] pb-[13px] pt-4" href="#">
              <p className="text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">Inactive</p>
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-[#60758a] flex border-none bg-[#f0f2f5] items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input
                  placeholder="Search alerts"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-full placeholder:text-[#60758a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
              </div>
            </label>
          </div>
        </div>

        {/* Alerts Table */}
        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-[#dbe0e6]">
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-[400px]">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-60">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-60">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-[400px]">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-60">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6]">
                  {alerts.map((alert, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        {alert.title}
                      </td>
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal w-full">
                          <span className="truncate">{alert.type}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal w-full">
                          <span className="truncate">{alert.status}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                        {alert.createdAt}
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">
                        View
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Alerts; 