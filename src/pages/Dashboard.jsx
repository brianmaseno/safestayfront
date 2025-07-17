import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getBills, getBillsForApartment, getComplaints, getMyComplaints, getAllTenants, getAllUsers } from '../services/api';

const Dashboard = () => {
  const { user, isLandlord } = useAuth();
  const [stats, setStats] = useState({
    totalBills: 0,
    pendingBills: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    totalTenants: 0
  });
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);

  // Fetch real data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch bills based on role
        const billsResponse = isLandlord ? 
          await getBillsForApartment() : 
          await getBills();
        const bills = billsResponse.data;
        const totalBills = bills.length;
        const pendingBills = bills.filter(bill => bill.status === 'Pending').length;

        // Fetch complaints based on user role
        const complaintsResponse = isLandlord ? 
          await getComplaints() : 
          await getMyComplaints();
        const complaints = complaintsResponse.data;
        const totalComplaints = complaints.length;
        const pendingComplaints = complaints.filter(complaint => complaint.status === 'Pending').length;

        // Fetch tenants (only for landlords)
        let totalTenants = 0;
        if (isLandlord) {
          try {
            const tenantsResponse = await getAllTenants();
            
            if (tenantsResponse.data && Array.isArray(tenantsResponse.data)) {
              totalTenants = tenantsResponse.data.length;
              setTenants(tenantsResponse.data);
            } else {
              setTenants([]);
            }
          } catch (error) {
            console.error('❌ Error fetching tenants:', error);
            setTenants([]);
          }
        }

        setStats({
          totalBills,
          pendingBills,
          totalComplaints,
          pendingComplaints,
          totalTenants
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLandlord]);

  const StatCard = ({ title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 bg-${color}-500 rounded-md flex items-center justify-center`}>
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-medium text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      </div>
    </div>
  );

  const QuickAction = ({ title, description, action, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <button
        onClick={action}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-${color}-600 hover:bg-${color}-700`}
      >
        {title}
      </button>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">
                {isLandlord ? 'Manage your properties and tenants' : 'View your rental information'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">{user?.role}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title={isLandlord ? "Total Bills Issued" : "Total Bills"}
                value={stats.totalBills || 0}
                subtitle={stats.totalBills === 0 ? "No bills yet" : `${stats.pendingBills} pending`}
                color="blue"
              />
              <StatCard
                title="Complaints"
                value={stats.totalComplaints || 0}
                subtitle={stats.totalComplaints === 0 ? "No complaints yet" : `${stats.pendingComplaints} pending`}
                color="yellow"
              />
              {isLandlord && (
                <StatCard
                  title="Total Tenants"
                  value={stats.totalTenants || 0}
                  subtitle={stats.totalTenants === 0 ? "No tenants yet" : "Active tenants"}
                  color="green"
                />
              )}
              <StatCard
                title="This Month"
                value={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                subtitle="Current period"
                color="purple"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLandlord ? (
                  <>
                    <QuickAction
                      title="Create Bill"
                      description="Generate a new bill for a tenant"
                      action={() => window.location.href = '/bills'}
                      color="blue"
                    />
                    <QuickAction
                      title="View Tenants"
                      description="Manage tenant information"
                      action={() => window.location.href = '/tenants'}
                      color="green"
                    />
                    <QuickAction
                      title="Check Complaints"
                      description="Review pending complaints"
                      action={() => window.location.href = '/complaints'}
                      color="yellow"
                    />
                  </>
                ) : (
                  <>
                    <QuickAction
                      title="Pay Bills"
                      description="View and pay pending bills"
                      action={() => window.location.href = '/bills'}
                      color="blue"
                    />
                    <QuickAction
                      title="Submit Complaint"
                      description="Report an issue or maintenance request"
                      action={() => window.location.href = '/complaints'}
                      color="yellow"
                    />
                    <QuickAction
                      title="Contact Landlord"
                      description="Start a conversation"
                      action={() => window.location.href = '/chat'}
                      color="green"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {stats.totalBills === 0 && stats.totalComplaints === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-sm text-gray-400">
                      {isLandlord ? 'Create bills or manage complaints to see activity here' : 'Bills and complaints will appear here'}
                    </p>
                  </div>
                ) : (
                  <>
                    {stats.totalBills > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {isLandlord ? `${stats.totalBills} bills generated` : `${stats.totalBills} bills received`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {stats.pendingBills} pending bills
                          </p>
                        </div>
                      </div>
                    )}
                    {stats.totalComplaints > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            {isLandlord ? `${stats.totalComplaints} complaints received` : `${stats.totalComplaints} complaints submitted`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {stats.pendingComplaints} pending complaints
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Tenants Section (Only for Landlords) */}
            {isLandlord && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Tenants in "{user?.apartmentName}"
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Refresh tenant list"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {tenants.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="text-gray-400 text-4xl mb-2">🏢</div>
                      <p className="text-gray-500 font-medium">No tenants found in your apartment</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Tenants will appear here once they register for your apartment.
                      </p>
                      <div className="mt-4 space-x-2">
                        <button
                          onClick={() => window.location.href = '/tenants'}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Tenants Page
                        </button>
                        <button
                          onClick={() => window.location.reload()}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tenants.map((tenant, index) => (
                        <div key={tenant._id || index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {tenant.name?.charAt(0).toUpperCase() || 'T'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-gray-900">{tenant.name || 'Unknown'}</h3>
                              <p className="text-xs text-gray-600">{tenant.email || 'No email'}</p>
                              <p className="text-xs text-green-600 font-medium">✓ Active Tenant</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">🏠</span>
                              <span className="text-gray-700">{tenant.apartmentName || 'No apartment'}</span>
                            </div>
                            {tenant.primaryPhoneNumber && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">📱</span>
                                <span className="text-gray-700">{tenant.primaryPhoneNumber}</span>
                              </div>
                            )}
                            {tenant.nationalID && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">🆔</span>
                                <span className="text-gray-700">{tenant.nationalID}</span>
                              </div>
                            )}
                            {tenant.dateMovedIn && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">📅</span>
                                <span className="text-gray-700">
                                  Moved in: {new Date(tenant.dateMovedIn).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <button
                              onClick={() => {
                                // Store the tenant info for chat
                                sessionStorage.setItem('chatPartner', JSON.stringify({
                                  id: tenant._id,
                                  name: tenant.name,
                                  role: tenant.role,
                                  nationalID: tenant.nationalID
                                }));
                                window.location.href = '/chat';
                              }}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              💬 Chat
                            </button>
                            <button
                              onClick={() => window.location.href = `/bills?tenant=${tenant._id}`}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                              📄 Bills
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
