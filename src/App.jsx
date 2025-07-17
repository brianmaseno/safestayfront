import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Complaints from './pages/Complaints';
import Chat from './pages/Chat';
import TenantRights from './pages/TenantRights';
import Rules from './pages/Rules';
import Tenants from './pages/Tenants';
import './index.css';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bills" 
        element={
          <ProtectedRoute>
            <Bills />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/complaints" 
        element={
          <ProtectedRoute>
            <Complaints />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rights" 
        element={
          <ProtectedRoute requiredRole="Tenant">
            <TenantRights />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rules" 
        element={
          <ProtectedRoute>
            <Rules />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/tenants" 
        element={
          <ProtectedRoute requiredRole="Landlord">
            <Tenants />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/unauthorized" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
