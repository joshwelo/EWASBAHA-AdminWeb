import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { clearCache } from '../cache';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-500';
  const iconColor = type === 'error' ? 'text-red-100' : 'text-emerald-100';

  return (
    <div className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center space-x-3 transform transition-all duration-300 ease-in-out`}>
      <div className={`flex-shrink-0 ${iconColor}`}>
        {type === 'error' ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white transition-colors duration-200"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

const AddUserModal = ({ closeModal, refreshUsers }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    birthdate: '',
    phoneNumber: '',
    email: '',
    password: '',
    municipality: '',
    barangay: '',
    userType: 'user',
    applicationStatus: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const hideToast = () => {
    setToast(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use a different email.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return error.message || 'An error occurred while creating the user. Please try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        throw new Error('First name and last name are required.');
      }
      
      if (!formData.userName.trim()) {
        throw new Error('Username is required.');
      }
      
      if (!formData.email.trim()) {
        throw new Error('Email is required.');
      }
      
      if (!formData.password.trim()) {
        throw new Error('Password is required.');
      }
      
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Add user to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        userName: formData.userName.trim(),
        birthdate: formData.birthdate,
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        municipality: formData.municipality.trim(),
        barangay: formData.barangay.trim(),
        isVerified: false,
        userType: formData.userType,
        applicationStatus: formData.applicationStatus,
        createdAt: new Date().toISOString(),
      });

      showToast('User created successfully!', 'success');
      
      setTimeout(() => {
        clearCache('users_list');
        refreshUsers();
        closeModal();
      }, 1500);

    } catch (err) {
      console.error('Error creating user:', err);
      const errorMessage = getErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500";
  const selectClasses = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900";

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-40 p-2">
        <div className="relative mx-auto border w-full max-w-2xl shadow-2xl rounded-xl bg-white transform transition-all duration-300 ease-out max-h-[90vh] flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mt-4 p-3 border-b border-gray-100 flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              <p className="text-xs text-gray-500 mt-0.5">Create a new user account with required information</p>
            </div>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1.5 hover:bg-gray-100 rounded-md"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="p-3 overflow-y-auto flex-1">
            <div className="space-y-3">
              
              {/* Personal Information Section */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <input 
                      type="text" 
                      name="firstName" 
                      placeholder="Enter first name" 
                      onChange={handleChange} 
                      value={formData.firstName} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      name="lastName" 
                      placeholder="Enter last name" 
                      onChange={handleChange} 
                      value={formData.lastName} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      name="userName" 
                      placeholder="Choose a username" 
                      onChange={handleChange} 
                      value={formData.userName} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      name="birthdate" 
                      onChange={handleChange} 
                      value={formData.birthdate} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phoneNumber" 
                      placeholder="Enter phone number" 
                      onChange={handleChange} 
                      value={formData.phoneNumber} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      placeholder="Enter email address" 
                      onChange={handleChange} 
                      value={formData.email} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      placeholder="Create a secure password (min. 6 characters)" 
                      onChange={handleChange} 
                      value={formData.password} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                      minLength="6"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information Section */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Municipality</label>
                    <input 
                      type="text" 
                      name="municipality" 
                      placeholder="Enter municipality" 
                      onChange={handleChange} 
                      value={formData.municipality} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Barangay</label>
                    <input 
                      type="text" 
                      name="barangay" 
                      placeholder="Enter barangay" 
                      onChange={handleChange} 
                      value={formData.barangay} 
                      className={inputClasses + ' text-sm py-2 px-3'}
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Account Settings Section */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Account Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">User Type</label>
                    <select 
                      name="userType" 
                      onChange={handleChange} 
                      value={formData.userType} 
                      className={selectClasses + ' text-sm py-2 px-3'}
                    >
                      <option value="user">User</option>
                      <option value="rescuer">Rescuer</option>
                      <option value="volunteer">Volunteer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Application Status</label>
                    <select
                      name="applicationStatus"
                      onChange={handleChange}
                      value={formData.applicationStatus}
                      className={selectClasses + ' text-sm py-2 px-3'}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={closeModal} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={loading} 
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:from-blue-300 disabled:to-blue-400 disabled:cursor-not-allowed flex items-center space-x-1 shadow-lg hover:shadow-xl text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating User...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUserModal;