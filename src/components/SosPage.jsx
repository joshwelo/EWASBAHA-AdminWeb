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
    googleMapsApiKey: "AIzaSyCzQbflN3B55lBQ8vTQKZF5qe9g0Mgrx7Q"
  });

  const [map, setMap] = useState(null);
  const [sosReports, setSosReports] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch SOS reports
  const fetchSosReports = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'sos_reports'));
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by urgencyScore descending
    reports.sort((a, b) => b.urgencyScore - a.urgencyScore);
    setSosReports(reports);
    setLoading(false);
  };

  // Fetch volunteers
  const fetchVolunteers = async () => {
    const q = query(collection(db, 'users'), where('userType', '==', 'volunteer'));
    const snapshot = await getDocs(q);
    setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchSosReports();
    fetchVolunteers();
  }, []);

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(defaultCenter);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

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
                  {sosReports.filter(r => r.status !== 'safe').map((report) => (
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
                <div className="p-4 bg-white rounded-lg border border-[#dbe0e6] shadow-sm">
                  <p className="text-[#111418] text-base font-medium leading-normal mb-2">SOS Priority List</p>
                  {loading ? <div>Loading...</div> : (
                    <ol className="list-decimal ml-4">
                      {sosReports.filter(r => r.status !== 'safe').map((report, idx) => (
                        <li key={report.id} className="mb-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0b80ee]">Urgency: {report.urgencyScore}</span>
                            <span className="text-[#111418]">{report.numberOfPeople} people, Danger Level: {report.dangerLevel}</span>
                            <span className="text-[#60758a] text-xs">Status: {report.status}</span>
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