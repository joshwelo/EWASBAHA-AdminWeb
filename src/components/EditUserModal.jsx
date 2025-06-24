import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EditUserModal = ({ user, closeModal, refreshUsers }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    birthdate: '',
    phoneNumber: '',
    municipality: '',
    barangay: '',
    userType: 'user',
    isVerified: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        userName: user.userName || '',
        birthdate: user.birthdate || '',
        phoneNumber: user.phoneNumber || '',
        municipality: user.municipality || '',
        barangay: user.barangay || '',
        userType: user.userType || 'user',
        isVerified: user.isVerified || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        ...formData
      });

      refreshUsers();
      closeModal();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">Edit User</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} value={formData.firstName} className="form-input" required />
              <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} value={formData.lastName} className="form-input" required />
              <input type="text" name="userName" placeholder="Username" onChange={handleChange} value={formData.userName} className="form-input" required />
              <input type="date" name="birthdate" placeholder="Birthdate" onChange={handleChange} value={formData.birthdate} className="form-input" required />
              <input type="tel" name="phoneNumber" placeholder="Phone Number" onChange={handleChange} value={formData.phoneNumber} className="form-input" required />
              <input type="text" name="municipality" placeholder="Municipality" onChange={handleChange} value={formData.municipality} className="form-input" required />
              <input type="text" name="barangay" placeholder="Barangay" onChange={handleChange} value={formData.barangay} className="form-input" required />
              <select name="userType" onChange={handleChange} value={formData.userType} className="form-select">
                <option value="user">User</option>
                <option value="rescuer">Rescuer</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <div className="flex items-center">
                <input type="checkbox" name="isVerified" onChange={handleChange} checked={formData.isVerified} className="form-checkbox" />
                <label htmlFor="isVerified" className="ml-2">Verified</label>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center justify-end space-x-4">
              <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300">
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
