import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 13.9725,
  lng: 121.1668,
};

const initialForm = {
  routePoints: [], // { latitude: string, longitude: string, timestamp: string }
};

const FloodAffectedAreas = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCzQbflN3B55lBQ8vTQKZF5qe9g0Mgrx7Q",
    libraries: ['geometry', 'maps']
  });

  const [map, setMap] = useState(null);
  const [routes, setRoutes] = useState([]); // All flood routes
  const [selectedRoute, setSelectedRoute] = useState(null); // Route being edited
  const [modalOpen, setModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [drawing, setDrawing] = useState(false); // Drawing mode for new/edit route
  const [loading, setLoading] = useState(false);
  const [highlightedRouteId, setHighlightedRouteId] = useState(null);
  const [directionsRenderers, setDirectionsRenderers] = useState({}); // Store directions for each route
  const [viewMode, setViewMode] = useState('active'); // 'active', 'archived', 'all'
  const [historyData, setHistoryData] = useState({
    active: [],
    archived: [],
    all: []
  });

  // Fetch routes from Firestore based on view mode
  const fetchRoutes = async (mode = viewMode) => {
    setLoading(true);
    let querySnapshot;
    
    try {
      if (mode === 'active') {
        // Fetch all routes and filter client-side for active routes
        const q = query(
          collection(db, 'floodLocations'),
          orderBy('timestamp', 'desc')
        );
        querySnapshot = await getDocs(q);
        const allRoutes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeRoutes = allRoutes.filter(route => !route.isArchived);
        setRoutes(activeRoutes);
      } else if (mode === 'archived') {
        // Fetch only archived routes
        const q = query(
          collection(db, 'floodLocations'),
          where('isArchived', '==', true),
          orderBy('timestamp', 'desc')
        );
        querySnapshot = await getDocs(q);
        const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRoutes(routesData);
      } else {
        // Fetch all routes
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
      // Fallback: fetch all routes without filtering
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
    
    // Calculate directions for each route that we're actually displaying
    const routesToProcess = mode === 'active' ? 
      routes.filter(route => !route.isArchived) : 
      mode === 'archived' ? 
      routes.filter(route => route.isArchived) : 
      routes;

    if (isLoaded && window.google && routesToProcess.length > 0) {
      const newDirectionsRenderers = {};
      for (const route of routesToProcess) {
        if (route.routePoints && route.routePoints.length >= 2) {
          const directions = await calculateDirections(route.routePoints);
          if (directions) {
            newDirectionsRenderers[route.id] = directions;
          }
        }
      }
      setDirectionsRenderers(newDirectionsRenderers);
    }
    setLoading(false);
  };

  // Fetch history data for the history modal
  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch all routes first
      const q = query(
        collection(db, 'floodLocations'),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const allRoutes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter client-side
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

  // Calculate directions between points
  const calculateDirections = async (points) => {
    if (!window.google || points.length < 2) return null;
    
    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const waypoints = points.slice(1, -1).map(point => ({
        location: new window.google.maps.LatLng(
          parseFloat(point.latitude),
          parseFloat(point.longitude)
        ),
        stopover: true
      }));

      const result = await new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: new window.google.maps.LatLng(
              parseFloat(points[0].latitude),
              parseFloat(points[0].longitude)
            ),
            destination: new window.google.maps.LatLng(
              parseFloat(points[points.length - 1].latitude),
              parseFloat(points[points.length - 1].longitude)
            ),
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(result);
            } else {
              reject(status);
            }
          }
        );
      });

      return result;
    } catch (error) {
      console.error('Error calculating directions:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [isLoaded, viewMode]);

  // Map click to add points to the route (when drawing)
  const onMapClick = useCallback((event) => {
    if (!drawing) return;
    setForm((prev) => ({
      ...prev,
      routePoints: [
        ...prev.routePoints,
        {
          latitude: String(event.latLng.lat()),
          longitude: String(event.latLng.lng()),
          timestamp: String(Date.now()),
        },
      ],
    }));
  }, [drawing]);

  // Open modal for adding a new route
  const handleAddNew = () => {
    setForm(initialForm);
    setSelectedRoute(null);
    setModalOpen(true);
    setDrawing(true);
    setHighlightedRouteId(null);
  };

  // Open modal for editing a route
  const handleEditRoute = (route) => {
    setForm({
      routePoints: route.routePoints || [],
    });
    setSelectedRoute(route);
    setModalOpen(true);
    setDrawing(false); // Only enable drawing if user clicks 'Edit Points'
    setHighlightedRouteId(route.id);
  };

  // Archive a route instead of deleting it
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
      
      // Remove from directions renderers
      const newDirectionsRenderers = { ...directionsRenderers };
      delete newDirectionsRenderers[id];
      setDirectionsRenderers(newDirectionsRenderers);
      
      fetchRoutes();
    } catch (error) {
      alert('Error archiving flood route: ' + error.message);
    }
    setLoading(false);
  };

  // Restore an archived route
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

  // Permanently delete a route (only for archived routes)
  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this flood route? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'floodLocations', id));
      
      setModalOpen(false);
      setForm(initialForm);
      setSelectedRoute(null);
      setHighlightedRouteId(null);
      
      // Remove from directions renderers
      const newDirectionsRenderers = { ...directionsRenderers };
      delete newDirectionsRenderers[id];
      setDirectionsRenderers(newDirectionsRenderers);
      
      fetchRoutes();
    } catch (error) {
      alert('Error deleting flood route: ' + error.message);
    }
    setLoading(false);
  };

  // Save (add or update) route
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        routePoints: form.routePoints,
        timestamp: String(Date.now()),
        isArchived: false
      };
      
      let routeId;
      if (selectedRoute) {
        await updateDoc(doc(db, 'floodLocations', selectedRoute.id), {
          ...data,
          updatedAt: String(Date.now())
        });
        routeId = selectedRoute.id;
      } else {
        const docRef = await addDoc(collection(db, 'floodLocations'), data);
        routeId = docRef.id;
      }

      // Calculate directions for the new/updated route
      if (form.routePoints.length >= 2) {
        const directions = await calculateDirections(form.routePoints);
        if (directions) {
          setDirectionsRenderers(prev => ({
            ...prev,
            [routeId]: directions
          }));
        }
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

  // Remove a point from the route
  const handleRemovePoint = (idx) => {
    setForm((prev) => ({
      ...prev,
      routePoints: prev.routePoints.filter((_, i) => i !== idx),
    }));
  };

  // Start drawing mode for editing points
  const handleStartDrawing = () => {
    setDrawing(true);
  };

  // Stop drawing mode
  const handleStopDrawing = () => {
    setDrawing(false);
  };

  // Highlight route on map when selected in sidebar and center map on it
  const handleHighlightRoute = (route) => {
    setHighlightedRouteId(route.id);
    setForm({
      routePoints: route.routePoints || [],
    });
    
    // Center and zoom map to the route
    if (map && route.routePoints && route.routePoints.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add all route points to bounds
      route.routePoints.forEach(point => {
        bounds.extend(new window.google.maps.LatLng(
          parseFloat(point.latitude),
          parseFloat(point.longitude)
        ));
      });
      
      // Fit map to bounds with padding
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
      
      // If it's a single point or very small area, set a reasonable zoom level
      if (route.routePoints.length === 1) {
        map.setZoom(16);
        map.setCenter({
          lat: parseFloat(route.routePoints[0].latitude),
          lng: parseFloat(route.routePoints[0].longitude)
        });
      }
    }
  };

  // Open history modal
  const handleOpenHistory = () => {
    setHistoryModalOpen(true);
    fetchHistoryData();
  };

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

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

  return (
    <Layout>
      <div className="w-full h-full">
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

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={12}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  onClick={onMapClick}
                >
                  {/* Render directions for each route */}
                  {Object.entries(directionsRenderers).map(([routeId, directions]) => {
                    const route = routes.find(r => r.id === routeId);
                    const isArchived = route?.isArchived;
                    
                    return (
                      <DirectionsRenderer
                        key={routeId}
                        directions={directions}
                        options={{
                          suppressMarkers: true,
                          polylineOptions: {
                            strokeColor: routeId === highlightedRouteId 
                              ? '#e53e3e' 
                              : isArchived 
                                ? '#9ca3af' 
                                : '#3182ce',
                            strokeOpacity: isArchived ? 0.5 : 0.8,
                            strokeWeight: 6,
                            zIndex: routeId === highlightedRouteId ? 2 : 1,
                          }
                        }}
                        onClick={() => {
                          const route = routes.find(r => r.id === routeId);
                          if (route) handleHighlightRoute(route);
                        }}
                      />
                    );
                  })}
                  
                  {/* Show current drawing polyline (for add/edit) */}
                  {modalOpen && form.routePoints.length > 0 && (
                    <Polyline
                      path={form.routePoints.map(pt => ({ lat: parseFloat(pt.latitude), lng: parseFloat(pt.longitude) }))}
                      options={{
                        strokeColor: '#38a169',
                        strokeOpacity: 0.8,
                        strokeWeight: 4,
                        zIndex: 3,
                        icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }],
                      }}
                    />
                  )}
                  
                  {/* Markers for each point in the current drawing polyline */}
                  {modalOpen && form.routePoints.map((pt, idx) => (
                    <Marker
                      key={idx}
                      position={{ lat: parseFloat(pt.latitude), lng: parseFloat(pt.longitude) }}
                      icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                      title={`Point ${idx + 1}`}
                    />
                  ))}
                </GoogleMap>
              ) : <div>Loading...</div>}
            </div>
            <div>
              <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                <p className="text-[#111418] text-base font-medium leading-normal mb-4">
                  {viewMode === 'active' ? 'Active' : viewMode === 'archived' ? 'Archived' : 'All'} Routes ({routes.length})
                </p>
                <div className="max-h-96 overflow-y-auto">
                  {routes.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No {viewMode} routes found. 
                      {viewMode === 'active' && ' Click "Add New Route" to get started.'}
                    </p>
                  )}
                  {routes.map(route => (
                    <div key={route.id} className={`flex flex-col border-b py-3 last:border-b-0 hover:bg-gray-50 rounded p-2 cursor-pointer ${highlightedRouteId === route.id ? 'bg-blue-50' : ''}`} onClick={() => handleHighlightRoute(route)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold text-sm text-gray-800">
                              Route {route.id.substring(0, 8)}...
                            </div>
                            {getStatusBadge(route)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Points: {route.routePoints?.length || 0}
                          </div>
                          {route.timestamp && (
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(route.timestamp)}
                            </div>
                          )}
                          {route.archivedAt && (
                            <div className="text-xs text-gray-400 mt-1">
                              Archived: {formatTimestamp(route.archivedAt)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          {!route.isArchived && (
                            <>
                              <button
                                className="text-blue-600 hover:underline text-xs px-2 py-1 rounded hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRoute(route);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="text-orange-600 hover:underline text-xs px-2 py-1 rounded hover:bg-orange-50"
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
                                className="text-green-600 hover:underline text-xs px-2 py-1 rounded hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreRoute(route.id);
                                }}
                              >
                                Restore
                              </button>
                              <button
                                className="text-red-600 hover:underline text-xs px-2 py-1 rounded hover:bg-red-50"
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