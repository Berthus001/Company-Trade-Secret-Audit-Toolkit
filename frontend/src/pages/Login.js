/**
 * Login Page
 * User authentication form
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsFrozen(false);

    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const result = await login(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setFormError(result.error);
      if (result.isFrozen) {
        setIsFrozen(true);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your trade secret audits</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" data-testid="login-form">
          {(formError || error) && (
            <div className={`alert ${isFrozen ? 'alert-warning' : 'alert-error'}`} data-testid="login-error-message">
              {isFrozen && <strong>⚠️ Account Frozen: </strong>}
              {formError || error}
              {isFrozen && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Please contact your administrator for assistance.
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              autoComplete="email"
              data-testid="login-email-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              data-testid="login-password-input"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            data-testid="login-submit-button"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
