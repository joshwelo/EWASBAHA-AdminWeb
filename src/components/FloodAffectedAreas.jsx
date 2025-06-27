import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

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
  const [form, setForm] = useState(initialForm);
  const [drawing, setDrawing] = useState(false); // Drawing mode for new/edit route
  const [loading, setLoading] = useState(false);
  const [highlightedRouteId, setHighlightedRouteId] = useState(null);
  const [directionsRenderers, setDirectionsRenderers] = useState({}); // Store directions for each route

  // Fetch all routes from Firestore
  const fetchRoutes = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'floodLocations'));
    const routesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setRoutes(routesData);
    
    // Calculate directions for each route
    if (isLoaded && window.google) {
      const newDirectionsRenderers = {};
      for (const route of routesData) {
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
  }, [isLoaded]);

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

  // Delete a route
  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Delete this flood route?')) return;
    setLoading(true);
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
    setLoading(false);
  };

  // Save (add or update) route
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        routePoints: form.routePoints,
        timestamp: String(Date.now())
      };
      
      let routeId;
      if (selectedRoute) {
        await updateDoc(doc(db, 'floodLocations', selectedRoute.id), data);
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

  return (
    <Layout>
      <div className="w-full h-full">
        <div className="px-6 py-6 flex justify-between items-center">
          <div className="flex flex-col gap-3">
            <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Flood Affected Areas</p>
            <p className="text-[#60758a] text-sm font-normal leading-normal">Visual interface to mark and verify affected routes.</p>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none font-medium"
          >
            Add New Route
          </button>
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
                  {Object.entries(directionsRenderers).map(([routeId, directions]) => (
                    <DirectionsRenderer
                      key={routeId}
                      directions={directions}
                      options={{
                        suppressMarkers: true,
                        polylineOptions: {
                          strokeColor: routeId === highlightedRouteId ? '#e53e3e' : '#3182ce',
                          strokeOpacity: 0.8,
                          strokeWeight: 6,
                          zIndex: routeId === highlightedRouteId ? 2 : 1,
                        }
                      }}
                      onClick={() => {
                        const route = routes.find(r => r.id === routeId);
                        if (route) handleHighlightRoute(route);
                      }}
                    />
                  ))}
                  
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
                <p className="text-[#111418] text-base font-medium leading-normal mb-4">Flood Routes ({routes.length})</p>
                <div className="max-h-96 overflow-y-auto">
                  {routes.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No routes found. Click "Add New Route" to get started.</p>
                  )}
                  {routes.map(route => (
                    <div key={route.id} className={`flex flex-col border-b py-3 last:border-b-0 hover:bg-gray-50 rounded p-2 cursor-pointer ${highlightedRouteId === route.id ? 'bg-blue-50' : ''}`} onClick={() => handleHighlightRoute(route)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-800">
                            Route {route.id.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Points: {route.routePoints?.length || 0}
                          </div>
                          {route.timestamp && (
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(route.timestamp)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
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
                            className="text-red-600 hover:underline text-xs px-2 py-1 rounded hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoute(route.id);
                            }}
                          >
                            Delete
                          </button>
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
      </div>
    </Layout>
  );
};

export default FloodAffectedAreas;