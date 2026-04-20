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

// API service object
const api = {
  // Set auth token for all requests
  setAuthToken: (token) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  },

  // ==================
  // Auth endpoints
  // ==================
  
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data.data;
  },

  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data.data;
  },

  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data.data;
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
  // Recommendations endpoints
  // ==================
  
  getRecommendations: async (categoryScores) => {
    const response = await axiosInstance.post('/recommendations', { categoryScores });
    return response.data.data;
  }
};

export default api;
