import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { WEATHER_CONFIG, WEATHER_API } from '../config/weather';
import { listAlerts, createAlert, updateAlert, deleteAlert, sendAlert } from '../services/alerts';

const Alerts = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [alerts, setAlerts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    title: '',
    body: '',
    type: 'FLOOD_ALERT',
    severity: 'WARNING',
    targetArea: '',
    timestamp: '',
    sent: false
  });

  const WEATHER_CACHE_KEY = 'alerts_weather_cache_v1';
  const WEATHER_CACHE_TTL_MS = WEATHER_CONFIG.REFRESH_INTERVAL_MINUTES * 60 * 1000;

  // Helper function to safely convert any timestamp to string
  const safeTimestampToString = (timestamp) => {
    if (!timestamp) return '';
    
    // If it's already a string, return as is
    if (typeof timestamp === 'string') return timestamp;
    
    // If it's a Firestore timestamp object with seconds property
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      try {
        return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila'
        }) + ' UTC+8';
      } catch (e) {
        return new Date(timestamp.seconds * 1000).toISOString();
      }
    }
    
    // If it's a regular Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      }) + ' UTC+8';
    }
    
    // Fallback to string conversion
    return String(timestamp);
  };

  const loadAlerts = async () => {
    try {
      const items = await listAlerts();
      setAlerts(items);
    } catch (e) {
      console.error('Failed to load alerts', e);
    }
  };

  const fetchWeather = async () => {
    if (!WEATHER_CONFIG.API_KEY || WEATHER_CONFIG.API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
      setError("Please configure your OpenWeatherMap API key in src/config/weather.js");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < WEATHER_CACHE_TTL_MS) {
          setWeather(data);
          setLoading(false);
          return;
        }
      }

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
      // Cache the data
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch (err) {
      setError(err.message);
      console.error('Weather API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    loadAlerts();
    
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

  const handleOpenCreate = () => {
    setNewAlert({
      title: '',
      body: '',
      type: 'FLOOD_ALERT',
      severity: 'WARNING',
      targetArea: '',
      timestamp: '',
      sent: false
    });
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createAlert(newAlert);
      setShowCreateModal(false);
      await loadAlerts();
    } catch (e2) {
      console.error('Failed to create alert', e2);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id) => {
    setSaving(true);
    try {
      await sendAlert(id);
      await loadAlerts();
    } catch (e) {
      console.error('Failed to send alert', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Failed to delete alert', e);
    } finally {
      setSaving(false);
    }
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

        {/* Alerts List */}
        <div className="px-6 pb-12">
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Alerts</div>
              <button onClick={handleOpenCreate} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#111418] text-white text-sm font-medium leading-normal">
                <span className="truncate">New Alert</span>
              </button>
            </div>
            <div className="divide-y">
              {alerts.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No alerts yet.</div>
              )}
              {alerts.map(alert => (
                <div key={alert.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{alert.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{alert.type} • {alert.severity} • {alert.targetArea}</div>
                    <div className="text-xs text-gray-400 mt-1">{safeTimestampToString(alert.timestamp || alert.createdAt)}</div>
                    {alert.body && <div className="text-sm text-gray-700 mt-2">{alert.body}</div>}
                    {alert.sent && <div className="text-xs mt-2 text-green-700">Sent</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!alert.sent && (
                      <button onClick={() => handleSend(alert.id)} disabled={saving} className="px-3 py-1.5 rounded-md text-white bg-blue-600 text-sm">Send</button>
                    )}
                    <button onClick={() => handleDelete(alert.id)} disabled={saving} className="px-3 py-1.5 rounded-md text-white bg-red-600 text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="text-lg font-semibold">Create New Alert</div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input value={newAlert.title} onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm"  required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Body</label>
                  <textarea value={newAlert.body} onChange={(e) => setNewAlert({ ...newAlert, body: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" rows={4}  required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select value={newAlert.type} onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="FLOOD_ALERT">FLOOD_ALERT</option>
                      <option value="WEATHER_ALERT">WEATHER_ALERT</option>
                      <option value="EVACUATION_NOTICE">EVACUATION_NOTICE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Severity</label>
                    <select value={newAlert.severity} onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="WARNING">WARNING</option>
                      <option value="ALERT">ALERT</option>
                      <option value="INFO">INFO</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Area</label>
                    <input value={newAlert.targetArea} onChange={(e) => setNewAlert({ ...newAlert, targetArea: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Sto. Tomas City" required />
                  </div>
                  
                 </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-md text-white bg-[#111418]">{saving ? 'Creating…' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Alerts;