import React from 'react';
import Layout from './Layout';

const Users = () => {
  const users = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '2 hours ago'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'User',
      status: 'Active',
      lastActive: '1 day ago'
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      role: 'Volunteer',
      status: 'Inactive',
      lastActive: '1 week ago'
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      role: 'User',
      status: 'Active',
      lastActive: '3 hours ago'
    },
    {
      name: 'David Brown',
      email: 'david.brown@example.com',
      role: 'Volunteer',
      status: 'Active',
      lastActive: '30 minutes ago'
    }
  ];

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
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal">
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
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Last Active
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6]">
                  {users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                        {user.lastActive}
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">
                        Edit
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users; 