import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { path: '/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { path: '/history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/alerts', label: 'Alerts', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' },
    { path: '/flood-affected-areas', label: 'Flood Affected Areas', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#f0f2f5] w-64 min-w-64">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f0f2f5]">
        <div className="size-6">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor"></path>
          </svg>
        </div>
        <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">E-Wasbaha Admin</h2>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium leading-normal transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-[#111418] hover:bg-[#f0f2f5] hover:text-blue-600'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#f0f2f5]">
        {/* Notification Button */}
        <button className="flex items-center justify-center w-full h-10 gap-2 text-sm font-bold leading-normal tracking-[0.015em] bg-[#f0f2f5] text-[#111418] rounded-lg hover:bg-[#e8eaed] transition-colors">
          <div className="text-[#111418]" data-icon="Bell" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
            </svg>
          </div>
          Notifications
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 mt-4 p-3 rounded-lg hover:bg-[#f0f2f5] transition-colors cursor-pointer">
          <div 
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 hover:ring-2 hover:ring-blue-300 transition-all" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC6k7Dbq0QI-zEo0zEGb2Mj2G0uksxDufOyZzM9rtMi4Wb_kMhCmMyS1b_4cxl_AcEdeR_-YETI3Dj_QqISRiC5cntOVRgNQTVtfNNsV97oQ0AFBwyu2-YxUY-CIPXEUVZ2yPw2Ig7z8ECJpxFmbplRclo1N67iPdH9fTGs6u_lN-5B05cxNtuA8znyFwLr6ygPLNxI1hfUbi7AGvFDUT70FEi2_3ViNKyluQStiS-STAjny1ltJhq0iJjbgO4I0ArPu3hXlXlEqSDn")' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[#111418] text-sm font-medium leading-normal truncate">Admin User</p>
            <p className="text-[#60758a] text-xs font-normal leading-normal truncate">admin@ewasbaha.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 