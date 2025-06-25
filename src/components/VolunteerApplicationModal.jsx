import React from 'react';

const VolunteerApplicationModal = ({ isOpen, onClose, application, loading, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 text-center mb-4">Volunteer Application</h3>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : !application ? (
            <div className="text-center text-gray-500 py-8">No volunteer application found for this user.</div>
          ) : (
            <div className="space-y-3">
              <div><strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${
                application.applicationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                application.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'}`}>{application.applicationStatus}</span></div>
              <div><strong>Eligibility Type:</strong> {application.eligibilityType || '-'}</div>
              <div><strong>Physically Fit:</strong> {application.isPhysicallyFit ? 'Yes' : 'No'}</div>
              <div><strong>Medical Condition:</strong> {application.hasMedicalCondition ? 'Yes' : 'No'}</div>
              <div><strong>Skills:</strong> {Array.isArray(application.skills) && application.skills.length > 0 ? application.skills.join(', ') : '-'}</div>
              <div><strong>Submission Time:</strong> {application.submissionTimestamp ? (new Date(application.submissionTimestamp.seconds * 1000)).toLocaleString() : '-'}</div>
              <div><strong>Certificate:</strong> {application.certificateUrl ? (
                <a href={application.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Certificate</a>
              ) : '-'}</div>
            </div>
          )}
          <div className="flex items-center justify-end mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerApplicationModal; 