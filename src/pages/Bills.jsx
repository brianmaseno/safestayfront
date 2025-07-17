import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { 
  getBillsForApartment,
  getMyBills,
  generateMonthlyBills,
  makeCashPayment,
  downloadBillPDF,
  downloadReceiptPDF,
  getPaidBills,
  getUnpaidBills,
  updateBill
} from '../services/api';

const Bills = () => {
  const { user, isLandlord } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMonthlyBillModal, setShowMonthlyBillModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [monthlyBillData, setMonthlyBillData] = useState({
    month: '',
    year: new Date().getFullYear(),
    dueDate: ''
  });
  const [editBillData, setEditBillData] = useState({
    amount: '',
    description: '',
    dueDate: ''
  });
  const [billFilter, setBillFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  // Fetch real data from API
  useEffect(() => {
    const fetchBillsData = async () => {
      try {
        setLoading(true);
        
        // Fetch bills based on role and filter
        let billsResponse;
        if (isLandlord) {
          if (billFilter === 'paid') {
            billsResponse = await getPaidBills();
          } else if (billFilter === 'unpaid') {
            billsResponse = await getUnpaidBills();
          } else {
            billsResponse = await getBillsForApartment();
          }
        } else {
          billsResponse = await getMyBills();
        }
        setBills(billsResponse.data);
        
      } catch (error) {
        console.error('Error fetching bills data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillsData();
  }, [isLandlord, billFilter]);

  const handleCreateMonthlyBill = async (e) => {
    e.preventDefault();
    try {
      const response = await generateMonthlyBills(monthlyBillData);
      alert('Monthly bills created successfully for all tenants!');
      setShowMonthlyBillModal(false);
      setMonthlyBillData({
        month: '',
        year: new Date().getFullYear(),
        dueDate: ''
      });
      // Refresh bills
      const billsResponse = await getBillsForApartment();
      setBills(billsResponse.data);
    } catch (error) {
      console.error('Error creating monthly bill:', error);
      alert('Failed to create monthly bills. Please try again.');
    }
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setEditBillData({
      amount: bill.amount,
      description: bill.description,
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : ''
    });
    setShowEditBillModal(true);
  };

  const handleUpdateBill = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        amount: parseFloat(editBillData.amount),
        description: editBillData.description,
        dueDate: editBillData.dueDate
      };
      
      await updateBill(editingBill._id, updatedData);
      
      // Refresh bills
      const billsResponse = isLandlord ? await getBillsForApartment() : await getMyBills();
      setBills(billsResponse.data);
      
      setShowEditBillModal(false);
      setEditingBill(null);
      setEditBillData({ amount: '', description: '', dueDate: '' });
      
      alert('Bill updated successfully!');
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Failed to update bill. Please try again.');
    }
  };

  const handlePayBill = async (billId) => {
    try {
      const paymentData = {
        billId: billId,
        amount: bills.find(b => b._id === billId)?.remainingAmount || 0
      };
      await makeCashPayment(paymentData);
      alert('Payment successful!');
      // Refresh bills
      const billsResponse = await getMyBills();
      setBills(billsResponse.data);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleDownloadBill = async (billId) => {
    try {
      const response = await downloadBillPDF(billId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill_${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading bill:', error);
      alert('Failed to download bill. Please try again.');
    }
  };

  const handleDownloadReceipt = async (billId) => {
    try {
      const response = await downloadReceiptPDF(billId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${billId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLandlord ? 'Bills Management' : 'My Bills'}
            </h1>
            <p className="text-gray-600">
              {isLandlord ? 'Manage bills for your tenants' : 'View and pay your bills'}
            </p>
          </div>
          <div className="flex space-x-2">
            {isLandlord && (
              <button
                onClick={() => setShowMonthlyBillModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Monthly Bills
              </button>
            )}
          </div>
        </div>

        {/* Filter Buttons for Landlords */}
        {isLandlord && (
          <div className="flex space-x-2">
            <button
              onClick={() => setBillFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billFilter === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Bills
            </button>
            <button
              onClick={() => setBillFilter('paid')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billFilter === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Paid Bills
            </button>
            <button
              onClick={() => setBillFilter('unpaid')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                billFilter === 'unpaid'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Unpaid Bills
            </button>
          </div>
        )}

        {/* Bills List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {isLandlord ? 'All Bills' : 'Your Bills'}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {bills.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No bills found</p>
                <p className="text-sm text-gray-400">
                  {isLandlord ? 'Create bills for your tenants' : 'Bills will appear here when created'}
                </p>
              </div>
            ) : (
              bills.map((bill) => (
                <div key={bill._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {bill.description}
                        </h3>
                        {isLandlord && bill.tenant && (
                          <p className="text-sm text-gray-500">Tenant: {bill.tenant.name}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          KSH {bill.amount?.toLocaleString()}
                        </p>
                        {bill.remainingAmount && bill.remainingAmount < bill.amount && (
                          <p className="text-sm text-orange-600">
                            Remaining: KSH {bill.remainingAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            bill.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : bill.status === 'Partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {bill.status || 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isLandlord && (
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Edit
                          </button>
                        )}
                        {!isLandlord && bill.status !== 'Paid' && (
                          <button
                            onClick={() => handlePayBill(bill._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Pay Cash
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadBill(bill._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Download Bill
                        </button>
                        {bill.status === 'Paid' && (
                          <button
                            onClick={() => handleDownloadReceipt(bill._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Download Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {bill.paymentHistory && bill.paymentHistory.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        Last payment: {new Date(bill.paymentHistory[bill.paymentHistory.length - 1].date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly Bill Modal */}
        {showMonthlyBillModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Monthly Bills for All Tenants</h3>
                <form onSubmit={handleCreateMonthlyBill} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={monthlyBillData.month}
                      onChange={(e) => setMonthlyBillData({ ...monthlyBillData, month: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      value={monthlyBillData.year}
                      onChange={(e) => setMonthlyBillData({ ...monthlyBillData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={monthlyBillData.dueDate}
                      onChange={(e) => setMonthlyBillData({ ...monthlyBillData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowMonthlyBillModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Create Monthly Bills
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bill Modal */}
        {showEditBillModal && editingBill && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Bill</h3>
                <form onSubmit={handleUpdateBill} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (KSH)
                    </label>
                    <input
                      type="number"
                      value={editBillData.amount}
                      onChange={(e) => setEditBillData({ ...editBillData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editBillData.description}
                      onChange={(e) => setEditBillData({ ...editBillData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editBillData.dueDate}
                      onChange={(e) => setEditBillData({ ...editBillData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditBillModal(false);
                        setEditingBill(null);
                        setEditBillData({ amount: '', description: '', dueDate: '' });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Update Bill
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Bills;
