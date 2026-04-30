/**
 * Navbar Component
 * Main navigation bar with authentication controls
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isSuperadmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-text">Trade Secret Audit</span>
        </Link>

        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              {/* Regular users and admins see audit features */}
              {!isSuperadmin && (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/audit/new"
                    className={`nav-link ${isActive('/audit/new') ? 'active' : ''}`}
                  >
                    New Audit
                  </Link>
                  <Link
                    to="/audits"
                    className={`nav-link ${isActive('/audits') ? 'active' : ''}`}
                  >
                    History
                  </Link>
                </>
              )}
              
              {/* Admin: Show Manage Users */}
              {isAdmin && !isSuperadmin && (
                <Link
                  to="/admin/users"
                  className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}
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
                  >
                    👥 Manage Users
                  </Link>
                  <Link
                    to="/admin/admins"
                    className={`nav-link ${isActive('/admin/admins') ? 'active' : ''}`}
                  >
                    👑 Manage Admins
                  </Link>
                </>
              )}
              
              <div className="nav-divider"></div>
              <span className="nav-user">
                {user?.name} ({user?.company})
                {user?.role && <span className="role-badge">{user.role}</span>}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-danger btn-sm"
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
