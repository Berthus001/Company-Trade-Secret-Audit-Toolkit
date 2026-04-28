/**
 * Admin Dashboard Component
 * Allows admins and superadmins to create new users
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const { isAdmin, isSuperadmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    role: 'user'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Redirect if not admin/superadmin
  if (!isAdmin) {
    return (
      <div className="container">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate
    if (!formData.name || !formData.email || !formData.password || !formData.company) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || '/api';
      
      // Determine endpoint based on role
      const endpoint = formData.role === 'admin' 
        ? `${BASE_URL}/auth/users/create-admin`
        : `${BASE_URL}/auth/users/create-user`;

      const response = await axios.post(
        endpoint,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          company: formData.company
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `${formData.role === 'admin' ? 'Admin' : 'User'} created successfully!` 
        });
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          company: '',
          role: 'user'
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create user';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1>User Management</h1>
      <p>Create new users for the system</p>

      {message.text && (
        <div 
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div>
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div>
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
          <small style={{ color: '#666' }}>Minimum 8 characters</small>
        </div>

        <div>
          <label htmlFor="company">Company *</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </div>

        <div>
          <label htmlFor="role">Role *</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          >
            <option value="user">User</option>
            {isSuperadmin && <option value="admin">Admin</option>}
          </select>
          {!isSuperadmin && (
            <small style={{ color: '#666' }}>
              Only superadmins can create admin users
            </small>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Creating...' : `Create ${formData.role === 'admin' ? 'Admin' : 'User'}`}
        </button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
