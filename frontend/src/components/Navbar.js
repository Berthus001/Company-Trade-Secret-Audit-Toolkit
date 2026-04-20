/**
 * Navbar Component
 * Main navigation bar with authentication controls
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
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
              <div className="nav-divider"></div>
              <span className="nav-user">
                {user?.name} ({user?.company})
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
