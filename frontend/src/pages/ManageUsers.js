/**
 * Manage Users Page
 * Table view for managing regular users
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';

const ManageUsers = () => {
  const { user, isAdmin, isSuperadmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    role: 'user'
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
      // Fetch all users (no role filter) so admins see all users they created regardless of role
      // Superadmins will see ALL users including admins
      const response = await api.getUsers();
      console.log('Fetched users:', response.data);
      console.log('Total users count:', response.data?.length);
      
      // Log role breakdown for debugging
      const roleBreakdown = response.data?.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});
      console.log('Role breakdown:', roleBreakdown);
      
      // Filter to only show user, auditor, and analyst roles (hide admin and superadmin)
      const allowedRoles = ['user', 'auditor', 'analyst'];
      const filteredUsers = response.data?.filter(u => 
        allowedRoles.includes(u.role?.toLowerCase())
      ) || [];
      
      console.log('Filtered users count:', filteredUsers.length);
      setUsers(filteredUsers);
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
    setFormData({ name: '', email: '', password: '', company: '', role: 'user' });
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
      company: user.company,
      role: user.role || 'user'
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

  const handleFreezeClick = async (userId, userName) => {
    const reason = window.prompt(`Enter reason for freezing ${userName}:`);
    if (!reason) {
      return;
    }

    try {
      const updatedUser = await api.freezeUser(userId, reason);
      setUsers(users.map(u => u._id === userId ? { ...u, isFrozen: true, frozenAt: updatedUser.frozenAt } : u));
      setFormSuccess(`${userName} has been frozen`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to freeze user');
    }
  };

  const handleUnfreezeClick = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to unfreeze ${userName}?`)) {
      return;
    }

    try {
      await api.unfreezeUser(userId);
      setUsers(users.map(u => u._id === userId ? { ...u, isFrozen: false, frozenAt: null } : u));
      setFormSuccess(`${userName} has been unfrozen`);
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unfreeze user');
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
          role: formData.role
        };
        const updatedUser = await api.updateUser(editingUser._id, updateData);
        setUsers(users.map(u => u._id === editingUser._id ? updatedUser : u));
        setFormSuccess('User updated successfully');
      } else {
        // Create new user - include role
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
          <h1>👥 Manage Users {isSuperadmin && <span style={{fontSize: '0.6em', color: '#e65100'}}>(Superadmin Access)</span>}</h1>
          <p className="header-subtitle">
            {isSuperadmin ? 'View and manage all user accounts in the system' : 'View and manage user accounts you created'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={fetchUsers} title="Refresh user list">
            🔄 Refresh
          </button>
          <button className="btn btn-primary" onClick={handleCreateClick} data-testid="users-create-button">
            + Create New User
          </button>
        </div>
      </div>

      {isSuperadmin && (
        <div className="alert" style={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #e65100', marginBottom: '1rem' }}>
          <strong>Superadmin Mode:</strong> Logged in as <strong>{user?.name}</strong> ({user?.role}). 
          Showing {users.length} users (user, auditor, analyst only).
        </div>
      )}

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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
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
                    <span className={`role-tag role-${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    {user.isFrozen ? (
                      <span className="status-badge status-frozen" title={`Frozen on ${new Date(user.frozenAt).toLocaleDateString()}`}>
                        ❄️ Frozen
                      </span>
                    ) : (
                      <span className="status-badge status-active">
                        ✅ Active
                      </span>
                    )}
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
                      {user.isFrozen ? (
                        <button
                          className="btn-action btn-success"
                          onClick={() => handleUnfreezeClick(user._id, user.name)}
                          title="Unfreeze user"
                          data-testid={`users-unfreeze-button-${user._id}`}
                        >
                          🔓 Unfreeze
                        </button>
                      ) : (
                        <button
                          className="btn-action btn-warning"
                          onClick={() => handleFreezeClick(user._id, user.name)}
                          title="Freeze user"
                          data-testid={`users-freeze-button-${user._id}`}
                        >
                          ❄️ Freeze
                        </button>
                      )}
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
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  data-testid="users-modal-role-select"
                  required
                >
                  <option value="user">User</option>
                  <option value="auditor">Auditor</option>
                  <option value="analyst">Analyst</option>
                  {isSuperadmin && <option value="admin">Admin</option>}
                </select>
                <small>
                  • Auditor: Can create and view audits<br />
                  • Analyst: Can generate recommendations<br />
                  {isSuperadmin && (
                    <>
                      • Admin: Can manage users and assign roles<br />
                    </>
                  )}
                  • User: Standard access
                </small>
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
