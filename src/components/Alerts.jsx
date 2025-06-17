import React from 'react';
import Navbar from './Navbar';

const Alerts = () => {
  const alerts = [
    {
      title: 'Flood Warning',
      type: 'Warning',
      status: 'Active',
      createdAt: '2024-07-26 10:00 AM'
    },
    {
      title: 'Severe Weather Alert',
      type: 'Alert',
      status: 'Active',
      createdAt: '2024-07-25 03:00 PM'
    },
    {
      title: 'Evacuation Notice',
      type: 'Notice',
      status: 'Inactive',
      createdAt: '2024-07-24 09:00 AM'
    },
    {
      title: 'Emergency Assistance Request',
      type: 'Request',
      status: 'Active',
      createdAt: '2024-07-23 05:00 PM'
    },
    {
      title: 'Safety Check-In',
      type: 'Check-In',
      status: 'Inactive',
      createdAt: '2024-07-22 11:00 AM'
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
                  <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Alerts</p>
                  <p className="text-[#60758a] text-sm font-normal leading-normal">
                    View and manage emergency alerts, warnings, and notifications.
                  </p>
                </div>
                <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal">
                  <span className="truncate">New Alert</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="pb-3">
              <div className="flex border-b border-[#dbe0e6] px-6 gap-8">
                <a className="flex flex-col items-center justify-center border-b-[3px] border-b-[#dce8f3] text-[#111418] pb-[13px] pt-4" href="#">
                  <p className="text-[#111418] text-sm font-bold leading-normal tracking-[0.015em]">All</p>
                </a>
                <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#60758a] pb-[13px] pt-4" href="#">
                  <p className="text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">Active</p>
                </a>
                <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-[#60758a] pb-[13px] pt-4" href="#">
                  <p className="text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">Inactive</p>
                </a>
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
                      placeholder="Search alerts"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-full placeholder:text-[#60758a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Alerts Table */}
            <div className="px-6 pb-6">
              <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white border-b border-[#dbe0e6]">
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-[400px]">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-60">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-60">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-[400px]">
                          Created At
                        </th>
                        <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal w-60">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe0e6]">
                      {alerts.map((alert, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            {alert.title}
                          </td>
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal w-full">
                              <span className="truncate">{alert.type}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#f0f2f5] text-[#111418] text-sm font-medium leading-normal w-full">
                              <span className="truncate">{alert.status}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                            {alert.createdAt}
                          </td>
                          <td className="px-6 py-4 text-[#60758a] text-sm font-bold leading-normal tracking-[0.015em]">
                            View
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

export default Alerts; 