/**
 * Manage Admins Page
 * Table view for managing admin users (Superadmin only)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';

const ManageAdmins = () => {
  const { isSuperadmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch admins on mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers('admin');
      setAdmins(response.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load admins';
      setError(`Failed to load admins: ${errorMsg}`);
      console.error('Full error:', err);
      console.error('Error response:', err.response);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingAdmin(null);
    setFormData({ name: '', email: '', password: '', company: '' });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleEditClick = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      company: admin.company
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleDeleteClick = async (adminId, adminName) => {
    if (!window.confirm(`Are you sure you want to delete admin ${adminName}?`)) {
      return;
    }

    try {
      await api.deleteUser(adminId);
      setAdmins(admins.filter(a => a._id !== adminId));
      setFormSuccess('Admin deleted successfully');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete admin');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!formData.name || !formData.email || !formData.company) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (!editingAdmin && !formData.password) {
      setFormError('Password is required for new admins');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    try {
      if (editingAdmin) {
        // Update existing admin
        const updateData = {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: 'admin'
        };
        const updatedAdmin = await api.updateUser(editingAdmin._id, updateData);
        setAdmins(admins.map(a => a._id === editingAdmin._id ? updatedAdmin : a));
        setFormSuccess('Admin updated successfully');
      } else {
        // Create new admin
        const newAdmin = await api.createAdmin(formData);
        setAdmins([newAdmin, ...admins]);
        setFormSuccess('Admin created successfully');
      }
      
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save admin');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isSuperadmin) {
    return (
      <div className="container">
        <h2>🚫 Access Denied</h2>
        <p>Only superadmins can manage admin accounts.</p>
      </div>
    );
  }

  if (loading) return <Loading message="Loading admins..." />;

  return (
    <div className="manage-page">
      <div className="page-header">
        <div>
          <h1>👑 Manage Admins</h1>
          <p className="header-subtitle">View and manage administrator accounts</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateClick} data-testid="admins-create-button">
          + Create New Admin
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {formSuccess && !showModal && <div className="alert alert-success">{formSuccess}</div>}

      <div className="table-container">
        <table className="user-table" data-testid="admins-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No admins found. Create your first admin!
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin._id} data-testid={`admins-row-${admin._id}`}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.company}</td>
                  <td>
                    <span className="role-tag role-admin">{admin.role}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEditClick(admin)}
                        title="Edit admin"
                        data-testid={`admins-edit-button-${admin._id}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteClick(admin._id, admin.name)}
                        title="Delete admin"
                        data-testid={`admins-delete-button-${admin._id}`}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAdmin ? 'Edit Admin' : 'Create New Admin'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

            <form onSubmit={handleFormSubmit} data-testid="admins-modal-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  data-testid="admins-modal-name-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  data-testid="admins-modal-email-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password {editingAdmin ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  data-testid="admins-modal-password-input"
                  required={!editingAdmin}
                  minLength={8}
                />
                <small>Minimum 8 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="company">Company *</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  data-testid="admins-modal-company-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value="admin"
                  disabled
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
                <small>Role is fixed for admin accounts</small>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                  data-testid="admins-modal-cancel-button"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="admins-modal-submit-button">
                  {editingAdmin ? 'Update Admin' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;
