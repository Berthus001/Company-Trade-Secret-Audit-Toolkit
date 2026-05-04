/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.setAuthToken(token);
          const userData = await api.getProfile();
          setUser(userData);
        } catch (err) {
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
          api.setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login user
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await api.login(credentials);
      const { token, ...user } = response;
      
      // Check if user is frozen
      if (user.isFrozen) {
        setError('Your account has been frozen. Please contact your administrator.');
        return { success: false, error: 'Account is frozen', isFrozen: true };
      }
      
      localStorage.setItem('token', token);
      api.setAuthToken(token);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      const isFrozen = err.response?.data?.isFrozen || false;
      setError(message);
      return { success: false, error: message, isFrozen };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    api.setAuthToken(null);
    setUser(null);
  };

  // Refresh user profile (to get updated role/data)
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await api.getProfile();
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, error: 'No token found' };
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      return { success: false, error: err.message };
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value = {
    user,
    role: user?.role || null,
    loading,
    error,
    isAuthenticated: !!user,
    isSuperadmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isAuditor: user?.role === 'auditor',
    isAnalyst: user?.role === 'analyst',
    isUser: !!user,
    canManageUsers: user?.role === 'admin' || user?.role === 'superadmin',
    canCreateAudits: ['auditor', 'admin', 'superadmin'].includes(user?.role),
    canViewAudits: ['auditor', 'analyst', 'admin', 'superadmin'].includes(user?.role),
    canViewRecommendations: ['analyst', 'admin', 'superadmin'].includes(user?.role),
    login,
    logout,
    refreshUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
