import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from './Layout';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import VolunteerApplicationModal from './VolunteerApplicationModal';
import { getCache, setCache } from '../cache';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isApplicationModalOpen, setApplicationModalOpen] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('');

  const fetchUsers = async (forceRefresh = false) => {
    setLoading(true);
    try {
      let usersList = getCache('users_list');
      if (!usersList || forceRefresh) {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCache('users_list', usersList, 5 * 60 * 1000); // 5 min TTL
      }
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return fullName.includes(lowerSearchTerm) || email.includes(lowerSearchTerm);
      });
    }

    // Apply user type filter
    if (userTypeFilter) {
      filtered = filtered.filter(user => user.userType === userTypeFilter);
    }

    // Apply verification filter
    if (verificationFilter) {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(user => user.isVerified === true);
      } else if (verificationFilter === 'not verified') {
        filtered = filtered.filter(user => user.isVerified === false);
      }
    }

    // Apply application status filter
    if (applicationStatusFilter) {
      if (applicationStatusFilter === 'none') {
        filtered = filtered.filter(user => !user.applicationStatus || user.applicationStatus === 'none');
      } else {
        filtered = filtered.filter(user => user.applicationStatus === applicationStatusFilter);
      }
    }

    return filtered;
  }, [users, searchTerm, userTypeFilter, verificationFilter, applicationStatusFilter]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setUserTypeFilter('');
    setVerificationFilter('');
    setApplicationStatusFilter('');
  };

  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (selectedUser) {
      try {
        await deleteDoc(doc(db, 'users', selectedUser.id));
        fetchUsers();
        setDeleteModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.error("Error deleting user: ", error);
      }
    }
  };

  const handleViewApplication = async (userId) => {
    setApplicationLoading(true);
    setApplicationError('');
    setSelectedApplication(null);
    setApplicationModalOpen(true);
    try {
      const appDoc = await getDoc(doc(db, 'volunteerApplications', userId));
      if (appDoc.exists()) {
        setSelectedApplication({ ...appDoc.data(), id: userId });
      } else {
        setSelectedApplication(null);
      }
    } catch (error) {
      setApplicationError('Failed to fetch application.');
    } finally {
      setApplicationLoading(false);
    }
  };

  return (
    <Layout>
      <div className="w-full h-full">
        {/* Page Header */}
        <div className="px-6 py-6">
          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex flex-col gap-3">
              <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Users</p>
              <p className="text-[#60758a] text-sm font-normal leading-normal">
                Manage user accounts, roles, and permissions.
              </p>
            </div>
            <button
              onClick={handleAddUser}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal"
            >
              <span className="truncate">Add User</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-[#60758a] flex border-none bg-[#f0f2f5] items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-full placeholder:text-[#60758a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-[#60758a] flex border-none bg-[#f0f2f5] items-center justify-center pr-4 rounded-r-lg border-l-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </label>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-4">
              {/* User Type Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-[#111418] mb-1">User Type</label>
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#dbe0e6] bg-white text-[#111418] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="rescuer">Rescuer</option>
                  <option value="user">User</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-[#111418] mb-1">Verification</label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#dbe0e6] bg-white text-[#111418] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="not verified">Not Verified</option>
                </select>
              </div>

              {/* Application Status Filter */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-[#111418] mb-1">Application Status</label>
                <select
                  value={applicationStatusFilter}
                  onChange={(e) => setApplicationStatusFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#dbe0e6] bg-white text-[#111418] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="none">None</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || userTypeFilter || verificationFilter || applicationStatusFilter) && (
                <div className="flex flex-col justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="h-10 px-4 rounded-lg border border-[#dbe0e6] bg-white text-[#60758a] text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Results Summary */}
            {(searchTerm || userTypeFilter || verificationFilter || applicationStatusFilter) && (
              <p className="text-sm text-[#60758a]">
                Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-[#dbe0e6]">
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      User Type
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Verification
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Application Status
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6]">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">Loading...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-[#60758a]">
                        {searchTerm || userTypeFilter || verificationFilter || applicationStatusFilter 
                          ? 'No users found matching your filters.' 
                          : 'No users found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.userType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.applicationStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : user.applicationStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : user.applicationStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.applicationStatus
                              ? user.applicationStatus.charAt(0).toUpperCase() + user.applicationStatus.slice(1)
                              : 'None'}
                          </span>

                          <button
                            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600"
                            onClick={() => handleViewApplication(user.id)}
                          >
                            View Application
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium leading-normal space-x-2">
                          <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                          <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {isAddModalOpen && <AddUserModal closeModal={() => setAddModalOpen(false)} refreshUsers={fetchUsers} />}
      {isEditModalOpen && <EditUserModal user={selectedUser} closeModal={() => setEditModalOpen(false)} refreshUsers={fetchUsers} />}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isApplicationModalOpen && (
        <VolunteerApplicationModal
          isOpen={isApplicationModalOpen}
          onClose={() => setApplicationModalOpen(false)}
          application={selectedApplication}
          loading={applicationLoading}
          error={applicationError}
          refreshUsers={fetchUsers}
        />
      )}
    </Layout>
  );
};

export default Users;