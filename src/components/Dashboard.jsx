import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [evacuationCenters, setEvacuationCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeVolunteers: 0,
    pendingApplications: 0,
    verifiedUsers: 0,
    totalEvacuationCenters: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
    systemUptime: 99.9
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Fetch evacuation centers
      const evacCentersSnapshot = await getDocs(collection(db, 'evacuationCenter'));
      const evacCentersData = evacCentersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvacuationCenters(evacCentersData);

      // Calculate metrics
      const totalUsers = usersData.length;
      const activeVolunteers = usersData.filter(user => 
        user.userType === 'volunteer' && user.isVerified
      ).length;
      const pendingApplications = usersData.filter(user => 
        user.applicationStatus === 'pending'
      ).length;
      const verifiedUsers = usersData.filter(user => user.isVerified).length;
      const totalEvacuationCenters = evacCentersData.length;
      const totalCapacity = evacCentersData.reduce((sum, center) => 
        sum + (center.capacityInd || 0), 0
      );
      const currentOccupancy = evacCentersData.reduce((sum, center) => 
        sum + (center.currentOccupancy || 0), 0
      );

      setMetrics({
        totalUsers,
        activeVolunteers,
        pendingApplications,
        verifiedUsers,
        totalEvacuationCenters,
        totalCapacity,
        currentOccupancy,
        systemUptime: 99.9
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getRecentUsers = () => {
    return users
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="w-full h-full">
      {/* Page Header */}
      <div className="px-6 py-6">
        <div className="flex flex-wrap justify-between gap-3">
          <div className="flex flex-col gap-3">
            <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">Dashboard</p>
            <p className="text-[#60758a] text-sm font-normal leading-normal">Overview of RescueApp operations</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
            <p className="text-[#111418] text-base font-medium leading-normal">Total Users</p>
            <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{metrics.totalUsers}</p>
            <p className="text-[#60758a] text-sm">Registered users</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
            <p className="text-[#111418] text-base font-medium leading-normal">Active Volunteers</p>
            <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{metrics.activeVolunteers}</p>
            <p className="text-[#60758a] text-sm">Verified volunteers</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
            <p className="text-[#111418] text-base font-medium leading-normal">Pending Applications</p>
            <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{metrics.pendingApplications}</p>
            <p className="text-[#60758a] text-sm">Awaiting approval</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg p-6 bg-[#f0f2f5] hover:bg-[#e8eaed] transition-colors">
            <p className="text-[#111418] text-base font-medium leading-normal">Evacuation Centers</p>
            <p className="text-[#111418] tracking-light text-2xl font-bold leading-tight">{metrics.totalEvacuationCenters}</p>
            <p className="text-[#60758a] text-sm">Available centers</p>
          </div>
        </div>
      </div>
      
      {/* Evacuation Centers Overview */}
      <div className="px-6 pb-6">
        <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">Evacuation Centers Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col gap-2 rounded-lg border border-[#dbe0e6] p-6 hover:shadow-lg transition-shadow">
            <p className="text-[#111418] text-base font-medium leading-normal">Total Capacity</p>
            <p className="text-[#111418] tracking-light text-[32px] font-bold leading-tight">{metrics.totalCapacity}</p>
            <p className="text-[#60758a] text-sm">Individual capacity across all centers</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Current Occupancy</span>
                <span>{metrics.currentOccupancy}/{metrics.totalCapacity}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(metrics.currentOccupancy / metrics.totalCapacity) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 rounded-lg border border-[#dbe0e6] p-6 hover:shadow-lg transition-shadow">
            <p className="text-[#111418] text-base font-medium leading-normal">Center Utilization</p>
            <div className="space-y-3 mt-4">
              {evacuationCenters.slice(0, 3).map((center, index) => (
                <div key={center.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{center.centerName}</p>
                    <p className="text-xs text-gray-500">{center.campManager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{center.currentOccupancy || 0}/{center.capacityInd}</p>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full" 
                        style={{ width: `${((center.currentOccupancy || 0) / center.capacityInd) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent User Activity */}
      <div className="px-6 pb-6">
        <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">Recent User Activity</h2>
        <div className="w-full">
          <div className="overflow-hidden rounded-lg border border-[#dbe0e6] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-[#dbe0e6]">
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      User Name
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[#111418] text-sm font-medium leading-normal">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbe0e6]">
                  {getRecentUsers().map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-[#111418] text-sm font-normal leading-normal">
                        {user.firstName} {user.lastName}
                        {user.isAdmin && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                        {user.userType}
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                        {user.barangay}, {user.municipality}
                      </td>
                      <td className="px-6 py-4 text-sm font-normal leading-normal">
                        <span className={getStatusBadge(user.applicationStatus)}>
                          {user.applicationStatus}
                        </span>
                        {user.isVerified && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Verified
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#60758a] text-sm font-normal leading-normal">
                        {formatDate(user.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Evacuation Centers List */}
      <div className="px-6 pb-6">
        <h2 className="text-[#111418] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-4">Evacuation Centers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evacuationCenters.map((center) => (
            <div key={center.id} className="rounded-lg border border-[#dbe0e6] p-6 hover:shadow-lg transition-shadow bg-white">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{center.centerName}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {center.numClassroom} rooms
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Manager:</span> {center.campManager}</p>
                <p><span className="font-medium">Contact:</span> {center.contactNum}</p>
                <p><span className="font-medium">Family Capacity:</span> {center.capacityFam} families</p>
                <p><span className="font-medium">Individual Capacity:</span> {center.capacityInd} people</p>
                <p><span className="font-medium">Current Occupancy:</span> {center.currentOccupancy || 0} people</p>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Occupancy Rate</span>
                  <span>{Math.round(((center.currentOccupancy || 0) / center.capacityInd) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${((center.currentOccupancy || 0) / center.capacityInd) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Dashboard;