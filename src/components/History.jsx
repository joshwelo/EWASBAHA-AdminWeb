import React from 'react';
import Navbar from './Navbar';

const History = () => {
  const activities = [
    {
      timestamp: '2024-03-15 10:00 AM',
      type: 'User Login',
      user: 'User123',
      details: 'User logged into the app'
    },
    {
      timestamp: '2024-03-15 11:30 AM',
      type: 'Volunteer Signup',
      user: 'Volunteer456',
      details: 'Volunteer signed up for event \'Community Cleanup\''
    },
    {
      timestamp: '2024-03-15 01:45 PM',
      type: 'Event Creation',
      user: 'Admin789',
      details: 'Admin created event \'Park Restoration\''
    },
    {
      timestamp: '2024-03-15 03:20 PM',
      type: 'User Profile Update',
      user: 'User123',
      details: 'User updated their profile information'
    },
    {
      timestamp: '2024-03-15 05:10 PM',
      type: 'Volunteer Check-in',
      user: 'Volunteer456',
      details: 'Volunteer checked into event \'Community Cleanup\''
    },
    {
      timestamp: '2024-03-16 09:00 AM',
      type: 'User Registration',
      user: 'User789',
      details: 'New user registered in the app'
    },
    {
      timestamp: '2024-03-16 10:45 AM',
      type: 'Event Update',
      user: 'Admin789',
      details: 'Admin updated event \'Park Restoration\' details'
    },
    {
      timestamp: '2024-03-16 12:30 PM',
      type: 'Volunteer Feedback',
      user: 'Volunteer123',
      details: 'Volunteer submitted feedback for event \'Park Restoration\''
    },
    {
      timestamp: '2024-03-16 02:15 PM',
      type: 'User Logout',
      user: 'User123',
      details: 'User logged out of the app'
    },
    {
      timestamp: '2024-03-16 04:00 PM',
      type: 'System Event',
      user: 'System',
      details: 'System maintenance completed successfully'
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-white overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex h-full min-h-screen flex-col w-full max-w-none">
        <Navbar />
        
        <div className="flex-1 w-full max-w-none">
          <div className="w-full max-w-none h-full">
            {/* Page Header */}
            <div className="px-6 py-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="flex flex-col gap-3">
                  <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Activity History</p>
                  <p className="text-[#60758a] text-sm font-normal leading-normal">
                    View and filter the history of user actions, volunteer engagements, and system events within the app.
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
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
                      placeholder="Search activities"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-full placeholder:text-[#60758a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    />
                  </div>
                </label>
                <div className="flex gap-3 flex-wrap">
                  <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] pl-4 pr-2 hover:bg-[#e8eaed] transition-colors">
                    <p className="text-[#111418] text-sm font-medium leading-normal">All Activities</p>
                    <div className="text-[#111418]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                      </svg>
                    </div>
                  </button>
                  <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] pl-4 pr-2 hover:bg-[#e8eaed] transition-colors">
                    <p className="text-[#111418] text-sm font-medium leading-normal">User Actions</p>
                    <div className="text-[#111418]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                      </svg>
                    </div>
                  </button>
                  <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f5] pl-4 pr-2 hover:bg-[#e8eaed] transition-colors">
                    <p className="text-[#111418] text-sm font-medium leading-normal">Volunteer Engagements</p>
                    <div className="text-[#111418]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                        <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Table */}
            <div className="px-6 pb-6">
              <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b border-[#dbe0e6]">
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                          Timestamp
                        </th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                          Activity Type
                        </th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">User</th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe0e6]">
                      {activities.map((activity, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            {activity.timestamp}
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            {activity.type}
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            {activity.user}
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            {activity.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
