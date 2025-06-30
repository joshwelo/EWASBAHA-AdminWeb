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

// Helper Components
const InfoCard = ({ label, value, highlight = false }) => (
  <div className={`p-3 rounded-md shadow-sm ${highlight ? 'bg-red-100 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
    <p className={`text-xl font-bold ${highlight ? 'text-red-600' : 'text-gray-800'}`}>{value}</p>
  </div>
);

const Section = ({ title, children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    <h4 className="font-bold text-lg mb-2 text-gray-800 border-b pb-1">{title}</h4>
    {children}
  </div>
);

const PersonnelSection = ({ title, personnel, getDetails, handleRemove, color, showSkills = false }) => {
  const bgColor = color === 'green' ? 'bg-green-50' : 'bg-blue-50';
  const textColor = color === 'green' ? 'text-green-800' : 'text-blue-800';

  return (
    <Section title={title}>
      <div className="space-y-2">
        {personnel.map(id => {
          const details = getDetails(id);
          const name = showSkills ? details.name : details;
          const skills = showSkills ? details.choices : [];
          
          return (
            <div key={id} className={`flex justify-between items-center p-2 rounded-lg ${bgColor} ${textColor}`}>
              <div>
                <span className="font-medium">{name}</span>
                {showSkills && skills && skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skills.map((skill, i) => (
                      <span key={i} className="text-xs bg-white px-1.5 py-0.5 rounded-full shadow-sm">{skill}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemove(id)}
                className="text-red-500 hover:text-red-700 font-bold text-xl"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-600 bg-blue-50'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

const PersonnelItem = ({ id, name, status, skills, isSelected, isAssigned, onSelect }) => {
  if (isAssigned) return null;
  
  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer mb-2 transition-colors ${
        isSelected ? 'bg-blue-200 ring-2 ring-blue-400' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      onClick={() => onSelect(id)}
    >
      <div className="flex-grow mr-2">
        <span className="font-medium text-gray-900">{name}</span>
        {status && (
          <span className={`text-xs ml-2 capitalize px-1.5 py-0.5 rounded-full ${
            status === 'available' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
          }`}>
            {status}
          </span>
        )}
        {skills && skills.length > 0 && (
          <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-1">
            {skills.map(skill => <span key={skill} className="bg-white px-1.5 py-0.5 rounded-md shadow-sm">{skill}</span>)}
          </div>
        )}
      </div>
      <div className={`w-5 h-5 border-2 rounded flex-shrink-0 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`} />
    </div>
  );
};

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

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
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState([]); // Add users state to get volunteer names
  const [selectedReport, setSelectedReport] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedRescuers, setSelectedRescuers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filterType, setFilterType] = useState('urgency');
  const [userLocation, setUserLocation] = useState(defaultCenter);
  const [showResolvedModal, setShowResolvedModal] = useState(false);
  const [activeTab, setActiveTab] = useState('rescuers');

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

  // Fetch rescuers
  const fetchRescuers = async () => {
    const q = query(collection(db, 'users'), where('userType', '==', 'rescuer'));
    const snapshot = await getDocs(q);
    setRescuers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch volunteers from volunteers collection
  const fetchVolunteers = async () => {
    const snapshot = await getDocs(collection(db, 'volunteers'));
    setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Fetch users to get volunteer names
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchSosReports();
    fetchRescuers();
    fetchVolunteers();
    fetchUsers();
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
      setSelectedVolunteers([]);
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

  // Handle volunteer selection (multiple selection)
  const handleVolunteerSelection = (volunteerId) => {
    setSelectedVolunteers(prev => {
      if (prev.includes(volunteerId)) {
        return prev.filter(id => id !== volunteerId);
      } else {
        return [...prev, volunteerId];
      }
    });
  };

  // Assign multiple rescuers and volunteers
  const handleAssignUnits = async () => {
    if ((!selectedRescuers.length && !selectedVolunteers.length) || !selectedReport) return;
    setAssigning(true);
    try {
      // Get existing units or initialize as empty arrays
      const existingRescuers = selectedReport.rescueUnits || [];
      const existingVolunteers = selectedReport.volunteerUnits || [];
      // Combine existing and newly selected, avoid duplicates
      const updatedRescuers = [...new Set([...existingRescuers, ...selectedRescuers])];
      const updatedVolunteers = [...new Set([...existingVolunteers, ...selectedVolunteers])];
      await updateDoc(doc(db, 'sos_reports', selectedReport.id), {
        rescueUnits: updatedRescuers,
        volunteerUnits: updatedVolunteers,
        status: 'responding',
      });
      setMessage(`${selectedRescuers.length} rescuer(s) and ${selectedVolunteers.length} volunteer(s) dispatched and user notified.`);
      setTimeout(() => setMessage(''), 3000);
      setSelectedReport(null);
      setSelectedRescuers([]);
      setSelectedVolunteers([]);
      fetchSosReports();
    } catch (err) {
      setMessage('Failed to assign units.');
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
      // Fetch updated report and update selectedReport
      const updatedDoc = await getDocs(query(collection(db, 'sos_reports'), where('__name__', '==', selectedReport.id)));
      if (!updatedDoc.empty) {
        setSelectedReport({ id: selectedReport.id, ...updatedDoc.docs[0].data() });
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      setMessage('Failed to remove rescuer.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Remove a volunteer from the assignment
  const handleRemoveVolunteer = async (volunteerId) => {
    if (!selectedReport) return;
    try {
      const updatedVolunteers = (selectedReport.volunteerUnits || []).filter(id => id !== volunteerId);
      await updateDoc(doc(db, 'sos_reports', selectedReport.id), {
        volunteerUnits: updatedVolunteers,
        status: (selectedReport.rescueUnits?.length > 0 || updatedVolunteers.length > 0) ? 'responding' : 'pending',
      });
      setMessage('Volunteer removed from assignment.');
      setTimeout(() => setMessage(''), 3000);
      fetchSosReports();
      // Fetch updated report and update selectedReport
      const updatedDoc = await getDocs(query(collection(db, 'sos_reports'), where('__name__', '==', selectedReport.id)));
      if (!updatedDoc.empty) {
        setSelectedReport({ id: selectedReport.id, ...updatedDoc.docs[0].data() });
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      setMessage('Failed to remove volunteer.');
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

  // Get volunteer name by ID (from users collection using volunteer's userId)
  const getVolunteerName = (volunteerId) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return 'Unknown Volunteer';
    
    const user = users.find(u => u.id === volunteer.userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown Volunteer';
  };

  // Get volunteer details by ID
  const getVolunteerDetails = (volunteerId) => {
    const volunteer = volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return null;
    
    const user = users.find(u => u.id === volunteer.userId);
    return {
      name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Volunteer',
      status: volunteer.status || 'unknown',
      choices: volunteer.choices || [],
      volunteer: volunteer
    };
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
  <div className="w-[500px]  flex flex-col bg-white rounded-lg shadow-xl overflow-hidden">
    {/* Header Section */}
    <div className="bg-red-600 text-white p-4">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-xl">SOS Emergency</h3>
        <button 
          onClick={() => setSelectedReport(null)}
          className="text-white hover:text-gray-200 text-lg"
        >
          &times;
        </button>
      </div>
      <div className="flex items-center mt-2">
        <span className="bg-white text-red-600 py-1 px-3 rounded-full text-sm font-bold">
          {selectedReport.status || 'ACTIVE'}
        </span>
        <span className="ml-3 font-medium">
          {selectedReport.distance ? `${selectedReport.distance.toFixed(1)} km away` : 'Nearby'}
        </span>
      </div>
    </div>

    {/* Main Content - Scrollable */}
    <div className="p-4 overflow-y-auto flex-grow">
    {/* Critical Information Group */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <InfoCard label="Urgency Score" value={selectedReport.urgencyScore || 'N/A'} 
                  highlight={selectedReport.urgencyScore > 7} />
        <InfoCard label="Danger Level" value={getFormValue(selectedReport, 'dangerLevel')} />
        <InfoCard label="People" value={getFormValue(selectedReport, 'numberOfPeople')} />
        <InfoCard label="Can Evacuate" value={getFormValue(selectedReport, 'canEvacuate')} />
      </div>

      {/* Emergency Details */}
      <Section title="Emergency Details">
        <p className="text-gray-700">
          {getFormValue(selectedReport, 'notes') || 'No additional notes'}
        </p>
        {selectedReport.formAnswers?.natureOfEmergency && (
          <div className="mt-2">
            <span className="font-medium block mb-1">Emergency Type:</span>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(selectedReport.formAnswers.natureOfEmergency)
                ? selectedReport.formAnswers.natureOfEmergency
                : [selectedReport.formAnswers.natureOfEmergency]
              ).map((type, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Assigned Personnel Section */}
      {selectedReport.rescueUnits?.length > 0 && (
        <PersonnelSection 
          title="Assigned Rescuers"
          personnel={selectedReport.rescueUnits}
          getDetails={getRescuerName}
          handleRemove={handleRemoveRescuer}
          color="green"
        />
      )}

      {selectedReport.volunteerUnits?.length > 0 && (
        <PersonnelSection
          title="Assigned Volunteers"
          personnel={selectedReport.volunteerUnits}
          getDetails={getVolunteerDetails}
          handleRemove={handleRemoveVolunteer}
          color="blue"
          showSkills
        />
      )}

      {/* Assignment Section */}
      <Section title="Assign Additional Units" className="mt-4">
        <div className="flex border-b mb-3">
          <TabButton active={activeTab === 'rescuers'} onClick={() => setActiveTab('rescuers')}>
            Rescuers ({rescuers.length})
          </TabButton>
          <TabButton active={activeTab === 'volunteers'} onClick={() => setActiveTab('volunteers')}>
            Volunteers ({volunteers.length})
          </TabButton>
        </div>

        <div className="max-h-40 overflow-y-auto pr-2">
          {activeTab === 'rescuers' && rescuers.map(rescuer => (
            <PersonnelItem
              key={rescuer.id}
              id={rescuer.id}
              name={`${rescuer.firstName} ${rescuer.lastName}`}
              isSelected={selectedRescuers.includes(rescuer.id)}
              isAssigned={selectedReport.rescueUnits?.includes(rescuer.id)}
              onSelect={handleRescuerSelection}
            />
          ))}

          {activeTab === 'volunteers' && volunteers.map(volunteer => {
            const user = users.find(u => u.id === volunteer.userId);
            return (
              <PersonnelItem
                key={volunteer.id}
                id={volunteer.id}
                name={user ? `${user.firstName} ${user.lastName}` : 'Unknown Volunteer'}
                status={volunteer.status}
                skills={volunteer.choices}
                isSelected={selectedVolunteers.includes(volunteer.id)}
                isAssigned={selectedReport.volunteerUnits?.includes(volunteer.id)}
                onSelect={handleVolunteerSelection}
              />
            );
          })}
        </div>
      </Section>
    </div>

    {/* Action Buttons */}
    <div className="p-3 bg-gray-50 border-t flex flex-col gap-2">
      <button
        className={`w-full py-2.5 text-white rounded font-medium transition-all ${
          assigning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } ${
          (selectedRescuers.length + selectedVolunteers.length) === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleAssignUnits}
        disabled={assigning || (selectedRescuers.length + selectedVolunteers.length) === 0}
      >
        {assigning ? (
          <span className="flex items-center justify-center">
            <Spinner /> Assigning...
          </span>
        ) : `Dispatch ${selectedRescuers.length + selectedVolunteers.length} Unit(s)`}
      </button>

      {selectedReport.status === 'responding' && (
        <button
          className="w-full py-2.5 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-all"
          onClick={() => handleMarkSafe(selectedReport.id)}
        >
          Mark Situation as Safe
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
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {resolvedReports.length === 0 ? (
                  <p className="text-[#60758a] text-center py-8">No resolved SOS reports found</p>
                ) : (
                  <div className="space-y-4">
                    {resolvedReports.map((report) => (
                      <div key={report.id} className="border border-[#dbe0e6] rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-bold text-lg mb-2 text-green-700">
                              ✓ Resolved SOS Report
                            </h3>
                            <div className="space-y-1 text-sm">
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
                              <p><span className="font-medium">Could Evacuate:</span> {getFormValue(report, 'canEvacuate')}</p>
                              <p><span className="font-medium">Notes:</span> {getFormValue(report, 'notes')}</p>
                            </div>
                          </div>
                          <div>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Reported:</span> {formatDate(report.createdAt)}</p>
                              <p><span className="font-medium">Resolved:</span> {formatDate(report.resolvedAt)}</p>
                              {report.distance && (
                                <p><span className="font-medium">Distance:</span> {report.distance.toFixed(2)} km</p>
                              )}
                            </div>
                            
                            {/* Show rescuers who responded */}
                            {report.rescueUnits && report.rescueUnits.length > 0 && (
                              <div className="mt-3">
                                <p className="font-medium text-green-700 mb-1">Rescuers Responded:</p>
                                <div className="space-y-1">
                                  {report.rescueUnits.map(rescuerId => (
                                    <div key={rescuerId} className="bg-green-100 p-2 rounded text-sm">
                                      {getRescuerName(rescuerId)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Show volunteers who responded */}
                            {report.volunteerUnits && report.volunteerUnits.length > 0 && (
                              <div className="mt-3">
                                <p className="font-medium text-blue-700 mb-1">Volunteers Responded:</p>
                                <div className="space-y-1">
                                  {report.volunteerUnits.map(volunteerId => {
                                    const volunteerDetails = getVolunteerDetails(volunteerId);
                                    return (
                                      <div key={volunteerId} className="bg-blue-100 p-2 rounded text-sm">
                                        <div className="font-medium">{volunteerDetails?.name || 'Unknown Volunteer'}</div>
                                        {volunteerDetails?.choices && volunteerDetails.choices.length > 0 && (
                                          <div className="mt-1">
                                            {volunteerDetails.choices.map((choice, index) => (
                                              <span key={index} className="inline-block bg-blue-200 text-blue-800 px-1 py-0.5 rounded text-xs mr-1">
                                                {choice}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action button to view on map */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => {
                              navigateToSOS(report);
                              setShowResolvedModal(false);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Location on Map
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowResolvedModal(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
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