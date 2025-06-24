import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const textColor = 'text-white';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} ${textColor} px-6 py-3 rounded-md shadow-lg z-50 flex items-center space-x-2`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 font-bold"
      >
        ×
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
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    // Auto-hide toast after 5 seconds
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
        createdAt: new Date().toISOString(),
      });

      // Show success toast
      showToast('User created successfully!', 'success');
      
      // Wait a moment for user to see the success message
      setTimeout(() => {
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

      {/* Modal */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-40">
        <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Add New User</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="First Name" 
                  onChange={handleChange} 
                  value={formData.firstName} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="Last Name" 
                  onChange={handleChange} 
                  value={formData.lastName} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="text" 
                  name="userName" 
                  placeholder="Username" 
                  onChange={handleChange} 
                  value={formData.userName} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="date" 
                  name="birthdate" 
                  placeholder="Birthdate" 
                  onChange={handleChange} 
                  value={formData.birthdate} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  placeholder="Phone Number" 
                  onChange={handleChange} 
                  value={formData.phoneNumber} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email" 
                  onChange={handleChange} 
                  value={formData.email} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Password (min. 6 characters)" 
                  onChange={handleChange} 
                  value={formData.password} 
                  className="form-input" 
                  required 
                  minLength="6"
                />
                <input 
                  type="text" 
                  name="municipality" 
                  placeholder="Municipality" 
                  onChange={handleChange} 
                  value={formData.municipality} 
                  className="form-input" 
                  required 
                />
                <input 
                  type="text" 
                  name="barangay" 
                  placeholder="Barangay" 
                  onChange={handleChange} 
                  value={formData.barangay} 
                  className="form-input" 
                  required 
                />
                <select 
                  name="userType" 
                  onChange={handleChange} 
                  value={formData.userType} 
                  className="form-select"
                >
                  <option value="user">User</option>
                  <option value="rescuer">Rescuer</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddUserModal;