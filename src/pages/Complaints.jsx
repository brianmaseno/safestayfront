import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getComplaints, getMyComplaints, createComplaint, updateComplaintStatus, addLandlordNote } from '../services/api';

const Complaints = () => {
  const { user, isLandlord } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    description: ''
  });
  const [landlordNote, setLandlordNote] = useState('');

  // Fetch real data from API
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = isLandlord ? await getComplaints() : await getMyComplaints();
        setComplaints(response.data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isLandlord]);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    try {
      console.log('🚨 Creating complaint:', newComplaint);
      const response = await createComplaint(newComplaint);
      console.log('✅ Complaint created:', response.data);
      
      // Handle different response structures
      const newComplaintData = response.data.complaint || response.data;
      setComplaints([...complaints, newComplaintData]);
      setShowCreateModal(false);
      setNewComplaint({ title: '', description: '' });
      alert('Complaint submitted successfully!');
    } catch (error) {
      console.error('❌ Error creating complaint:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      alert(`Failed to create complaint: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      const response = await updateComplaintStatus(complaintId, { status: newStatus });
      setComplaints(prev => 
        prev.map(complaint => 
          complaint._id === complaintId 
            ? response.data.complaint
            : complaint
        )
      );
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert('Failed to update complaint status. Please try again.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const response = await addLandlordNote(selectedComplaint._id, landlordNote);
      setComplaints(prev => 
        prev.map(complaint => 
          complaint._id === selectedComplaint._id 
            ? response.data.complaint
            : complaint
        )
      );
      setShowNoteModal(false);
      setSelectedComplaint(null);
      setLandlordNote('');
    } catch (error) {
      console.error('Error adding landlord note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  const openNoteModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowNoteModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
              {isLandlord ? 'Complaints Management' : 'My Complaints'}
            </h1>
            <p className="text-gray-600">
              {isLandlord ? 'Manage tenant complaints and requests' : 'Submit and track your complaints'}
            </p>
          </div>
          {!isLandlord && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Submit Complaint
            </button>
          )}
        </div>

        {/* Complaints List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {isLandlord ? 'All Complaints' : 'Your Complaints'}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {complaints.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No complaints found</p>
                <p className="text-sm text-gray-400">
                  {isLandlord ? 'Complaints will appear here when submitted by tenants' : 'Your complaints will appear here'}
                </p>
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {complaint.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                      {isLandlord && complaint.tenant && (
                        <p className="text-sm text-gray-500 mb-1">Tenant: {complaint.tenant.name}</p>
                      )}
                      <p className="text-gray-700 mb-2">{complaint.description}</p>
                      {complaint.landlordNotes && complaint.landlordNotes.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-md mb-2">
                          <h4 className="text-sm font-medium text-blue-900 mb-1">Landlord Notes:</h4>
                          {complaint.landlordNotes.map((note, index) => (
                            <div key={index} className="text-sm text-blue-800 mb-1">
                              <p>{note.note}</p>
                              <p className="text-xs text-blue-600">
                                {new Date(note.date).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                        {complaint.resolvedAt && (
                          <span>Resolved: {new Date(complaint.resolvedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    {isLandlord && complaint.status !== 'Resolved' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openNoteModal(complaint)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Add Note
                        </button>
                        {complaint.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(complaint._id, 'In Progress')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Start Progress
                          </button>
                        )}
                        {complaint.status === 'In Progress' && (
                          <button
                            onClick={() => handleUpdateStatus(complaint._id, 'Resolved')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Landlord Note</h3>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note
                    </label>
                    <textarea
                      value={landlordNote}
                      onChange={(e) => setLandlordNote(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add your note about this complaint..."
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNoteModal(false);
                        setSelectedComplaint(null);
                        setLandlordNote('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Complaint Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Submit New Complaint</h3>
                <form onSubmit={handleCreateComplaint} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newComplaint.title}
                      onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the issue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newComplaint.description}
                      onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Detailed description of the problem"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Submit Complaint
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

export default Complaints;
