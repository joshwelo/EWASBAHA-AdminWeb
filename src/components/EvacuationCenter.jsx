import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultCenter = [14.1119478, 121.1724706];

const initialForm = {
  centerName: '',
  campManager: '',
  contactNum: '',
  capacityFam: '',
  capacityInd: '',
  numClassroom: '',
  latitude: '',
  longitude: '',
  assignedVolunteers: [],
};

// Component to handle map clicks
const MapClickHandler = ({ onMapClick, isActive }) => {
  useMapEvents({
    click: (e) => {
      if (isActive) {
        onMapClick(e);
      }
    },
  });
  return null;
};

// Component to handle map centering
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
};

const EvacuationCenter = () => {
  const [centers, setCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef();

  // Fetch evacuation centers
  const fetchCenters = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'evacuationCenter'));
    const centersData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Prefer top-level latitude/longitude, fallback to coordinates map
      const latitude = data.latitude ?? data.coordinates?.latitude ?? '';
      const longitude = data.longitude ?? data.coordinates?.longitude ?? '';
      return { id: doc.id, ...data, latitude, longitude };
    });
    setCenters(centersData);
    setFilteredCenters(centersData);
    setLoading(false);
  };

  // Fetch volunteers
  const fetchVolunteers = async () => {
    const snapshot = await getDocs(collection(db, 'volunteers'));
    setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch users
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchCenters();
    fetchVolunteers();
    fetchUsers();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCenters(centers);
    } else {
      const filtered = centers.filter(center => 
        center.centerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.campManager?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.contactNum?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCenters(filtered);
    }
  }, [searchQuery, centers]);

  // Open form for adding new center
  const handleAddNew = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowAddForm(true);
  };

  // Zoom to center location only
  const handleCenterClick = (center) => {
    if (center.latitude && center.longitude) {
      setMapCenter([center.latitude, center.longitude]);
      setMapZoom(16);
    }
  };

  // Open edit modal for center
  const handleEditCenter = (center) => {
    setForm({
      centerName: center.centerName || '',
      campManager: center.campManager || '',
      contactNum: center.contactNum || '',
      capacityFam: center.capacityFam || '',
      capacityInd: center.capacityInd || '',
      numClassroom: center.numClassroom || '',
      latitude: center.latitude || '',
      longitude: center.longitude || '',
      assignedVolunteers: center.assignedVolunteers || [],
    });
    setSelectedVolunteers(center.assignedVolunteers || []);
    setEditingId(center.id);
    setIsModalOpen(true);
  };

  // Map click to set coordinates
  const onMapClick = useCallback((event) => {
    const { lat, lng } = event.latlng;
    if (isModalOpen || showAddForm) {
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    } else {
      // Set marker for new location when not in modal or form
      setSelectedMarker([lat, lng]);
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }
  }, [isModalOpen, showAddForm]);

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
        assignedVolunteers: selectedVolunteers,
      };
      if (editingId) {
        await updateDoc(doc(db, 'evacuationCenter', editingId), data);
      } else {
        await addDoc(collection(db, 'evacuationCenter'), data);
      }
      setForm(initialForm);
      setEditingId(null);
      setIsModalOpen(false);
      setShowAddForm(false);
      setSelectedMarker(null);
      setSelectedVolunteers([]);
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
        setShowAddForm(false);
      }
    } catch (err) {
      alert('Error deleting evacuation center: ' + err.message);
    }
    setLoading(false);
  };

  // Close modal and form
  const closeModal = () => {
    setIsModalOpen(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const closeAddForm = () => {
    setShowAddForm(false);
    setForm(initialForm);
    setSelectedMarker(null);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

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
              <div style={{ height: '500px', width: '100%' }}>
                <MapContainer
                  center={defaultCenter}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapController center={mapCenter} zoom={mapZoom} />
                  <MapClickHandler 
                    onMapClick={onMapClick} 
                    isActive={true}
                  />
                  
                  {/* Existing evacuation centers */}
                  {filteredCenters.map((center) => (
                    center.latitude && center.longitude && (
                      <Marker
                        key={center.id}
                        position={[center.latitude, center.longitude]}
                        icon={blueIcon}
                      >
                        <Popup maxWidth={400} className="custom-popup">
                          <div className="w-[350px] flex flex-col bg-white rounded-lg shadow-xl overflow-hidden">
                            <div className="bg-blue-600 text-white p-3 rounded-t-lg">
                              <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg">{center.centerName}</h3>
                              </div>
                              <div className="text-xs mt-1">Manager: {center.campManager}</div>
                              <div className="text-xs">Contact: {center.contactNum}</div>
                            </div>
                            <div className="p-3 flex flex-col gap-2">
                              <div className="text-xs text-gray-700">Capacity: {center.capacityFam || 0} families, {center.capacityInd || 0} individuals</div>
                              <div className="text-xs text-gray-700">Classrooms: {center.numClassroom || 0}</div>
                              <div className="text-xs text-gray-400">({center.latitude ? Number(center.latitude).toFixed(4) : 'N/A'}, {center.longitude ? Number(center.longitude).toFixed(4) : 'N/A'})</div>
                              <div className="mt-2">
                                <div className="font-semibold text-sm mb-1">Assigned Volunteers</div>
                                {center.assignedVolunteers && center.assignedVolunteers.length > 0 ? (
                                  <ul className="ml-2 list-disc">
                                    {center.assignedVolunteers.map(volId => {
                                      const vol = volunteers.find(v => v.id === volId);
                                      const user = vol ? users.find(u => u.id === vol.userId) : null;
                                      return (
                                        <li key={volId} className="mb-1">
                                          <span className="font-medium text-gray-700">{user ? `${user.firstName} ${user.lastName}` : volId}</span>
                                          {vol && vol.choices && vol.choices.length > 0 && (
                                            <span className="ml-1 text-blue-600">[{vol.choices.join(', ')}]</span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <span className="ml-2 text-gray-400">None assigned</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <div className="font-semibold text-sm mb-1">Assign Volunteers</div>
                                <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                                  {volunteers.length === 0 ? (
                                    <div className="text-xs text-gray-400">No volunteers available</div>
                                  ) : (
                                    volunteers.map(vol => {
                                      const user = users.find(u => u.id === vol.userId);
                                      const name = user ? `${user.firstName} ${user.lastName}` : vol.userId;
                                      return (
                                        <label key={vol.id} className="flex items-center gap-2 text-xs py-1 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={center.assignedVolunteers && center.assignedVolunteers.includes(vol.id)}
                                            onChange={async e => {
                                              let updated;
                                              if (e.target.checked) {
                                                updated = [...(center.assignedVolunteers || []), vol.id];
                                              } else {
                                                updated = (center.assignedVolunteers || []).filter(id => id !== vol.id);
                                              }
                                              await updateDoc(doc(db, 'evacuationCenter', center.id), { assignedVolunteers: updated });
                                              fetchCenters();
                                            }}
                                          />
                                          <span>{name}</span>
                                          {vol.choices && vol.choices.length > 0 && (
                                            <span className="ml-2 text-blue-600">[{vol.choices.join(', ')}]</span>
                                          )}
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}
                  
                  {/* Temporary marker for new location */}
                  {selectedMarker && !isModalOpen && !showAddForm && (
                    <Marker
                      position={selectedMarker}
                      icon={greenIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>New Location</strong><br/>
                          Click "Add New Center" to create an evacuation center here.
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Preview marker when editing coordinates in modal or form */}
                  {form.latitude && form.longitude && (isModalOpen || showAddForm) && (
                    <Marker
                      position={[Number(form.latitude), Number(form.longitude)]}
                      icon={editingId ? yellowIcon : greenIcon}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>{editingId ? "Editing Location" : "New Location"}</strong><br/>
                          Lat: {Number(form.latitude).toFixed(4)}<br/>
                          Lng: {Number(form.longitude).toFixed(4)}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
            
            <div>
              {/* Add Form */}
              {showAddForm ? (
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Add New Evacuation Center</h3>
                    <button 
                      onClick={closeAddForm}
                      className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Center Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter center name" 
                        className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        value={form.centerName} 
                        onChange={e => setForm({ ...form, centerName: e.target.value })} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Camp Manager</label>
                      <input 
                        type="text" 
                        placeholder="Enter manager name" 
                        className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        value={form.campManager} 
                        onChange={e => setForm({ ...form, campManager: e.target.value })} 
                        required 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter contact number" 
                        className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        value={form.contactNum} 
                        onChange={e => setForm({ ...form, contactNum: e.target.value })} 
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Family Capacity</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          value={form.capacityFam} 
                          onChange={e => setForm({ ...form, capacityFam: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Individual Capacity</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          value={form.capacityInd} 
                          onChange={e => setForm({ ...form, capacityInd: e.target.value })} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Number of Classrooms</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                        value={form.numClassroom} 
                        onChange={e => setForm({ ...form, numClassroom: e.target.value })} 
                        required 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                        <input 
                          type="number" 
                          step="any" 
                          placeholder="Click on map" 
                          className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          value={form.latitude} 
                          onChange={e => setForm({ ...form, latitude: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                        <input 
                          type="number" 
                          step="any" 
                          placeholder="Click on map" 
                          className="w-full px-2 py-1.5 text-xs text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
                          value={form.longitude} 
                          onChange={e => setForm({ ...form, longitude: e.target.value })} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Click on the map to set coordinates
                    </p>
                    
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="submit" 
                        className="flex-1 px-3 py-1.5 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none disabled:opacity-50" 
                        disabled={loading}
                      >
                        {loading ? 'Adding...' : 'Add Center'}
                      </button>
                      <button 
                        type="button" 
                        className="flex-1 px-3 py-1.5 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none" 
                        onClick={closeAddForm}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[#111418] text-base font-medium leading-normal">Evacuation Centers ({filteredCenters.length})</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search centers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-xs text-gray-500 mt-1">
                        {filteredCenters.length} of {centers.length} centers shown
                      </p>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {filteredCenters.length === 0 && searchQuery && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No centers found matching "{searchQuery}". 
                        <button 
                          onClick={clearSearch} 
                          className="text-blue-600 hover:underline ml-1"
                        >
                          Clear search
                        </button>
                      </p>
                    )}
                    {filteredCenters.length === 0 && !searchQuery && (
                      <p className="text-gray-500 text-sm text-center py-4">No centers found. Click "Add New Center" to get started.</p>
                    )}
                    {filteredCenters.map(center => (
                      <div key={center.id} className="flex flex-col border-b py-3 last:border-b-0 hover:bg-gray-50 rounded p-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 cursor-pointer" onClick={() => {
                            if (center.latitude && center.longitude) {
                              setMapCenter([Number(center.latitude), Number(center.longitude)]);
                              setMapZoom(16);
                            }
                          }}>
                            <div className="font-semibold text-sm text-gray-800 hover:text-blue-600">{center.centerName}</div>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCenter(center);
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="text-red-600 hover:underline text-xs px-2 py-1 rounded hover:bg-red-50" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(center.id);
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
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingId ? 'Edit Evacuation Center' : 'Add New Evacuation Center'}
                  </h2>
                  <button 
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
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
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.contactNum} 
                      onChange={e => setForm({ ...form, contactNum: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Family Capacity</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                      className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={form.numClassroom} 
                      onChange={e => setForm({ ...form, numClassroom: e.target.value })} 
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="Click on map" 
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                        className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={form.longitude} 
                        onChange={e => setForm({ ...form, longitude: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign Volunteers</label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded p-3 bg-gray-50">
                      {volunteers.length === 0 ? (
                        <div className="text-sm text-gray-500">No volunteers available</div>
                      ) : (
                        volunteers.map(volunteer => {
                          const user = users.find(u => u.id === volunteer.userId);
                          const name = user ? `${user.firstName} ${user.lastName}` : volunteer.userId;
                          return (
                            <label key={volunteer.id} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedVolunteers.includes(volunteer.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedVolunteers([...selectedVolunteers, volunteer.id]);
                                  } else {
                                    setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteer.id));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span>{name}</span>
                              {volunteer.choices && volunteer.choices.length > 0 && (
                                <span className="ml-2 text-blue-600 text-xs">[{volunteer.choices.join(', ')}]</span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    Click on the map to set coordinates
                  </p>
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" 
                      disabled={loading}
                    >
                      {loading ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Center' : 'Add Center')}
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