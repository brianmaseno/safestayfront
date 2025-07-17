import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getRules, addRules, updateRule, deleteRule } from '../services/api';

const Rules = () => {
  const { user, isLandlord } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    title: '',
    description: '',
    category: 'general'
  });

  // Fetch real data from API
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        console.log('📋 Fetching rules...');
        
        const response = await getRules();
        console.log('📋 Rules response:', response.data);
        
        // Handle response structure - backend returns full apartmentRules object
        if (response.data && response.data.rules) {
          console.log('📋 Setting rules from response.data.rules:', response.data.rules);
          setRules(response.data.rules);
        } else if (Array.isArray(response.data)) {
          console.log('📋 Setting rules from response.data array:', response.data);
          setRules(response.data);
        } else {
          console.log('📋 No rules found, setting empty array');
          setRules([]);
        }
      } catch (error) {
        console.error('❌ Error fetching rules:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        setRules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      console.log('📝 Creating rule:', newRule);
      
      if (editingRule) {
        // Update existing rule
        console.log('📝 Updating rule:', editingRule._id);
        const response = await updateRule(editingRule._id, newRule);
        console.log('✅ Rule updated:', response.data);
        
        // Refresh the rules list
        const rulesResponse = await getRules();
        console.log('📋 Rules refreshed:', rulesResponse.data);
        if (rulesResponse.data && rulesResponse.data.rules) {
          setRules(rulesResponse.data.rules);
        } else if (Array.isArray(rulesResponse.data)) {
          setRules(rulesResponse.data);
        } else {
          setRules([]);
        }
        setEditingRule(null);
      } else {
        // Create new rule - send as rules array
        console.log('📝 Creating new rule');
        const response = await addRules({ rules: [newRule] });
        console.log('✅ Rule created:', response.data);
        
        // Refresh the rules list
        const rulesResponse = await getRules();
        console.log('📋 Rules refreshed after create:', rulesResponse.data);
        if (rulesResponse.data && rulesResponse.data.rules) {
          setRules(rulesResponse.data.rules);
        } else if (Array.isArray(rulesResponse.data)) {
          setRules(rulesResponse.data);
        } else {
          setRules([]);
        }
      }
      setShowCreateModal(false);
      setNewRule({ title: '', description: '', category: 'general' });
    } catch (error) {
      console.error('❌ Error saving rule:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      alert(`Failed to save rule: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteRule(ruleId);
      // Refresh the rules list
      const rulesResponse = await getRules();
      if (rulesResponse.data && rulesResponse.data.rules) {
        setRules(rulesResponse.data.rules);
      } else if (Array.isArray(rulesResponse.data)) {
        setRules(rulesResponse.data);
      } else {
        setRules([]);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Failed to delete rule. Please try again.');
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewRule({
      title: rule.title,
      description: rule.description,
      category: rule.category
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingRule(null);
    setNewRule({ title: '', description: '', category: 'general' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      payment: 'bg-blue-100 text-blue-800',
      noise: 'bg-purple-100 text-purple-800',
      guests: 'bg-green-100 text-green-800',
      pets: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'payment', label: 'Payment' },
    { value: 'noise', label: 'Noise' },
    { value: 'guests', label: 'Guests' },
    { value: 'pets', label: 'Pets' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

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
              {isLandlord ? 'Property Rules Management' : 'Property Rules'}
            </h1>
            <p className="text-gray-600">
              {isLandlord ? 'Manage rules and policies for your property' : 'Review the rules and policies for your rental'}
            </p>
          </div>
          {isLandlord && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add New Rule
            </button>
          )}
        </div>

        {/* Rules Grid */}
        <div className="grid gap-6">
          {rules.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No rules found</p>
              <p className="text-sm text-gray-400">
                {isLandlord ? 'Add rules to manage your property' : 'Rules will appear here when added by your landlord'}
              </p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule._id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{rule.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(rule.category)}`}>
                        {rule.category.charAt(0).toUpperCase() + rule.category.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{rule.description}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(rule.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isLandlord && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {!isLandlord && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-sm font-bold">i</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Important Information
                </h3>
                <p className="text-blue-800">
                  These rules are specific to your rental property and are part of your lease agreement.
                  Please review them carefully and contact your landlord if you have any questions.
                  Violations of these rules may result in lease termination.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Rule Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingRule ? 'Edit Rule' : 'Add New Rule'}
                </h3>
                <form onSubmit={handleCreateRule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Title
                    </label>
                    <input
                      type="text"
                      value={newRule.title}
                      onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter rule title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter rule description"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {editingRule ? 'Update Rule' : 'Add Rule'}
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

export default Rules;
