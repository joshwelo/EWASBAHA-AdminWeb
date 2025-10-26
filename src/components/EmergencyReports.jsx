import React, { useState, useEffect, useCallback } from 'react';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { getCache, setCache, clearCache } from '../cache';
import { groupReportsByLocation, getReportsRequiringVerification, calculateLocationConsensus } from '../services/reportAggregation';
import { verifyReport, getVerificationStats, getReportsByStatus } from '../services/reportVerification';
import { generateTestEmergencyReports } from '../utils/testDataGenerator';
import { Tooltip } from 'react-tooltip';

const EmergencyReports = () => {
  const [reports, setReports] = useState([]);
  const [groupedReports, setGroupedReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    invalid: 0,
    resolved: 0
  });
  const [message, setMessage] = useState('');

  // Fetch all emergency reports
  const fetchReports = async (forceRefresh = false) => {
    setLoading(true);
    let reportsData = getCache('posts');
    
    if (!reportsData || forceRefresh) {
      try {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCache('posts', reportsData, 5 * 60 * 1000);
      } catch (error) {
        console.error('Error fetching emergency reports:', error);
        reportsData = [];
      }
    }
    
    setReports(reportsData);
    setLoading(false);
  };

  // Fetch verification statistics
  const fetchStats = async () => {
    try {
      const statsData = await getVerificationStats();
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching verification stats:', error);
    }
  };

  // Group reports by location
  const updateGroupedReports = useCallback(() => {
    const grouped = groupReportsByLocation(reports);
    setGroupedReports(grouped);
  }, [reports]);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  useEffect(() => {
    updateGroupedReports();
  }, [reports, updateGroupedReports]);

  // Filter reports based on status and type
  const getFilteredReports = () => {
    let filtered = reports;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(report => report.tags && report.tags.includes(filterType));
    }
    
    return filtered;
  };

  // Handle report verification
  const handleVerifyReport = async (reportId, isValid, adminNotes = '') => {
    try {
      const result = await verifyReport(reportId, 'admin_user_id', isValid, adminNotes);
      if (result.success) {
        setMessage(result.message);
        setTimeout(() => setMessage(''), 3000);
        fetchReports(true);
        fetchStats();
        setShowVerificationModal(false);
        setSelectedReport(null);
      } else {
        setMessage(result.message);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error verifying report');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'verified':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'invalid':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'resolved':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get severity badge styling
  const getSeverityBadge = (severityLevel) => {
    const severity = getSeverityText(severityLevel);
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-200 text-red-900`;
      case 'high':
        return `${baseClasses} bg-orange-200 text-orange-900`;
      case 'medium':
        return `${baseClasses} bg-yellow-200 text-yellow-900`;
      case 'low':
        return `${baseClasses} bg-green-200 text-green-900`;
      default:
        return `${baseClasses} bg-gray-200 text-gray-900`;
    }
  };


  const filteredReports = getFilteredReports();

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency reports...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="w-full h-full">
        {/* Page Header */}
        <div className="px-6 py-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Emergency Reports</p>
                <button
                  data-tooltip-id="emergency-tooltip"
                  data-tooltip-content="Monitor and verify emergency reports from users. Group reports by location, verify legitimacy, and manage report status. Use filters to organize data by status and type."
                  className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
                  type="button"
                  aria-label="How to use Emergency Reports page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#e0e7ff"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#3730a3" fontFamily="Arial" dy="-1">?</text></svg>
                </button>
              </div>
              <p className="text-[#60758a] text-sm font-normal leading-normal">Monitor, verify, and manage emergency reports from users across different locations.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchReports(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
              <p className="text-[#111418] text-base font-medium leading-normal">Total Reports</p>
              <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{stats.total}</p>
              <p className="text-[#60758a] text-sm">All emergency reports</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
              <p className="text-[#111418] text-base font-medium leading-normal">Pending</p>
              <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{stats.pending}</p>
              <p className="text-[#60758a] text-sm">Awaiting verification</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
              <p className="text-[#111418] text-base font-medium leading-normal">Verified</p>
              <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{stats.verified}</p>
              <p className="text-[#60758a] text-sm">Legitimate reports</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
              <p className="text-[#111418] text-base font-medium leading-normal">Invalid</p>
              <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{stats.invalid}</p>
              <p className="text-[#60758a] text-sm">False reports</p>
            </div>
            <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
              <p className="text-[#111418] text-base font-medium leading-normal">Resolved</p>
              <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{stats.resolved}</p>
              <p className="text-[#60758a] text-sm">Completed cases</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="invalid">Invalid</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Rising Floodwater">Rising Floodwater</option>
                <option value="Landslide">Landslide</option>
                <option value="Fallen Tree">Fallen Tree</option>
                <option value="Road Blocked">Road Blocked</option>
                <option value="Power Outage">Power Outage</option>
                <option value="Needs Rescue">Needs Rescue</option>
                <option value="Needs Food/Water">Needs Food/Water</option>
                <option value="Needs Medical">Needs Medical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Groups */}
        <div className="px-6 pb-6">
          <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">Reports by Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedReports).map(([locationKey, locationData]) => (
              <div key={locationKey} className="rounded-lg border border-[#dbe0e6] p-6 hover:shadow-lg transition-shadow bg-white">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{locationKey}</h3>
                  <div className="flex gap-2">
                    {locationData.requiresVerification && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Needs Verification
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {locationData.totalReports} reports
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Verified:</span>
                    <span className="font-medium text-green-600">{locationData.verifiedReports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="font-medium text-yellow-600">{locationData.pendingReports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invalid:</span>
                    <span className="font-medium text-red-600">{locationData.invalidReports}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consensus Score:</span>
                    <span className="font-medium">{(locationData.consensusScore * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Report Types</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(locationData.reportTypes).map(([type, count]) => (
                        <span key={type} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {type} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Severity Levels</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(locationData.severityLevels).map(([severity, count]) => (
                        <span key={severity} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                          {severity} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedLocation(locationData);
                      setShowLocationModal(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Location Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="px-6 pb-6">
          <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">All Reports ({filteredReports.length})</h2>
          <div className="w-full">
            <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white border-b border-[#dbe0e6]">
                      <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Tags</th>
                      <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Location</th>
                      <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Severity</th>
                      <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Status</th>
                      <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Created</th>
                      <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe0e6]">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1">
                              {report.tags && report.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                              {report.tags && report.tags.length > 2 && (
                                <span className="text-gray-500 text-xs">+{report.tags.length - 2}</span>
                              )}
                            </div>
                            {report.mediaUrl && (
                              <span className="text-blue-500 text-xs">📷</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                          {report.addressString || 'Location not specified'}
                        </td>
                        <td className="px-6 py-4 text-sm font-normal leading-normal">
                          <span className={getSeverityBadge(report.severityLevel)}>
                            {getSeverityText(report.severityLevel)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-normal leading-normal">
                          <span className={getStatusBadge(report.status)}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                          {formatDate(report.timestamp)}
                        </td>
                        <td className="px-6 py-4 text-sm font-normal leading-normal">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setShowVerificationModal(true);
                              }}
                              className="text-blue-600 hover:underline text-xs px-2 py-1 rounded hover:bg-blue-50"
                            >
                              View
                            </button>
                            {report.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleVerifyReport(report.id, true)}
                                  className="text-green-600 hover:underline text-xs px-2 py-1 rounded hover:bg-green-50"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleVerifyReport(report.id, false)}
                                  className="text-red-600 hover:underline text-xs px-2 py-1 rounded hover:bg-red-50"
                                >
                                  Invalid
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}

        {/* Report Verification Modal */}
        {showVerificationModal && selectedReport && (
          <ReportVerificationModal
            report={selectedReport}
            onClose={() => {
              setShowVerificationModal(false);
              setSelectedReport(null);
            }}
            onVerify={handleVerifyReport}
          />
        )}

        {/* Location Details Modal */}
        {showLocationModal && selectedLocation && (
          <LocationDetailsModal
            locationData={selectedLocation}
            onClose={() => {
              setShowLocationModal(false);
              setSelectedLocation(null);
            }}
          />
        )}
      </div>
      <Tooltip id="emergency-tooltip" place="right" />
    </Layout>
  );
};

// Helper function to map severity level number to text
const getSeverityText = (severityLevel) => {
  if (severityLevel >= 4) return 'critical';
  if (severityLevel >= 3) return 'high';
  if (severityLevel >= 2) return 'medium';
  return 'low';
};

// Format date for display
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  let date;
  if (timestamp.toDate) {
    // Firestore timestamp
    date = timestamp.toDate();
  } else {
    // Regular date string
    date = new Date(timestamp);
  }
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Report Verification Modal Component
const ReportVerificationModal = ({ report, onClose, onVerify }) => {
  const [adminNotes, setAdminNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden m-4 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-xl">Report Verification</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">×</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {report.tags && report.tags.map((tag, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <p className="text-sm text-gray-900">{getSeverityText(report.severityLevel)} (Level {report.severityLevel})</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <p className="text-sm text-gray-900">{report.addressString || 'Location not specified'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-sm text-gray-900">{report.caption || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <p className="text-sm text-gray-900">{report.userName || 'Unknown User'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">People Affected</label>
                <p className="text-sm text-gray-900">{report.peopleAffected ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {report.mediaUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Evidence</label>
                <div className="grid grid-cols-2 gap-2">
                  <img src={report.mediaUrl} alt="Evidence" className="w-full h-32 object-cover rounded" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add verification notes..."
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t flex gap-2">
          <button
            onClick={() => onVerify(report.id, true, adminNotes)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Mark as Verified
          </button>
          <button
            onClick={() => onVerify(report.id, false, adminNotes)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Mark as Invalid
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Location Details Modal Component
const LocationDetailsModal = ({ locationData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden m-4 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="bg-green-600 text-white p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-xl">Location Analysis</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">×</button>
          </div>
          <p className="text-sm mt-1">{locationData.locationKey}</p>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-lg mb-4">Report Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Reports:</span>
                  <span className="font-medium">{locationData.totalReports}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified:</span>
                  <span className="font-medium text-green-600">{locationData.verifiedReports}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-medium text-yellow-600">{locationData.pendingReports}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invalid:</span>
                  <span className="font-medium text-red-600">{locationData.invalidReports}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consensus Score:</span>
                  <span className="font-medium">{(locationData.consensusScore * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">Report Types</h4>
              <div className="space-y-2">
                {Object.entries(locationData.reportTypes || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span>{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-bold text-lg mb-4">Recent Reports</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locationData.reports?.slice(0, 10).map((report) => (
                <div key={report.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {report.tags && report.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{report.caption?.substring(0, 100)}...</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        report.status === 'verified' ? 'bg-green-100 text-green-800' :
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(report.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyReports;
