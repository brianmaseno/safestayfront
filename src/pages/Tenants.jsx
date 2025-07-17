import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getAllTenants, getBills, getComplaints } from '../services/api';

const Tenants = () => {
  const { user, isLandlord } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [tenantStats, setTenantStats] = useState({});

  // Fetch real tenant data from API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        
        // Only landlords can view tenants
        if (!isLandlord) {
          setLoading(false);
          return;
        }

        console.log('👥 Fetching tenants...');
        const tenantsResponse = await getAllTenants();
        console.log('👥 Tenants response:', tenantsResponse.data);
        const tenantsData = tenantsResponse.data;
        setTenants(tenantsData);

        // Try to fetch bills and complaints for statistics, but don't fail if they don't exist
        try {
          const [billsResponse, complaintsResponse] = await Promise.all([
            getBills().catch(() => ({ data: [] })),
            getComplaints().catch(() => ({ data: [] }))
          ]);

          const bills = billsResponse.data || [];
          const complaints = complaintsResponse.data || [];

          // Calculate stats for each tenant
          const statsMap = {};
          tenantsData.forEach(tenant => {
            const tenantBills = bills.filter(bill => 
              bill.tenant && bill.tenant._id === tenant._id
            );
            const tenantComplaints = complaints.filter(complaint => 
              complaint.tenant && complaint.tenant._id === tenant._id
            );
            
            statsMap[tenant._id] = {
              totalBills: tenantBills.length,
              pendingBills: tenantBills.filter(bill => bill.status === 'Pending').length,
              totalComplaints: tenantComplaints.length,
              activeComplaints: tenantComplaints.filter(complaint => complaint.status === 'Pending').length,
              lastPayment: tenantBills.find(bill => bill.status === 'Paid')?.paymentDate || null,
              paymentStatus: tenantBills.some(bill => bill.status === 'Pending') ? 'pending' : 'current'
            };
          });

          setTenantStats(statsMap);
        } catch (statsError) {
          console.warn('⚠️ Could not fetch tenant statistics:', statsError);
          // Set empty stats for all tenants
          const emptyStats = {};
          tenantsData.forEach(tenant => {
            emptyStats[tenant._id] = {
              totalBills: 0,
              pendingBills: 0,
              totalComplaints: 0,
              activeComplaints: 0,
              lastPayment: null,
              paymentStatus: 'current'
            };
          });
          setTenantStats(emptyStats);
        }

      } catch (error) {
        console.error('❌ Error fetching tenants:', error);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [isLandlord]);

  const handleViewDetails = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailsModal(true);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTenureDuration = (moveInDate) => {
    if (!moveInDate) return 'N/A';
    const moveIn = new Date(moveInDate);
    const now = new Date();
    const diffTime = Math.abs(now - moveIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : `${diffDays} days`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isLandlord) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Only landlords can view tenant information.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tenants Management</h1>
            <p className="text-gray-600">Manage your tenants and view their information</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </div>

        {/* Tenants Grid */}
        {tenants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No Tenants Found</h2>
            <p className="text-gray-600">You don't have any tenants registered yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => {
              const stats = tenantStats[tenant._id] || {};
              return (
                <div key={tenant._id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{tenant.name}</h3>
                        <p className="text-sm text-gray-500">{tenant.buildingName || 'N/A'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(stats.paymentStatus || 'current')}`}>
                      {(stats.paymentStatus || 'current').charAt(0).toUpperCase() + (stats.paymentStatus || 'current').slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span className="font-medium">{tenant.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tenure:</span>
                      <span className="font-medium">{calculateTenureDuration(tenant.dateMovedIn)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pending Bills:</span>
                      <span className="font-medium">{stats.pendingBills || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Active Complaints:</span>
                      <span className="font-medium">{stats.activeComplaints || 0}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(tenant)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => window.location.href = '/chat'}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tenant Details Modal */}
        {showDetailsModal && selectedTenant && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tenant Details - {selectedTenant.name}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Personal Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{selectedTenant.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedTenant.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Primary Phone</label>
                        <p className="text-gray-900">{selectedTenant.primaryPhoneNumber}</p>
                      </div>
                      {selectedTenant.secondaryPhoneNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Secondary Phone</label>
                          <p className="text-gray-900">{selectedTenant.secondaryPhoneNumber}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">National ID</label>
                        <p className="text-gray-900">{selectedTenant.nationalID}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rental Information */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900">Rental Information</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Building Name</label>
                        <p className="text-gray-900">{selectedTenant.buildingName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Move-in Date</label>
                        <p className="text-gray-900">
                          {selectedTenant.dateMovedIn 
                            ? new Date(selectedTenant.dateMovedIn).toLocaleDateString() 
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(tenantStats[selectedTenant._id]?.paymentStatus || 'current')}`}>
                          {(tenantStats[selectedTenant._id]?.paymentStatus || 'current').charAt(0).toUpperCase() + (tenantStats[selectedTenant._id]?.paymentStatus || 'current').slice(1)}
                        </span>
                      </div>
                      {tenantStats[selectedTenant._id]?.lastPayment && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Last Payment</label>
                          <p className="text-gray-900">{new Date(tenantStats[selectedTenant._id].lastPayment).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{tenantStats[selectedTenant._id]?.totalBills || 0}</p>
                    <p className="text-sm text-blue-600">Total Bills</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{tenantStats[selectedTenant._id]?.pendingBills || 0}</p>
                    <p className="text-sm text-yellow-600">Pending Bills</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{tenantStats[selectedTenant._id]?.totalComplaints || 0}</p>
                    <p className="text-sm text-green-600">Total Complaints</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{tenantStats[selectedTenant._id]?.activeComplaints || 0}</p>
                    <p className="text-sm text-red-600">Active Complaints</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex space-x-3">
                  <button 
                    onClick={() => window.location.href = '/chat'}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Send Message
                  </button>
                  <button 
                    onClick={() => window.location.href = '/bills'}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Create Bill
                  </button>
                  <button 
                    onClick={() => window.location.href = '/complaints'}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tenants;
