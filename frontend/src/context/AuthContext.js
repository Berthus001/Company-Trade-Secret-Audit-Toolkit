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
      
      localStorage.setItem('token', token);
      api.setAuthToken(token);
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    api.setAuthToken(null);
    setUser(null);
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
    isUser: !!user,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
