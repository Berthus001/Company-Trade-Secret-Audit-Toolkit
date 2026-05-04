/**
 * Navbar Component
 * Main navigation bar with authentication controls
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { 
    user, 
    isAuthenticated, 
    isSuperadmin,
    isAnalyst,
    canCreateAudits,
    canManageUsers,
    logout 
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-text">Trade Secret Audit</span>
        </Link>

        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              {/* Show Dashboard to all authenticated users */}
              {!isSuperadmin && (
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  data-testid="navbar-dashboard-link"
                >
                  Dashboard
                </Link>
              )}

              {/* Auditors can create audits */}
              {canCreateAudits && !isSuperadmin && (
                <>
                  <Link
                    to="/audit/new"
                    className={`nav-link ${isActive('/audit/new') ? 'active' : ''}`}
                    data-testid="navbar-new-audit-link"
                  >
                    New Audit
                  </Link>
                  <Link
                    to="/audits"
                    className={`nav-link ${isActive('/audits') ? 'active' : ''}`}
                    data-testid="navbar-history-link"
                  >
                    History
                  </Link>
                </>
              )}
              
              {/* Analysts can view audits (limited) */}
              {isAnalyst && (
                <Link
                  to="/audits"
                  className={`nav-link ${isActive('/audits') ? 'active' : ''}`}
                  data-testid="navbar-history-link"
                >
                  View Audits
                </Link>
              )}
              
              {/* Admin: Show Manage Users */}
              {canManageUsers && !isSuperadmin && (
                <Link
                  to="/admin/users"
                  className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                  data-testid="navbar-manage-users-link"
                >
                  Manage Users
                </Link>
              )}
              
              {/* Superadmin: Show control panel links */}
              {isSuperadmin && (
                <>
                  <Link
                    to="/admin/users"
                    className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
                    data-testid="navbar-manage-users-link"
                  >
                    👥 Manage Users
                  </Link>
                  <Link
                    to="/admin/admins"
                    className={`nav-link ${isActive('/admin/admins') ? 'active' : ''}`}
                    data-testid="navbar-manage-admins-link"
                  >
                    👑 Manage Admins
                  </Link>
                </>
              )}
              
              <div className="nav-divider"></div>
              <span className="nav-user">
                {user?.name} ({user?.company})
                {user?.role && (
                  <span 
                    className={`role-badge role-${user.role}`}
                    title={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  >
                    {user.role}
                  </span>
                )}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-danger btn-sm"
                data-testid="navbar-logout-button"
                style={{ 
                  marginLeft: '1rem',
                  fontWeight: '500',
                  padding: '0.5rem 1rem'
                }}
              >
                🚪 Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
