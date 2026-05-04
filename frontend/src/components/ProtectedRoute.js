/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Supports role-based access control
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireSuperadmin = false,
  requireRole = null,
  blockRole = null 
}) => {
  const { 
    isAuthenticated, 
    isAdmin, 
    isSuperadmin, 
    role, 
    loading 
  } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  // Check authentication first
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check superadmin requirement
  if (requireSuperadmin && !isSuperadmin) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>🚫 Access Denied</h2>
        <p>This page is only accessible to superadmins.</p>
        <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
      </div>
    );
  }

  // Check admin requirement (admin or superadmin)
  if (requireAdmin && !isAdmin) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>🚫 Access Denied</h2>
        <p>This page is only accessible to administrators.</p>
        <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
      </div>
    );
  }

  // Check specific role requirement
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
    if (!allowedRoles.includes(role)) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>🚫 Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
        </div>
      );
    }
  }

  // Check blocked role
  if (blockRole) {
    const blockedRoles = Array.isArray(blockRole) ? blockRole : [blockRole];
    if (blockedRoles.includes(role)) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>🚫 Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
