import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { collection, getDocs, updateDoc, doc, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from './Layout';

const containerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 14.080778,
  lng: 121.175306,
};

const SosPage = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCzQbflN3B55lBQ8vTQKZF5qe9g0Mgrx7Q",
    libraries: ['geometry', 'maps']
  });

  const [map, setMap] = useState(null);
  const [sosReports, setSosReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [resolvedReports, setResolvedReports] = useState([]);
  const [rescuers, setRescuers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedRescuers, setSelectedRescuers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState('urgency');
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [showResolvedModal, setShowResolvedModal] = useState(false);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
          // Keep default location if geolocation fails
        }
      );
    }
  };

  // Helper function to safely access form data
  const getFormValue = (report, field, defaultValue = 'N/A') => {
    return report?.formAnswers?.[field] ?? defaultValue;
  };

  // Fetch SOS reports
  const fetchSosReports = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'sos_reports'));
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSosReports(reports);
    setLoading(false);
  };

  // Filter and sort reports based on selected filter
  const filterAndSortReports = useCallback(() => {
    // Separate active and resolved reports
    let activeReports = sosReports.filter(r => r.status !== 'resolved');
    let resolved = sosReports.filter(r => r.status === 'resolved');
    
    if (filterType === 'urgency') {
      // Sort by urgency score descending
      activeReports.sort((a, b) => b.urgencyScore - a.urgencyScore);
      resolved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort resolved by newest first
    } else if (filterType === 'nearest') {
      // Calculate distance for each report and sort by distance ascending
      activeReports = activeReports.map(report => ({
        ...report,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          report.location.latitude,
          report.location.longitude
        )
      })).sort((a, b) => a.distance - b.distance);
      
      resolved = resolved.map(report => ({
        ...report,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          report.location.latitude,
          report.location.longitude
        )
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    setFilteredReports(activeReports);
    setResolvedReports(resolved);
  }, [sosReports, filterType, userLocation]);

  // Fetch rescuers instead of volunteers
  const fetchRescuers = async () => {
    const q = query(collection(db, 'users'), where('userType', '==', 'rescuer'));
    const snapshot = await getDocs(q);
    setRescuers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchSosReports();
    fetchRescuers();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterAndSortReports();
  }, [sosReports, filterType, userLocation, filterAndSortReports]);

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(defaultCenter);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // Navigate map to specific coordinates
  const navigateToSOS = (report) => {
    if (map) {
      const position = { lat: report.location.latitude, lng: report.location.longitude };
      map.panTo(position);
      map.setZoom(15);
      setSelectedReport(report);
      // Reset selected rescuers when switching reports
      setSelectedRescuers([]);
    }
  };

  // Handle rescuer selection (multiple selection)
  const handleRescuerSelection = (rescuerId) => {
    setSelectedRescuers(prev => {
      if (prev.includes(rescuerId)) {
        // Remove if already selected
        return prev.filter(id => id !== rescuerId);
      } else {
        // Add if not selected
        return [...prev, rescuerId];
      }
    });
  };

  // Assign multiple rescuers
  const handleAssignRescuers = async () => {
    if (!selectedRescuers.length || !selectedReport) return;
    setAssigning(true);
    try {
      // Get existing rescuer units or initialize as empty array
      const existingRescuers = selectedReport.rescueUnits || [];
      
      // Combine existing rescuers with newly selected ones (avoid duplicates)
      const updatedRescuers = [...new Set([...existingRescuers, ...selectedRescuers])];
      
      await updateDoc(doc(db, 'sos_reports', selectedReport.id), {
        rescueUnits: updatedRescuers, // Changed to array for multiple rescuers
        status: 'responding',
      });
      
      // Simulate sending notification/message
      setMessage(`${selectedRescuers.length} rescuer(s) dispatched and user notified.`);
      setTimeout(() => setMessage(''), 3000);
      setSelectedReport(null);
      setSelectedRescuers([]);
      fetchSosReports();
    } catch (err) {
      setMessage('Failed to assign rescuers.');
      setTimeout(() => setMessage(''), 3000);
    }
    setAssigning(false);
  };

  // Remove a rescuer from the assignment
  const handleRemoveRescuer = async (rescuerId) => {
    if (!selectedReport) return;
    try {
      const updatedRescuers = (selectedReport.rescueUnits || []).filter(id => id !== rescuerId);
      await updateDoc(doc(db, 'sos_reports', selectedReport.id), {
        rescueUnits: updatedRescuers,
        status: updatedRescuers.length > 0 ? 'responding' : 'pending',
      });
      setMessage('Rescuer removed from assignment.');
      setTimeout(() => setMessage(''), 3000);
      fetchSosReports();
    } catch (err) {
      setMessage('Failed to remove rescuer.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Mark as safe
  const handleMarkSafe = async (reportId) => {
    try {
      await updateDoc(doc(db, 'sos_reports', reportId), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      setMessage('Marked as safe.');
      setTimeout(() => setMessage(''), 3000);
      fetchSosReports();
    } catch (err) {
      setMessage('Failed to mark as safe.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Get rescuer name by ID
  const getRescuerName = (rescuerId) => {
    const rescuer = rescuers.find(r => r.id === rescuerId);
    return rescuer ? `${rescuer.firstName} ${rescuer.lastName}` : 'Unknown Rescuer';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Layout>
      <div className="w-full h-full">
        <div className="px-6 py-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-3">
              <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">SOS Map & Dispatch</p>
              <p className="text-[#60758a] text-sm font-normal leading-normal">Monitor SOS requests, assign rescuers, and track rescue status in real time.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResolvedModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                View Resolved SOS ({resolvedReports.length})
              </button>
            </div>
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
                >
                  {filteredReports.map((report) => (
                    <Marker
                      key={report.id}
                      position={{ lat: report.location.latitude, lng: report.location.longitude }}
                      icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                      onClick={() => setSelectedReport(report)}
                    />
                  ))}
                  {selectedReport && (
                    <InfoWindow
                      position={{ lat: selectedReport.location.latitude, lng: selectedReport.location.longitude }}
                      onCloseClick={() => setSelectedReport(null)}
                    >
                      <div className="w-80 max-h-96 overflow-y-auto">
                        <h3 className="font-bold text-lg mb-2">SOS Details</h3>
                        <p><span className="font-medium">Urgency Score:</span> {selectedReport.urgencyScore || 'N/A'}</p>
                        <p><span className="font-medium">Danger Level:</span> {getFormValue(selectedReport, 'dangerLevel')}</p>
                        <p><span className="font-medium">People:</span> {getFormValue(selectedReport, 'numberOfPeople')}</p>
                        <p><span className="font-medium">Status:</span> {selectedReport.status || 'N/A'}</p>
                        <p><span className="font-medium">Notes:</span> {getFormValue(selectedReport, 'notes')}</p>
                        {selectedReport.formAnswers?.natureOfEmergency && (
                          <p><span className="font-medium">Emergency Type:</span> {Array.isArray(selectedReport.formAnswers.natureOfEmergency) 
                            ? selectedReport.formAnswers.natureOfEmergency.join(', ') 
                            : selectedReport.formAnswers.natureOfEmergency}</p>
                        )}
                        {selectedReport.formAnswers?.canEvacuate && (
                          <p><span className="font-medium">Can Evacuate:</span> {selectedReport.formAnswers.canEvacuate}</p>
                        )}
                        {selectedReport.distance && (
                          <p><span className="font-medium">Distance:</span> {selectedReport.distance.toFixed(2)} km</p>
                        )}
                        
                        {/* Show currently assigned rescuers */}
                        {selectedReport.rescueUnits && selectedReport.rescueUnits.length > 0 && (
                          <div className="mt-3">
                            <p className="font-medium mb-2">Assigned Rescuers:</p>
                            <div className="space-y-1">
                              {selectedReport.rescueUnits.map(rescuerId => (
                                <div key={rescuerId} className="flex justify-between items-center bg-green-100 p-2 rounded">
                                  <span className="text-sm">{getRescuerName(rescuerId)}</span>
                                  <button
                                    className="text-red-600 hover:text-red-800 text-xs"
                                    onClick={() => handleRemoveRescuer(rescuerId)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3">
                          {/* Always show rescuer assignment interface */}
                          <label className="block mb-2 font-medium">Assign Additional Rescuers</label>
                          <div className="max-h-32 overflow-y-auto border rounded p-2 mb-2">
                            {rescuers.map(rescuer => (
                              <label key={rescuer.id} className="flex items-center mb-1">
                                <input
                                  type="checkbox"
                                  checked={selectedRescuers.includes(rescuer.id)}
                                  onChange={() => handleRescuerSelection(rescuer.id)}
                                  disabled={selectedReport.rescueUnits?.includes(rescuer.id)}
                                  className="mr-2"
                                />
                                <span className={`text-sm ${selectedReport.rescueUnits?.includes(rescuer.id) ? 'text-gray-400' : ''}`}>
                                  {rescuer.firstName} {rescuer.lastName}
                                  {selectedReport.rescueUnits?.includes(rescuer.id) && ' (Already Assigned)'}
                                </span>
                              </label>
                            ))}
                          </div>
                          <button
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            onClick={handleAssignRescuers}
                            disabled={assigning || !selectedRescuers.length}
                          >
                            {assigning ? 'Assigning...' : `Dispatch ${selectedRescuers.length} Rescuer(s)`}
                          </button>

                          {selectedReport.status === 'responding' && (
                            <button
                              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-2"
                              onClick={() => handleMarkSafe(selectedReport.id)}
                            >
                              Mark as Safe
                            </button>
                          )}
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : <div>Loading Map...</div>}
            </div>
            <div>
              <div className="flex flex-col gap-4">
                {/* Filter Controls */}
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                  <p className="text-[#111418] text-base font-medium leading-normal mb-3">Filter SOS Reports</p>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="filter"
                        value="urgency"
                        checked={filterType === 'urgency'}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Highest Urgency Score</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="filter"
                        value="nearest"
                        checked={filterType === 'nearest'}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Nearest Location</span>
                    </label>
                  </div>
                </div>

                {/* Active SOS Priority List */}
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                  <p className="text-[#111418] text-base font-medium leading-normal mb-2">
                    Active SOS {filterType === 'urgency' ? 'Priority' : 'Distance'} List
                  </p>
                  {loading ? <div>Loading...</div> : (
                    <>
                      {filteredReports.length === 0 ? (
                        <p className="text-[#60758a] text-sm italic">No active SOS reports</p>
                      ) : (
                        <ol className="list-decimal ml-4">
                          {filteredReports.map((report, idx) => (
                            <li key={report.id} className="mb-2">
                              <div 
                                className="flex flex-col cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                onClick={() => navigateToSOS(report)}
                              >
                                <span className="font-bold text-[#0b80ee]">
                                  {filterType === 'urgency' 
                                    ? `Urgency: ${report.urgencyScore}` 
                                    : `Distance: ${report.distance?.toFixed(2)} km`
                                  }
                                </span>
                                <span className="text-[#111418]">
                                  {getFormValue(report, 'numberOfPeople')} people, Danger Level: {getFormValue(report, 'dangerLevel')}
                                </span>
                                <span className="text-[#60758a] text-xs">Status: {report.status}</span>
                                {report.rescueUnits && report.rescueUnits.length > 0 && (
                                  <span className="text-[#60758a] text-xs">
                                    {report.rescueUnits.length} rescuer(s) assigned
                                  </span>
                                )}
                                {filterType === 'urgency' && report.distance && (
                                  <span className="text-[#60758a] text-xs">
                                    Distance: {report.distance.toFixed(2)} km
                                  </span>
                                )}
                                {filterType === 'nearest' && (
                                  <span className="text-[#60758a] text-xs">
                                    Urgency: {report.urgencyScore}
                                  </span>
                                )}
                                <span className="text-[#0b80ee] text-xs mt-1 hover:underline">
                                  Click to view on map →
                                </span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </>
                  )}
                </div>
                {message && (
                  <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-center font-medium">{message}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resolved SOS Modal */}
        {showResolvedModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#111418]">Resolved SOS Reports</h2>
                <button
                  onClick={() => setShowResolvedModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {resolvedReports.length === 0 ? (
                  <p className="text-[#60758a] text-center py-8">No resolved SOS reports found.</p>
                ) : (
                  <div className="space-y-4">
                    {resolvedReports.map((report) => (
                      <div key={report.id} className="border border-[#dbe0e6] rounded-lg p-4 bg-green-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-bold text-lg mb-2 text-green-800">SOS #{report.id.slice(-6)}</h3>
                            <p><span className="font-medium">Urgency Score:</span> {report.urgencyScore || 'N/A'}</p>
                            <p><span className="font-medium">Danger Level:</span> {getFormValue(report, 'dangerLevel')}</p>
                            <p><span className="font-medium">People Involved:</span> {getFormValue(report, 'numberOfPeople')}</p>
                            <p><span className="font-medium">Emergency Type:</span> {
                              report.formAnswers?.natureOfEmergency 
                                ? (Array.isArray(report.formAnswers.natureOfEmergency) 
                                  ? report.formAnswers.natureOfEmergency.join(', ') 
                                  : report.formAnswers.natureOfEmergency)
                                : 'N/A'
                            }</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Status:</span> <span className="text-green-600 font-bold">RESOLVED</span></p>
                            <p><span className="font-medium">Created At:</span> {formatDate(report.createdAt)}</p>
                            <p><span className="font-medium">Resolved At:</span> {formatDate(report.resolvedAt)}</p>
                            {report.distance && (
                              <p><span className="font-medium">Distance:</span> {report.distance.toFixed(2)} km</p>
                            )}
                            {report.rescueUnits && report.rescueUnits.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium">Rescuers Involved:</p>
                                <div className="mt-1 space-y-1">
                                  {report.rescueUnits.map(rescuerId => (
                                    <span key={rescuerId} className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-xs mr-1">
                                      {getRescuerName(rescuerId)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {getFormValue(report, 'notes') !== 'N/A' && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p><span className="font-medium">Notes:</span> {getFormValue(report, 'notes')}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowResolvedModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SosPage; 