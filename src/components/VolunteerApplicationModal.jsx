import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const VolunteerApplicationModal = ({ isOpen, onClose, application, loading, error, refreshUsers }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  if (!isOpen) return null;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const userId = application.id;
      await updateDoc(doc(db, 'users', userId), { applicationStatus: 'approved' });
      await updateDoc(doc(db, 'volunteerApplications', userId), { applicationStatus: 'approved', notes: '' });
      setActionSuccess('Application approved successfully.');
      if (refreshUsers) refreshUsers();
    } catch (err) {
      setActionError('Failed to approve application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      setActionError('Please provide notes for rejection.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const userId = application.id;
      await updateDoc(doc(db, 'users', userId), { applicationStatus: 'rejected' });
      await updateDoc(doc(db, 'volunteerApplications', userId), { applicationStatus: 'rejected', notes: notes.trim() });
      setActionSuccess('Application rejected with notes.');
      if (refreshUsers) refreshUsers();
    } catch (err) {
      setActionError('Failed to reject application.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
      <div className="relative mx-auto border w-full max-w-2xl shadow-lg rounded-lg bg-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Volunteer Application</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading application...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">
              <div className="text-4xl mb-2">⚠️</div>
              <p>{error}</p>
            </div>
          ) : !application ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-2">📄</div>
              <p>No volunteer application found for this user.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide ${
                  application.applicationStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                  application.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {application.applicationStatus}
                </span>
              </div>

              {/* Rejection Notes - Display when status is rejected */}
              {application.applicationStatus === 'rejected' && application.notes && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    Rejection Notes
                  </h4>
                  <p className="text-red-800 text-sm leading-relaxed">{application.notes}</p>
                </div>
              )}

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Eligibility Type:</span>
                        <p className="text-gray-600">{application.eligibilityType || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Physically Fit:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          application.isPhysicallyFit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {application.isPhysicallyFit ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Has Medical Condition:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          application.hasMedicalCondition ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {application.hasMedicalCondition ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Skills & Expertise</h4>
                    {Array.isArray(application.skills) && application.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {application.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No skills specified</p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Submission Details</h4>
                    <p className="text-sm text-gray-600">
                      {application.submissionTimestamp ? 
                        new Date(application.submissionTimestamp.seconds * 1000).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Date not available'
                      }
                    </p>
                  </div>
                </div>

                {/* Certificate Section */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Certificate</h4>
                    {application.certificateUrl ? (
                      <div className="space-y-3">
                        <div className="relative">
                          {imageLoading && (
                            <div className="flex items-center justify-center h-48 bg-gray-200 rounded-lg">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                          {imageError ? (
                            <div className="flex flex-col items-center justify-center h-48 bg-gray-200 rounded-lg text-gray-500">
                              <div className="text-3xl mb-2">🖼️</div>
                              <p className="text-sm">Failed to load image</p>
                              <a 
                                href={application.certificateUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                              >
                                View Original
                              </a>
                            </div>
                          ) : (
                            <img
                              src={application.certificateUrl}
                              alt="Volunteer Certificate"
                              className={`w-full h-auto max-h-64 object-contain rounded-lg border shadow-sm ${imageLoading ? 'hidden' : ''}`}
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={application.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center text-sm font-medium transition-colors"
                          >
                            View Full Size
                          </a>
                          <a
                            href={application.certificateUrl}
                            download
                            className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-center text-sm font-medium transition-colors"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 bg-gray-200 rounded-lg text-gray-500">
                        <div className="text-2xl mb-2">📄</div>
                        <p className="text-sm">No certificate provided</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t">
          <div className="flex flex-col md:flex-row md:justify-end md:items-center gap-3">
            {actionError && (
              <div className="text-red-600 text-sm font-medium">{actionError}</div>
            )}
            {actionSuccess && (
              <div className="text-green-600 text-sm font-medium">{actionSuccess}</div>
            )}
            {application && application.applicationStatus === 'pending' && !actionSuccess && (
              <>
                {showNotes && (
                  <input
                    type="text"
                    className="border rounded px-3 py-2 text-sm w-64"
                    placeholder="Enter rejection notes..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={actionLoading}
                  />
                )}
                <button
                  onClick={() => setShowNotes(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium text-sm"
                  disabled={actionLoading || showNotes}
                  style={{ display: showNotes ? 'none' : 'inline-block' }}
                >
                  Reject
                </button>
                {showNotes && (
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-medium text-sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                )}
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-medium text-sm"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Approving...' : 'Approve'}
                </button>
              </>
            )}
            <button 
              onClick={onClose} 
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
              disabled={actionLoading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerApplicationModal;