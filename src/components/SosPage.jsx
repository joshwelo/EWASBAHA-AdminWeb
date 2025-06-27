import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
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
  const [volunteers, setVolunteers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState('urgency'); // 'urgency' or 'nearest'
  const [userLocation, setUserLocation] = useState(defaultCenter);

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
    let filtered = sosReports.filter(r => r.status !== 'safe');
    
    if (filterType === 'urgency') {
      // Sort by urgency score descending
      filtered.sort((a, b) => b.urgencyScore - a.urgencyScore);
    } else if (filterType === 'nearest') {
      // Calculate distance for each report and sort by distance ascending
      filtered = filtered.map(report => ({
        ...report,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          report.location.latitude,
          report.location.longitude
        )
      })).sort((a, b) => a.distance - b.distance);
    }
    
    setFilteredReports(filtered);
  }, [sosReports, filterType, userLocation]);

  // Fetch volunteers
  const fetchVolunteers = async () => {
    const q = query(collection(db, 'users'), where('userType', '==', 'volunteer'));
    const snapshot = await getDocs(q);
    setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchSosReports();
    fetchVolunteers();
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
    }
  };

  // Assign rescuer
  const handleAssignRescuer = async () => {
    if (!selectedVolunteer || !selectedReport) return;
    setAssigning(true);
    try {
      await updateDoc(doc(db, 'sos_reports', selectedReport.id), {
        rescueUnit: selectedVolunteer,
        status: 'responding',
      });
      // Simulate sending notification/message
      setMessage('Rescuer dispatched and user notified.');
      setTimeout(() => setMessage(''), 3000);
      setSelectedReport(null);
      setSelectedVolunteer('');
      fetchSosReports();
    } catch (err) {
      setMessage('Failed to assign rescuer.');
      setTimeout(() => setMessage(''), 3000);
    }
    setAssigning(false);
  };

  // Mark as safe
  const handleMarkSafe = async (reportId) => {
    try {
      await updateDoc(doc(db, 'sos_reports', reportId), {
        status: 'safe',
      });
      setMessage('Marked as safe.');
      setTimeout(() => setMessage(''), 3000);
      fetchSosReports();
    } catch (err) {
      setMessage('Failed to mark as safe.');
      setTimeout(() => setMessage(''), 3000);
    }
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
                      <div className="w-64">
                        <h3 className="font-bold text-lg mb-2">SOS Details</h3>
                        <p><span className="font-medium">Urgency Score:</span> {selectedReport.urgencyScore}</p>
                        <p><span className="font-medium">Danger Level:</span> {selectedReport.dangerLevel}</p>
                        <p><span className="font-medium">People:</span> {selectedReport.numberOfPeople}</p>
                        <p><span className="font-medium">Status:</span> {selectedReport.status}</p>
                        <p><span className="font-medium">Notes:</span> {selectedReport.notes}</p>
                        {selectedReport.distance && (
                          <p><span className="font-medium">Distance:</span> {selectedReport.distance.toFixed(2)} km</p>
                        )}
                        <div className="mt-2">
                          {selectedReport.status === 'pending' && (
                            <>
                              <label className="block mb-1 font-medium">Assign Rescuer</label>
                              <select
                                className="w-full border rounded p-2 mb-2"
                                value={selectedVolunteer}
                                onChange={e => setSelectedVolunteer(e.target.value)}
                              >
                                <option value="">Select Volunteer</option>
                                {volunteers.map(v => (
                                  <option key={v.id} value={v.id}>{v.firstName} {v.lastName}</option>
                                ))}
                              </select>
                              <button
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={handleAssignRescuer}
                                disabled={assigning || !selectedVolunteer}
                              >
                                {assigning ? 'Assigning...' : 'Dispatch Rescuer'}
                              </button>
                            </>
                          )}
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

                {/* SOS Priority List */}
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                  <p className="text-[#111418] text-base font-medium leading-normal mb-2">
                    SOS {filterType === 'urgency' ? 'Priority' : 'Distance'} List
                  </p>
                  {loading ? <div>Loading...</div> : (
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
                              {report.numberOfPeople} people, Danger Level: {report.dangerLevel}
                            </span>
                            <span className="text-[#60758a] text-xs">Status: {report.status}</span>
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
                </div>
                {message && (
                  <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-center font-medium">{message}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SosPage;