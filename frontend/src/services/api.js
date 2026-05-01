/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Automatically attach token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors (token expired/invalid)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API service object
const api = {
  // Set auth token for all requests
  // Note: This is now handled automatically by the request interceptor
  // Kept for backward compatibility
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  },

  // ==================
  // Auth endpoints
  // ==================
  
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data.data;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data.data;
  },

  createAdmin: async (userData) => {
    const response = await axiosInstance.post('/auth/users/create-admin', userData);
    return response.data.data;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post('/auth/users/create-user', userData);
    return response.data.data;
  },

  getUsers: async (role) => {
    const params = role ? { role } : {};
    const response = await axiosInstance.get('/auth/users', { params });
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await axiosInstance.put(`/auth/users/${id}`, userData);
    return response.data.data;
  },

  deleteUser: async (id) => {
    const response = await axiosInstance.delete(`/auth/users/${id}`);
    return response.data;
  },

  // ==================
  // Questions endpoints
  // ==================
  
  getQuestions: async () => {
    const response = await axiosInstance.get('/questions');
    return response.data.data;
  },

  seedQuestions: async () => {
    const response = await axiosInstance.post('/questions/seed', { force: true });
    return response.data;
  },

  // ==================
  // Audits endpoints
  // ==================
  
  submitAudit: async (auditData) => {
    const response = await axiosInstance.post('/audits', auditData);
    return response.data.data;
  },

  getAudits: async (params = {}) => {
    const response = await axiosInstance.get('/audits', { params });
    return response.data;
  },

  getMyAudits: async (params = {}) => {
    const response = await axiosInstance.get('/audits/my', { params });
    return response.data;
  },

  getAudit: async (id) => {
    const response = await axiosInstance.get(`/audits/${id}`);
    return response.data.data;
  },

  deleteAudit: async (id) => {
    const response = await axiosInstance.delete(`/audits/${id}`);
    return response.data;
  },

  getAuditSummary: async () => {
    const response = await axiosInstance.get('/audits/summary');
    return response.data.data;
  },

  // ==================
  // AI Recommendations endpoint
  // ==================
  
  getAIRecommendations: async (categoryScores, weakCategories) => {
    const response = await axiosInstance.post('/audits/recommendations', {
      categoryScores,
      weakCategories
    });
    return response.data.data;
  }
};

export default api;
