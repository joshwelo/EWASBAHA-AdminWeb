import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Layout from './Layout';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

        {/* Search */}
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                <div className="text-[#60758a] flex border-none bg-[#f0f2f5] items-center justify-center pl-4 rounded-l-lg border-r-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                  </svg>
                </div>
                <input
                  placeholder="Search users"
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-full placeholder:text-[#60758a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                />
              </div>
            </label>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">Loading...</td>
                    </tr>
                  ) : (
                    users.map((user) => (
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
    </Layout>
  );
};

export default Users;