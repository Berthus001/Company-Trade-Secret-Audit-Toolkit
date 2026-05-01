/**
 * Manage Users Page
 * Table view for managing regular users
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';

const ManageUsers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers('user');
      setUsers(response.data || []);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load users';
      setError(`Failed to load users: ${errorMsg}`);
      console.error('Full error:', err);
      console.error('Error response:', err.response);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', company: '' });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      company: user.company
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleDeleteClick = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      setFormSuccess('User deleted successfully');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
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

    if (!editingUser && !formData.password) {
      setFormError('Password is required for new users');
      return;
    }

    if (formData.password && formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          role: 'user'
        };
        const updatedUser = await api.updateUser(editingUser._id, updateData);
        setUsers(users.map(u => u._id === editingUser._id ? updatedUser : u));
        setFormSuccess('User updated successfully');
      } else {
        // Create new user
        const newUser = await api.createUser(formData);
        setUsers([newUser, ...users]);
        setFormSuccess('User created successfully');
      }
      
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save user');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isAdmin) {
    return (
      <div className="container">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) return <Loading message="Loading users..." />;

  return (
    <div className="manage-page">
      <div className="page-header">
        <div>
          <h1>👥 Manage Users</h1>
          <p className="header-subtitle">View and manage regular user accounts</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateClick} data-testid="users-create-button">
          + Create New User
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {formSuccess && !showModal && <div className="alert alert-success">{formSuccess}</div>}

      <div className="table-container">
        <table className="user-table" data-testid="users-table">
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
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No users found. Create your first user!
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} data-testid={`users-row-${user._id}`}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.company}</td>
                  <td>
                    <span className="role-tag role-user">{user.role}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEditClick(user)}
                        title="Edit user"
                        data-testid={`users-edit-button-${user._id}`}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteClick(user._id, user.name)}
                        title="Delete user"
                        data-testid={`users-delete-button-${user._id}`}
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
              <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}

            <form onSubmit={handleFormSubmit} data-testid="users-modal-form">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  data-testid="users-modal-name-input"
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
                  data-testid="users-modal-email-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  data-testid="users-modal-password-input"
                  required={!editingUser}
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
                  data-testid="users-modal-company-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value="user"
                  disabled
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
                <small>Role is fixed for regular users</small>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                  data-testid="users-modal-cancel-button"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" data-testid="users-modal-submit-button">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
