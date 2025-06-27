import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-6 py-3 w-full max-w-none">
      <div className="flex items-center gap-4 text-[#111418]">
        <div className="size-4">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor"></path>
          </svg>
        </div>
        <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">E-Wasbaha Admin</h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <Link 
            to="/dashboard" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/dashboard') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/users" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/users') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            Users
          </Link>
          <Link 
            to="/history" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/history') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            History
          </Link>
          <Link 
            to="/alerts" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/alerts') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            Alerts
          </Link>
          <Link 
            to="/notification" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/notification') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            Notification
          </Link>
          <Link 
            to="/flood-affected-areas" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/flood-affected-areas') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            Flood Affected Areas
          </Link>
          <Link 
            to="/sos" 
            className={`text-sm font-medium leading-normal transition-colors ${
              isActive('/sos') ? 'text-blue-600' : 'text-[#111418] hover:text-blue-600'
            }`}
          >
            SOS
          </Link>
        </div>
        <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
          <div className="text-[#111418]" data-icon="Bell" data-size="20px" data-weight="regular">
            <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
            </svg>
          </div>
        </button>
        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC6k7Dbq0QI-zEo0zEGb2Mj2G0uksxDufOyZzM9rtMi4Wb_kMhCmMyS1b_4cxl_AcEdeR_-YETI3Dj_QqISRiC5cntOVRgNQTVtfNNsV97oQ0AFBwyu2-YxUY-CIPXEUVZ2yPw2Ig7z8ECJpxFmbplRclo1N67iPdH9fTGs6u_lN-5B05cxNtuA8znyFwLr6ygPLNxI1hfUbi7AGvFDUT70FEi2_3ViNKyluQStiS-STAjny1ltJhq0iJjbgO4I0ArPu3hXlXlEqSDn")' }}></div>
      </div>
    </header>
  );
};

export default Navbar; 