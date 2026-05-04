/**
 * Dashboard Page
 * Overview of audit activity and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import RiskBadge from '../components/RiskBadge';

const Dashboard = () => {
  const { 
    user, 
    isAdmin, 
    isSuperadmin, 
    isAuditor, 
    isAnalyst,
    canCreateAudits,
    refreshUser
  } = useAuth();
  const [summary, setSummary] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [roleChanged, setRoleChanged] = useState(false);
  const [analystAudits, setAnalystAudits] = useState([]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRoleChanged(false);
    try {
      // Refresh user profile first to detect role changes
      const oldRole = user?.role;
      const result = await refreshUser();
      if (result.success && result.user.role !== oldRole) {
        setRoleChanged(true);
        // Hide the notification after 5 seconds
        setTimeout(() => setRoleChanged(false), 5000);
      }
      // Then refresh dashboard data
      await fetchDashboardData(true);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);

      // Only fetch audit summary if user has audit-related permissions
      if (canCreateAudits || isAdmin || isSuperadmin) {
        try {
          const data = await api.getAuditSummary();
          setSummary(data);
        } catch (err) {
          console.error('Failed to fetch audit summary:', err);
          // Don't show error for users without permissions
          if (err.response?.status !== 403) {
            setError('Failed to load audit data');
          }
        }
      }
      
      // Admins/Superadmins: Fetch additional system stats
      if (isAdmin || isSuperadmin) {
        try {
          // Fetch user count (respects ownership - admins only count their users)
          const totalUsers = await api.getUserCount();
          
          // Fetch audit count (respects ownership - admins count all, regular count their own)
          const totalAudits = await api.getAuditCount();
          
          // Fetch recent audits for average score calculation
          const auditsEndpoint = isSuperadmin ? api.getAudits : api.getMyAudits;
          const auditsResponse = await auditsEndpoint({ limit: 100 });
          const allAudits = auditsResponse.data || [];
          
          const avgScore = allAudits.length > 0 
            ? Math.round(allAudits.reduce((sum, a) => sum + (a.percentageScore || 0), 0) / allAudits.length)
            : 0;
          
          setSystemStats({
            totalUsers: totalUsers,
            totalAudits: totalAudits,
            averageScore: avgScore,
            recentActivity: allAudits.slice(0, 5)
          });
        } catch (err) {
          console.error('Failed to fetch system stats:', err);
        }
      }

      // Analysts: Fetch audits with workflow status
      if (isAnalyst) {
        try {
          const auditsResponse = await api.getMyAudits({ limit: 20 });
          setAnalystAudits(auditsResponse.data || []);
        } catch (err) {
          console.error('Failed to fetch analyst audits:', err);
        }
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      // Only show generic error if it's not a permission issue
      if (err.response?.status !== 403) {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isSuperadmin, canCreateAudits, isAnalyst]);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds (includes user profile refresh to detect role changes)
    const interval = setInterval(async () => {
      // Refresh user profile to detect role changes
      await refreshUser();
      // Then refresh dashboard data
      fetchDashboardData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshUser]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#ffc107', bg: '#fff3cd', label: '⏳ Pending' },
      in_progress: { color: '#2196f3', bg: '#e3f2fd', label: '🔵 In Progress' },
      done: { color: '#4caf50', bg: '#e8f5e9', label: '✅ Done' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        backgroundColor: badge.bg,
        color: badge.color,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: '600',
        border: `1px solid ${badge.color}`,
        whiteSpace: 'nowrap'
      }}>
        {badge.label}
      </span>
    );
  };

  if (loading) return <Loading message="Loading dashboard..." />;

  return (
    <div className="dashboard-page" data-testid="dashboard">
      <div className="page-header">
        <div className="header-content">
          <h1>Welcome, {user?.name}</h1>
          <p className="header-subtitle">
            Trade Secret Audit Dashboard for {user?.company}
            {user?.role && (
              <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {user.role.toUpperCase()}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={handleRefresh} 
            className="btn btn-secondary"
            disabled={refreshing}
            data-testid="dashboard-refresh-button"
            title="Refresh dashboard and check for role updates"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {refreshing ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span>
                Refreshing...
              </>
            ) : (
              <>🔄 Refresh</>
            )}
          </button>
          {canCreateAudits && (
            <Link to="/audit/new" className="btn btn-primary" data-testid="dashboard-new-audit-button">
              + New Audit
            </Link>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      
      {roleChanged && (
        <div className="alert alert-success" style={{ backgroundColor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
          <strong>✅ Role Updated!</strong> Your role has been changed. Dashboard content has been updated to reflect your new permissions.
        </div>
      )}

      {/* Role-based content: Superadmin System Overview */}
      {isSuperadmin && systemStats && (
        <div className="dashboard-card" style={{ marginBottom: '1.5rem', backgroundColor: '#f3e5f5', borderLeft: '4px solid #9c27b0' }}>
          <h3 style={{ color: '#9c27b0' }}>🔐 System Overview (Superadmin)</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{systemStats.totalUsers}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStats.totalAudits}</span>
              <span className="stat-label">System Audits</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStats.averageScore}%</span>
              <span className="stat-label">Avg System Score</span>
            </div>
          </div>
        </div>
      )}

      {/* Role-based content: Admin Stats - ALWAYS SHOW FOR ADMINS */}
      {isAdmin && !isSuperadmin && (
        <div className="dashboard-card" style={{ marginBottom: '1.5rem', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
          <h3 style={{ color: '#2196f3' }}>👥 User Management Summary (Admin)</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{systemStats?.totalUsers || 0}</span>
              <span className="stat-label">Users You Created</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStats?.totalAudits || 0}</span>
              <span className="stat-label">Total System Audits</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Summary Stats - Only show if user has audit access */}
        {(canCreateAudits || isAdmin || isSuperadmin) && (
          <>
            <div className="dashboard-card stats-card">
              <h3>Audit Overview</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{summary?.totalAudits || 0}</span>
                  <span className="stat-label">Total Audits</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{summary?.averageScore || 0}%</span>
                  <span className="stat-label">Average Score</span>
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="dashboard-card">
              <h3>Risk Distribution</h3>
              <div className="risk-distribution">
                <div className="risk-item">
                  <span className="risk-count risk-low">
                    {summary?.riskDistribution?.Low || 0}
                  </span>
                  <span className="risk-label">Low Risk</span>
                </div>
                <div className="risk-item">
                  <span className="risk-count risk-medium">
                    {summary?.riskDistribution?.Medium || 0}
                  </span>
                  <span className="risk-label">Medium Risk</span>
                </div>
                <div className="risk-item">
                  <span className="risk-count risk-high">
                    {summary?.riskDistribution?.High || 0}
                  </span>
                  <span className="risk-label">High Risk</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            {canCreateAudits && (
              <>
                <Link to="/audit/new" className="action-link">
                  <span className="action-icon">📋</span>
                  <span>Start New Audit</span>
                </Link>
                <Link to="/audits" className="action-link">
                  <span className="action-icon">📊</span>
                  <span>View All Audits</span>
                </Link>
              </>
            )}
            {isAnalyst && (
              <Link to="/audits" className="action-link">
                <span className="action-icon">📊</span>
                <span>View All Audits</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/users" className="action-link">
                <span className="action-icon">👥</span>
                <span>Manage Users</span>
              </Link>
            )}
            {!canCreateAudits && !isAnalyst && !isAdmin && (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                <p style={{ marginBottom: '0.5rem' }}>👤 <strong>Standard User Account</strong></p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                  Contact your administrator to be assigned a specific role (Auditor or Analyst) for access to audit features.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Analyst Audits - Show workflow status */}
        {isAnalyst && (
          <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>📋 Audits Workflow</h3>
              <Link to="/audits" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {analystAudits.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analystAudits.slice(0, 10).map((audit) => (
                  <Link
                    key={audit._id}
                    to={`/audit/${audit._id}`}
                    className="recent-audit-item"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#2d3748', marginBottom: '0.25rem' }}>
                        {audit.companyName}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                        {new Date(audit.auditDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#718096' }}>Score:</span>
                        <span style={{ fontWeight: '600', fontSize: '1rem', color: '#2d3748' }}>
                          {audit.percentageScore}%
                        </span>
                        <RiskBadge level={audit.riskLevel} showLabel={false} />
                      </div>
                      {getStatusBadge(audit.recommendationStatus || 'pending')}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No audits available yet</p>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  Audits from your company will appear here once created
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recent Audits - Only show if user has audit access */}
        {(canCreateAudits || isAdmin || isSuperadmin) && (
          <div className="dashboard-card recent-audits-card">
            <h3>Recent Audits</h3>
            {summary?.recentAudits?.length > 0 ? (
              <div className="recent-audits-list">
                {summary.recentAudits.map((audit) => (
                  <Link
                    key={audit._id}
                    to={`/audit/${audit._id}`}
                    className="recent-audit-item"
                  >
                    <div className="audit-info">
                      <span className="audit-company">{audit.companyName}</span>
                      <span className="audit-date">
                        {new Date(audit.auditDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="audit-score">
                      <span className="score-value">{audit.percentageScore}%</span>
                      <RiskBadge level={audit.riskLevel} showLabel={false} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No audits yet</p>
                {canCreateAudits && (
                  <Link to="/audit/new" className="btn btn-outline">
                    Create your first audit
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Welcome Card for Basic Users */}
        {!canCreateAudits && !isAnalyst && !isAdmin && (
          <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
            <h3>👋 Welcome to Trade Secret Audit Toolkit</h3>
            <div style={{ padding: '1rem 0' }}>
              <p style={{ marginBottom: '1rem' }}>
                You currently have a <strong>standard user account</strong>. To access audit features, 
                you need to be assigned a specific role by your administrator.
              </p>
              <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Available Roles:</h4>
                <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
                  <li><strong>Auditor:</strong> Create and manage trade secret audits</li>
                  <li><strong>Analyst:</strong> Generate recommendations and view audit summaries</li>
                </ul>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>
                <strong>Next step:</strong> Contact your system administrator to request role assignment based on your responsibilities.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="info-section">
        {/* Role-specific information */}
        {isAuditor && (
          <div className="info-card" style={{ backgroundColor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
            <h3>🔍 Auditor Role</h3>
            <p>
              As an auditor, you can create and view audit assessments. Your role is focused 
              on evaluating trade secret protection measures and documenting compliance.
            </p>
            <p><strong>Your capabilities:</strong></p>
            <ul>
              <li>Create new audits</li>
              <li>View your audit history</li>
              <li>Access audit results and scores</li>
            </ul>
          </div>
        )}
        
        {isAnalyst && (
          <div className="info-card" style={{ backgroundColor: '#fce4ec', borderLeft: '4px solid #c2185b' }}>
            <h3>💡 Analyst Role</h3>
            <p>
              As an analyst, you can view audit summaries and generate AI-powered recommendations 
              for improving trade secret protection, but you cannot see detailed audit answers.
            </p>
            <p><strong>Your capabilities:</strong></p>
            <ul>
              <li>View audit summaries and scores</li>
              <li>Generate AI recommendations</li>
              <li>Access risk assessments</li>
            </ul>
          </div>
        )}

        {!canCreateAudits && !isAnalyst && !isAdmin && (
          <div className="info-card" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
            <h3>👤 Standard User Role</h3>
            <p>
              Your account is currently set to the standard user role. This is a basic access level 
              that can be upgraded to specific functional roles.
            </p>
            <p><strong>To get started:</strong></p>
            <ul>
              <li>Contact your system administrator</li>
              <li>Request assignment to <strong>Auditor</strong> or <strong>Analyst</strong> role</li>
              <li>Specify which responsibilities you'll have in the organization</li>
            </ul>
            <p style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff', borderRadius: '4px', fontSize: '0.9rem' }}>
              <strong>💡 Tip:</strong> Administrators can assign roles through the "Manage Users" page.
            </p>
          </div>
        )}

        <div className="info-card">
          <h3>🛡️ About Trade Secret Protection</h3>
          <p>
            This toolkit helps you evaluate your organization's trade secret protection
            measures across four key areas: Access Control, Data Encryption, Employee
            Policies, and Physical Security.
          </p>
          <p>
            Regular audits help demonstrate "reasonable measures" as required by the
            Defend Trade Secrets Act (DTSA) and can serve as evidence in legal proceedings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
