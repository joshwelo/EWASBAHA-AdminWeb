import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = [13.9725, 121.1668];

const initialForm = {
  routePoints: [],
};

const FloodAffectedAreas = () => {
  const [map, setMap] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [drawing, setDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedRouteId, setHighlightedRouteId] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [historyData, setHistoryData] = useState({
    active: [],
    archived: [],
    all: []
  });
  const FIXED_CIRCLE_RADIUS_METERS = 100;

  // Custom hook to handle map events
  const MapClickHandler = ({ drawing, onMapClick }) => {
    const map = useMap();
    
    useEffect(() => {
      if (!drawing) return;
      
      const handleClick = (e) => {
        onMapClick(e);
      };
      
      map.on('click', handleClick);
      return () => {
        map.off('click', handleClick);
      };
    }, [drawing, map, onMapClick]);
    
    return null;
  };

  // Fetch routes from Firestore
  const fetchRoutes = async (mode = viewMode) => {
    setLoading(true);
    let querySnapshot;
    
    try {
      if (mode === 'active') {
        const q = query(
          collection(db, 'floodLocations'),
          orderBy('timestamp', 'desc')
        );
        querySnapshot = await getDocs(q);
        const allRoutes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeRoutes = allRoutes.filter(route => !route.isArchived);
        setRoutes(activeRoutes);
      } else if (mode === 'archived') {
        const q = query(
          collection(db, 'floodLocations'),
          where('isArchived', '==', true),
          orderBy('timestamp', 'desc')
        );
        querySnapshot = await getDocs(q);
        const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRoutes(routesData);
      } else {
        const q = query(
          collection(db, 'floodLocations'),
          orderBy('timestamp', 'desc')
        );
        querySnapshot = await getDocs(q);
        const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRoutes(routesData);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      const q = query(
        collection(db, 'floodLocations'),
        orderBy('timestamp', 'desc')
      );
      querySnapshot = await getDocs(q);
      const allRoutes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (mode === 'active') {
        setRoutes(allRoutes.filter(route => !route.isArchived));
      } else if (mode === 'archived') {
        setRoutes(allRoutes.filter(route => route.isArchived));
      } else {
        setRoutes(allRoutes);
      }
    }
    
    setLoading(false);
  };

  // Fetch history data
  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'floodLocations'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const allRoutes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const activeRoutes = allRoutes.filter(route => !route.isArchived);
      const archivedRoutes = allRoutes.filter(route => route.isArchived);

      setHistoryData({
        active: activeRoutes,
        archived: archivedRoutes,
        all: allRoutes
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [viewMode]);

  // Handle map clicks
  const onMapClick = useCallback((e) => {
    if (!drawing) return;
    setForm((prev) => ({
      ...prev,
      routePoints: [
        ...prev.routePoints,
        {
          latitude: String(e.latlng.lat),
          longitude: String(e.latlng.lng),
          timestamp: String(Date.now()),
        },
      ],
    }));
  }, [drawing]);

  // Add new route handler
  const handleAddNew = () => {
    setForm(initialForm);
    setSelectedRoute(null);
    setModalOpen(true);
    setDrawing(true);
    setHighlightedRouteId(null);
  };

  // Edit route handler
  const handleEditRoute = (route) => {
    setForm({
      routePoints: route.routePoints || [],
    });
    setSelectedRoute(route);
    setModalOpen(true);
    setDrawing(false);
    setHighlightedRouteId(route.id);
  };

  // Archive route
  const handleArchiveRoute = async (id) => {
    if (!window.confirm('Archive this flood route? It will be moved to the archived routes.')) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'floodLocations', id), {
        isArchived: true,
        archivedAt: String(Date.now())
      });
      
      setModalOpen(false);
      setForm(initialForm);
      setSelectedRoute(null);
      setHighlightedRouteId(null);
      fetchRoutes();
    } catch (error) {
      alert('Error archiving flood route: ' + error.message);
    }
    setLoading(false);
  };

  // Restore route
  const handleRestoreRoute = async (id) => {
    if (!window.confirm('Restore this flood route to active routes?')) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'floodLocations', id), {
        isArchived: false,
        restoredAt: String(Date.now())
      });
      fetchRoutes();
    } catch (error) {
      alert('Error restoring flood route: ' + error.message);
    }
    setLoading(false);
  };

  // Delete route
  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this flood route? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'floodLocations', id));
      setModalOpen(false);
      setForm(initialForm);
      setSelectedRoute(null);
      setHighlightedRouteId(null);
      fetchRoutes();
    } catch (error) {
      alert('Error deleting flood route: ' + error.message);
    }
    setLoading(false);
  };

  // Save route
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        routePoints: form.routePoints,
        timestamp: String(Date.now()),
        isArchived: false
      };
      
      if (selectedRoute) {
        await updateDoc(doc(db, 'floodLocations', selectedRoute.id), {
          ...data,
          updatedAt: String(Date.now())
        });
      } else {
        await addDoc(collection(db, 'floodLocations'), data);
      }

      setModalOpen(false);
      setForm(initialForm);
      setSelectedRoute(null);
      setHighlightedRouteId(null);
      fetchRoutes();
    } catch (err) {
      alert('Error saving flood route: ' + err.message);
    }
    setLoading(false);
  };

  // Remove point from route
  const handleRemovePoint = (idx) => {
    setForm((prev) => ({
      ...prev,
      routePoints: prev.routePoints.filter((_, i) => i !== idx),
    }));
  };

  // Start drawing
  const handleStartDrawing = () => {
    setDrawing(true);
  };

  // Stop drawing
  const handleStopDrawing = () => {
    setDrawing(false);
  };

  // Highlight route on map
  const handleHighlightRoute = (route) => {
    setHighlightedRouteId(route.id);
    setForm({
      routePoints: route.routePoints || [],
    });
  
    if (map && route.routePoints && route.routePoints.length > 0) {
      const points = route.routePoints.map(pt => [
        parseFloat(pt.latitude),
        parseFloat(pt.longitude)
      ]);
  
      // Use setTimeout to ensure map is ready
      setTimeout(() => {
        if (route.routePoints.length === 1) {
          // For a single point, zoom in to a minimum zoom level (e.g., 16)
          map.setView(points[0], 16, { animate: true });
        } else {
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds, {
            padding: [50, 50],
            animate: true
          });
        }
      }, 100);
    }
  };

  // Open history modal
  const handleOpenHistory = () => {
    setHistoryModalOpen(true);
    fetchHistoryData();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusBadge = (route) => {
    if (route.isArchived) {
      return <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">Archived</span>;
    }
    return <span className="inline-block px-2 py-1 text-xs bg-green-200 text-green-700 rounded-full">Active</span>;
  };

  // Calculate circle properties for a route
  const getCircleForRoute = (route) => {
    if (!route.routePoints || route.routePoints.length === 0) return null;
    
    if (route.routePoints.length >= 2) {
      const pt1 = route.routePoints[0];
      const pt2 = route.routePoints[1];
      const lat1 = parseFloat(pt1.latitude);
      const lng1 = parseFloat(pt1.longitude);
      const lat2 = parseFloat(pt2.latitude);
      const lng2 = parseFloat(pt2.longitude);
      
      const center = [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
      
      // Calculate distance using Haversine formula
      const R = 6371000;
      const toRad = deg => deg * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      let radius = distance / 2;
      if (distance < 1) {
        radius = FIXED_CIRCLE_RADIUS_METERS;
      }
      
      return { center, radius };
    } else {
      const pt = route.routePoints[0];
      return {
        center: [parseFloat(pt.latitude), parseFloat(pt.longitude)],
        radius: FIXED_CIRCLE_RADIUS_METERS
      };
    }
  };

  // Get route style properties
  const getRouteStyle = (route) => {
    const isArchived = route.isArchived;
    const isSosSource = route.source === 'sos_report';
    const isHighlighted = route.id === highlightedRouteId;
    
    let fillColor = '#3182ce';
    let strokeColor = '#3182ce';
    
    if (isArchived) {
      fillColor = '#A0AEC0';
      strokeColor = '#A0AEC0';
    }
    if (isSosSource && !isArchived) {
      fillColor = '#e53e3e';
      strokeColor = '#e53e3e';
    }
    if (isHighlighted) {
      fillColor = '#e53e3e';
      strokeColor = '#e53e3e';
    }
    
    return {
      fillColor,
      color: strokeColor
    };
  };

  return (
    <Layout>
      <div className="w-full h-screen flex flex-col">
        <div className="px-6 py-6 flex justify-between items-center">
          <div className="flex flex-col gap-3">
            <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Flood Affected Areas</p>
            <p className="text-[#60758a] text-sm font-normal leading-normal">Visual interface to mark and verify affected routes.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenHistory}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none font-medium"
            >
              View History
            </button>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none font-medium"
            >
              Add New Route
            </button>
          </div>
        </div>
        
        {/* View Mode Toggle */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('active')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                viewMode === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active Routes
            </button>
            <button
              onClick={() => setViewMode('archived')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                viewMode === 'archived' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Archived Routes
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                viewMode === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Routes
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 flex-1 flex flex-col">
          <div className={`flex-1 grid grid-cols-1 gap-6 h-full transition-all duration-300 ${
            modalOpen ? 'lg:grid-cols-[1fr_400px]' : 'lg:grid-cols-4'
          }`}>
            <div className={`h-full ${modalOpen ? '' : 'lg:col-span-3'}`}>
              <MapContainer
                center={center}
                zoom={12}
                style={containerStyle}
                ref={setMap}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Map click handler */}
                <MapClickHandler drawing={drawing} onMapClick={onMapClick} />
                {/* Render routes */}
                {routes.map(route => {
                  const style = getRouteStyle(route);
                  const circleProps = getCircleForRoute(route);
                  const isHighlighted = route.id === highlightedRouteId;
                  return (
                    <React.Fragment key={route.id}>
                      {/* Route polyline */}
                      {route.routePoints && route.routePoints.length >= 2 && (
                        <Polyline
                          positions={route.routePoints.map(pt => [
                            parseFloat(pt.latitude),
                            parseFloat(pt.longitude)
                          ])}
                          color={style.color}
                          weight={4}
                          opacity={0.8}
                        />
                      )}
                      {/* Route circle */}
                      {circleProps && (
                        <Circle
                          center={circleProps.center}
                          radius={circleProps.radius}
                          pathOptions={{
                            fillColor: style.fillColor,
                            fillOpacity: 0.3,
                            color: style.color,
                            opacity: 0.8,
                            weight: 3
                          }}
                        />
                      )}
                      {/* Start marker */}
                      {route.routePoints && route.routePoints.length > 0 && (
                        <Marker
                          position={[
                            parseFloat(route.routePoints[0].latitude),
                            parseFloat(route.routePoints[0].longitude)
                          ]}
                          eventHandlers={{
                            click: () => handleHighlightRoute(route)
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
                {/* Current drawing */}
                {modalOpen && form.routePoints.length > 0 && (
                  <Polyline
                    positions={form.routePoints.map(pt => [
                      parseFloat(pt.latitude),
                      parseFloat(pt.longitude)
                    ])}
                    color="#38a169"
                    weight={4}
                    opacity={0.8}
                  />
                )}
                {modalOpen && form.routePoints.map((pt, idx) => (
                  <Marker
                    key={idx}
                    position={[
                      parseFloat(pt.latitude),
                      parseFloat(pt.longitude)
                    ]}
                  />
                ))}
              </MapContainer>
            </div>
            
            {/* Sidebar with updated content - always visible */}
            {!modalOpen && (
              <div className="h-full">
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm h-full flex flex-col">
                  <p className="text-[#111418] text-base font-medium leading-normal mb-4">
                    {viewMode === 'active' ? 'Active' : viewMode === 'archived' ? 'Archived' : 'All'} Routes ({routes.length})
                  </p>
                  <div className="flex-1 overflow-y-auto">
                    {routes.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No {viewMode} routes found. 
                        {viewMode === 'active' && ' Click "Add New Route" to get started.'}
                      </p>
                    )}
                    {routes.map(route => (
                      <div key={route.id} className={`flex flex-col border-b py-2 last:border-b-0 hover:bg-gray-50 rounded p-2 cursor-pointer transition-colors ${highlightedRouteId === route.id ? 'bg-blue-50' : ''}`} onClick={() => handleHighlightRoute(route)}>
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <div className="font-semibold text-xs text-gray-800 truncate">
                                Route {route.id.substring(0, 6)}...
                              </div>
                              {getStatusBadge(route)}
                              {route.source === 'sos_report' && (
                                <div className="text-xs text-yellow-700 bg-yellow-100 px-1 py-0.5 rounded-full">
                                  SOS
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Points: {route.routePoints?.length || 0}
                            </div>
                            {route.timestamp && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(parseInt(route.timestamp)).toLocaleDateString()}
                              </div>
                            )}
                            {route.archivedAt && (
                              <div className="text-xs text-gray-400">
                                Archived: {new Date(parseInt(route.archivedAt)).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {!route.isArchived && (
                              <>
                                <button
                                  className="text-blue-600 hover:underline text-xs px-1 py-0.5 rounded hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditRoute(route);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-orange-600 hover:underline text-xs px-1 py-0.5 rounded hover:bg-orange-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveRoute(route.id);
                                  }}
                                >
                                  Archive
                                </button>
                              </>
                            )}
                            {route.isArchived && (
                              <>
                                <button
                                  className="text-green-600 hover:underline text-xs px-1 py-0.5 rounded hover:bg-green-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestoreRoute(route.id);
                                  }}
                                >
                                  Restore
                                </button>
                                <button
                                  className="text-red-600 hover:underline text-xs px-1 py-0.5 rounded hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePermanentDelete(route.id);
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add/Edit Route Panel - replaces sidebar when modal is open */}
            {modalOpen && (
              <div className="h-full">
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedRoute ? 'Edit Flood Route' : 'Add New Flood Route'}
                    </h2>
                    <button
                      onClick={() => { setModalOpen(false); setForm(initialForm); setSelectedRoute(null); setDrawing(false); }}
                      className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                      aria-label="Close"
                    >
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Route Points</label>
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {form.routePoints.length === 0 && (
                          <span className="text-xs text-gray-400">Click on the map to add points.</span>
                        )}
                        {form.routePoints.map((pt, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                            <span className="flex-1">
                              Point {idx + 1}: ({parseFloat(pt.latitude).toFixed(5)}, {parseFloat(pt.longitude).toFixed(5)})
                            </span>
                            <button 
                              type="button" 
                              className="text-red-500 hover:text-red-700 px-1" 
                              onClick={() => handleRemovePoint(idx)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!drawing && (
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          onClick={handleStartDrawing}
                        >
                          Edit Points
                        </button>
                      )}
                      {drawing && (
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                          onClick={handleStopDrawing}
                        >
                          Stop Editing Points
                        </button>
                      )}
                      <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                        disabled={loading || form.routePoints.length < 2}
                      >
                        {loading ? 'Saving...' : (selectedRoute ? 'Update Route' : 'Add Route')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right-side drawer for add/edit route */}
        {modalOpen && (
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transition-transform duration-300 transform translate-x-0 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedRoute ? 'Edit Flood Route' : 'Add New Flood Route'}
                </h2>
                <button
                  onClick={() => { setModalOpen(false); setForm(initialForm); setSelectedRoute(null); setDrawing(false); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  aria-label="Close Drawer"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Route Points</label>
                  <div className="flex flex-col gap-2">
                    {form.routePoints.length === 0 && <span className="text-xs text-gray-400">Click on the map to add points.</span>}
                    {form.routePoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="flex-1">
                          Point {idx + 1}: ({parseFloat(pt.latitude).toFixed(5)}, {parseFloat(pt.longitude).toFixed(5)})
                        </span>
                        <button type="button" className="text-red-500 hover:underline" onClick={() => handleRemovePoint(idx)}>Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  {!drawing && (
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={handleStartDrawing}
                    >
                      Edit Points
                    </button>
                  )}
                  {drawing && (
                    <button
                      type="button"
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      onClick={handleStopDrawing}
                    >
                      Stop Editing Points
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={loading || form.routePoints.length < 2}
                  >
                    {loading ? 'Saving...' : (selectedRoute ? 'Update Route' : 'Add Route')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-800">Flood Routes History</h2>
                  <button
                    onClick={() => setHistoryModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Active Routes */}
                  <div>
                    <h3 className="text-lg font-medium text-green-700 mb-3">
                      Active Routes ({historyData.active.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {historyData.active.map(route => (
                        <div key={route.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="font-medium text-sm text-green-800">
                            Route {route.id.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Points: {route.routePoints?.length || 0}
                          </div>
                          <div className="text-xs text-green-500 mt-1">
                            Created: {formatTimestamp(route.timestamp)}
                          </div>
                        </div>
                      ))}
                      {historyData.active.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-4">No active routes</div>
                      )}
                    </div>
                  </div>

                  {/* Archived Routes */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">
                      Archived Routes ({historyData.archived.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {historyData.archived.map(route => (
                        <div key={route.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="font-medium text-sm text-gray-800">
                            Route {route.id.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Points: {route.routePoints?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created: {formatTimestamp(route.timestamp)}
                          </div>
                          {route.archivedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Archived: {formatTimestamp(route.archivedAt)}
                            </div>
                          )}
                        </div>
                      ))}
                      {historyData.archived.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-4">No archived routes</div>
                      )}
                    </div>
                  </div>

                  {/* Timeline View */}
                  <div>
                    <h3 className="text-lg font-medium text-blue-700 mb-3">
                      Timeline ({historyData.all.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {historyData.all.map(route => (
                        <div key={route.id} className={`p-3 rounded-lg border ${
                          route.isArchived 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`font-medium text-sm ${
                              route.isArchived ? 'text-gray-800' : 'text-blue-800'
                            }`}>
                              Route {route.id.substring(0, 8)}...
                            </div>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              route.isArchived 
                                ? 'bg-gray-200 text-gray-700' 
                                : 'bg-green-200 text-green-700'
                            }`}>
                              {route.isArchived ? 'Archived' : 'Active'}
                            </span>
                          </div>
                          <div className={`text-xs mt-1 ${
                            route.isArchived ? 'text-gray-600' : 'text-blue-600'
                          }`}>
                            Points: {route.routePoints?.length || 0}
                          </div>
                          <div className={`text-xs mt-1 ${
                            route.isArchived ? 'text-gray-500' : 'text-blue-500'
                          }`}>
                            Created: {formatTimestamp(route.timestamp)}
                          </div>
                          {route.archivedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Archived: {formatTimestamp(route.archivedAt)}
                            </div>
                          )}
                          {route.updatedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Updated: {formatTimestamp(route.updatedAt)}
                            </div>
                          )}
                          {route.restoredAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Restored: {formatTimestamp(route.restoredAt)}
                            </div>
                          )}
                        </div>
                      ))}
                      {historyData.all.length === 0 && (
                        <div className="text-gray-500 text-sm text-center py-4">No routes found</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Summary Statistics */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Summary Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{historyData.active.length}</div>
                      <div className="text-sm text-green-700">Active Routes</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{historyData.archived.length}</div>
                      <div className="text-sm text-gray-700">Archived Routes</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{historyData.all.length}</div>
                      <div className="text-sm text-blue-700">Total Routes</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {historyData.all.reduce((sum, route) => sum + (route.routePoints?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-purple-700">Total Points</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FloodAffectedAreas;