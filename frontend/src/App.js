/**
 * Main Application Component
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuditForm from './pages/AuditForm';
import AuditResults from './pages/AuditResults';
import AuditHistory from './pages/AuditHistory';
import ManageUsers from './pages/ManageUsers';
import ManageAdmins from './pages/ManageAdmins';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

function App() {
  const { loading, isSuperadmin } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Redirect register attempts to login */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Protected Routes - Redirect superadmins to admin panel */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {isSuperadmin ? (
                  <Navigate to="/admin/users" replace />
                ) : (
                  <Dashboard />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit/new"
            element={
              <ProtectedRoute>
                {isSuperadmin ? (
                  <Navigate to="/admin/users" replace />
                ) : (
                  <AuditForm />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit/:id"
            element={
              <ProtectedRoute>
                {isSuperadmin ? (
                  <Navigate to="/admin/users" replace />
                ) : (
                  <AuditResults />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/audits"
            element={
              <ProtectedRoute>
                {isSuperadmin ? (
                  <Navigate to="/admin/users" replace />
                ) : (
                  <AuditHistory />
                )}
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute requireSuperadmin={true}>
                <ManageAdmins />
              </ProtectedRoute>
            }
          />

          {/* Default redirect - superadmins go to admin panel */}
          <Route 
            path="/" 
            element={
              isSuperadmin ? (
                <Navigate to="/admin/users" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="*" 
            element={
              isSuperadmin ? (
                <Navigate to="/admin/users" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
