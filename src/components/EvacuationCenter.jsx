import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const containerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 14.1119478,
  lng: 121.1724706,
};

const initialForm = {
  centerName: '',
  campManager: '',
  contactNum: '',
  capacityFam: '',
  capacityInd: '',
  numClassroom: '',
  latitude: '',
  longitude: '',
};

const EvacuationCenter = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCzQbflN3B55lBQ8vTQKZF5qe9g0Mgrx7Q",
    libraries: ['geometry', 'maps']
  });

  const [map, setMap] = useState(null);
  const [centers, setCenters] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Fetch evacuation centers
  const fetchCenters = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'evacuationCenter'));
    setCenters(querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Prefer top-level latitude/longitude, fallback to coordinates map
      const latitude = data.latitude ?? data.coordinates?.latitude ?? '';
      const longitude = data.longitude ?? data.coordinates?.longitude ?? '';
      return { id: doc.id, ...data, latitude, longitude };
    }));
    setLoading(false);
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  // Open modal for adding new center
  const handleAddNew = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Map marker click to edit
  const handleMarkerClick = (center) => {
    setForm({
      centerName: center.centerName || '',
      campManager: center.campManager || '',
      contactNum: center.contactNum || '',
      capacityFam: center.capacityFam || '',
      capacityInd: center.capacityInd || '',
      numClassroom: center.numClassroom || '',
      latitude: center.latitude || '',
      longitude: center.longitude || '',
    });
    setEditingId(center.id);
    setIsModalOpen(true);
  };

  // Map click to set coordinates
  const onMapClick = useCallback((event) => {
    if (isModalOpen) {
      setForm((prev) => ({
        ...prev,
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      }));
    } else {
      // Set marker for new location when not in modal
      setSelectedMarker({
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      });
      setForm((prev) => ({
        ...prev,
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      }));
    }
  }, [isModalOpen]);

  // Add or update evacuation center
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...form,
        capacityFam: Number(form.capacityFam),
        capacityInd: Number(form.capacityInd),
        numClassroom: Number(form.numClassroom),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      if (editingId) {
        await updateDoc(doc(db, 'evacuationCenter', editingId), data);
      } else {
        await addDoc(collection(db, 'evacuationCenter'), data);
      }
      setForm(initialForm);
      setEditingId(null);
      setIsModalOpen(false);
      setSelectedMarker(null);
      fetchCenters();
    } catch (err) {
      alert('Error saving evacuation center: ' + err.message);
    }
    setLoading(false);
  };

  // Delete evacuation center
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this evacuation center?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'evacuationCenter', id));
      fetchCenters();
      if (editingId === id) {
        setForm(initialForm);
        setEditingId(null);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert('Error deleting evacuation center: ' + err.message);
    }
    setLoading(false);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(defaultCenter);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  return (
    <Layout>
      <div className="w-full h-full">
        <div className="px-6 py-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-3">
              <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Evacuation Centers</p>
              <p className="text-[#60758a] text-sm font-normal leading-normal">Manage and view evacuation centers on the map. Click on the map to place a marker, then click "Add New Center".</p>
            </div>
            <button 
              onClick={handleAddNew}
              className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none font-medium"
            >
              Add New Center
            </button>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={defaultCenter}
                  zoom={12}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  onClick={onMapClick}
                >
                  {/* Existing evacuation centers */}
                  {centers.map((center) => (
                    center.latitude && center.longitude && (
                      <Marker
                        key={center.id}
                        position={{ lat: center.latitude, lng: center.longitude }}
                        onClick={() => handleMarkerClick(center)}
                        icon={{ 
                          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                          scaledSize: new window.google.maps.Size(32, 32)
                        }}
                        title={center.centerName}
                      />
                    )
                  ))}
                  
                  {/* Temporary marker for new location */}
                  {selectedMarker && !isModalOpen && (
                    <Marker
                      position={selectedMarker}
                      icon={{ 
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new window.google.maps.Size(32, 32)
                      }}
                      title="New Location"
                    />
                  )}
                  
                  {/* Preview marker when editing coordinates in modal */}
                  {form.latitude && form.longitude && isModalOpen && (
                    <Marker
                      position={{ lat: Number(form.latitude), lng: Number(form.longitude) }}
                      icon={{ 
                        url: editingId ? 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new window.google.maps.Size(32, 32)
                      }}
                      title={editingId ? "Editing Location" : "New Location"}
                    />
                  )}
                </GoogleMap>
              ) : <div className="flex items-center justify-center h-96">Loading map...</div>}
            </div>
            
            <div>
              <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                <p className="text-[#111418] text-base font-medium leading-normal mb-4">Evacuation Centers ({centers.length})</p>
                <div className="max-h-96 overflow-y-auto">
                  {centers.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No centers found. Click "Add New Center" to get started.</p>
                  )}
                  {centers.map(center => (
                    <div key={center.id} className="flex flex-col border-b py-3 last:border-b-0 hover:bg-gray-50 rounded p-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-800">{center.centerName}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Manager: {center.campManager}
                          </div>
                          <div className="text-xs text-gray-500">
                            Contact: {center.contactNum}
                          </div>
                          <div className="text-xs text-gray-500">
                            Capacity: {center.capacityFam || 0} families, {center.capacityInd || 0} individuals
                          </div>
                          <div className="text-xs text-gray-500">
                            Classrooms: {center.numClassroom || 0}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            ({center.latitude ? center.latitude.toFixed(4) : 'N/A'}, {center.longitude ? center.longitude.toFixed(4) : 'N/A'})
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 ml-2">
                          <button 
                            className="text-blue-600 hover:underline text-xs px-2 py-1 rounded hover:bg-blue-50" 
                            onClick={() => handleMarkerClick(center)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:underline text-xs px-2 py-1 rounded hover:bg-red-50" 
                            onClick={() => handleDelete(center.id)}
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingId ? 'Edit Evacuation Center' : 'Add New Evacuation Center'}
                  </h2>
                  <button 
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Center Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter center name" 
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.centerName} 
                      onChange={e => setForm({ ...form, centerName: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Camp Manager</label>
                    <input 
                      type="text" 
                      placeholder="Enter manager name" 
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.campManager} 
                      onChange={e => setForm({ ...form, campManager: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter contact number" 
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.contactNum} 
                      onChange={e => setForm({ ...form, contactNum: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Family Capacity</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={form.capacityFam} 
                        onChange={e => setForm({ ...form, capacityFam: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Individual Capacity</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={form.capacityInd} 
                        onChange={e => setForm({ ...form, capacityInd: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Classrooms</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.numClassroom} 
                      onChange={e => setForm({ ...form, numClassroom: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="Click on map" 
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={form.latitude} 
                        onChange={e => setForm({ ...form, latitude: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="Click on map" 
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={form.longitude} 
                        onChange={e => setForm({ ...form, longitude: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Tip: Click on the map to automatically set the coordinates, or enter them manually.
                  </p>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : (editingId ? 'Update Center' : 'Add Center')}
                    </button>
                    <button 
                      type="button" 
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500" 
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EvacuationCenter;