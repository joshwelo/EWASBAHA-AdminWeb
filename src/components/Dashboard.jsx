import React from 'react';
import Navbar from './Navbar';

const Dashboard = () => {
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
                  <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Dashboard</p>
                  <p className="text-[#60758a] text-sm font-normal leading-normal">Overview of RescueApp operations</p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
                  <p className="text-[#111418] text-base font-medium leading-normal">Active Users</p>
                  <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">1,234</p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
                  <p className="text-[#111418] text-base font-medium leading-normal">Recent SOS Alerts</p>
                  <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">5</p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
                  <p className="text-[#111418] text-base font-medium leading-normal">System Uptime</p>
                  <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">99.9%</p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
                  <p className="text-[#111418] text-base font-medium leading-normal">Volunteer Check-ins</p>
                  <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">321</p>
                </div>
              </div>
            </div>
            
            {/* System Performance Section */}
            <div className="px-6 pb-6">
              <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">System Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="flex flex-col gap-2 rounded-lg border border-[#dbe0e6] p-6 hover:shadow-lg transition-shadow">
                  <p className="text-[#111418] text-base font-medium leading-normal">User Activity Over Time</p>
                  <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight truncate">+15%</p>
                  <div className="flex gap-1">
                    <p className="text-[#60758a] text-base font-normal leading-normal">Last 7 Days</p>
                    <p className="text-[#078838] text-base font-medium leading-normal">+15%</p>
                  </div>
                  <div className="flex min-h-[180px] flex-1 flex-col gap-8 py-4">
                    <svg width="100%" height="148" viewBox="-3 0 478 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                      <path
                        d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z"
                        fill="url(#paint0_linear_1131_5935)"
                      ></path>
                      <path
                        d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25"
                        stroke="#60758a"
                        strokeWidth="3"
                        strokeLinecap="round"
                      ></path>
                      <defs>
                        <linearGradient id="paint0_linear_1131_5935" x1="236" y1="1" x2="236" y2="149" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#f0f2f5"></stop>
                          <stop offset="1" stopColor="#f0f2f5" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="flex justify-around">
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Mon</p>
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Tue</p>
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Wed</p>
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Thu</p>
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Fri</p>
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Sat</p>
                      <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">Sun</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 rounded-lg border border-[#dbe0e6] p-6 hover:shadow-lg transition-shadow">
                  <p className="text-[#111418] text-base font-medium leading-normal">Alert Response Times</p>
                  <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight truncate">-5%</p>
                  <div className="flex gap-1">
                    <p className="text-[#60758a] text-base font-normal leading-normal">Last 24 Hours</p>
                    <p className="text-[#e73908] text-base font-medium leading-normal">-5%</p>
                  </div>
                  <div className="grid min-h-[180px] grid-flow-col gap-6 grid-rows-[1fr_auto] items-end justify-items-center px-3">
                    <div className="border-[#60758a] bg-[#f0f2f5] border-t-2 w-full" style={{ height: '10%' }}></div>
                    <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">0-1h</p>
                    <div className="border-[#60758a] bg-[#f0f2f5] border-t-2 w-full" style={{ height: '10%' }}></div>
                    <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">1-2h</p>
                    <div className="border-[#60758a] bg-[#f0f2f5] border-t-2 w-full" style={{ height: '10%' }}></div>
                    <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">2-3h</p>
                    <div className="border-[#60758a] bg-[#f0f2f5] border-t-2 w-full" style={{ height: '20%' }}></div>
                    <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">3-4h</p>
                    <div className="border-[#60758a] bg-[#f0f2f5] border-t-2 w-full" style={{ height: '80%' }}></div>
                    <p className="text-[#60758a] text-[13px] font-bold leading-normal tracking-[0.015em]">4+h</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Volunteer Activity Section */}
            <div className="px-6 pb-6">
              <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">Volunteer Activity</h2>
              <div className="w-full">
                <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white border-b border-[#dbe0e6]">
                          <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                            Volunteer Name
                          </th>
                          <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                            Location
                          </th>
                          <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">Status</th>
                          <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                            Last Check-in
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dbe0e6]">
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            Ethan Harper
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            New York, NY
                          </td>
                          <td className="px-6 py-4 text-sm font-normal leading-normal">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            2 hours ago
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            Olivia Bennett
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            Los Angeles, CA
                          </td>
                          <td className="px-6 py-4 text-sm font-normal leading-normal">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            3 days ago
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            Noah Carter
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            Chicago, IL
                          </td>
                          <td className="px-6 py-4 text-sm font-normal leading-normal">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            1 hour ago
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            Ava Reynolds
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            Houston, TX
                          </td>
                          <td className="px-6 py-4 text-sm font-normal leading-normal">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            4 hours ago
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            Liam Foster
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            Miami, FL
                          </td>
                          <td className="px-6 py-4 text-sm font-normal leading-normal">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            2 days ago
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;