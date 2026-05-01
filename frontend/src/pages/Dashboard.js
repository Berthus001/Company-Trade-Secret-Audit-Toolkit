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
  const { user, isAdmin, isSuperadmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch audit summary based on role
      const data = await api.getAuditSummary();
      setSummary(data);
      
      // Admins/Superadmins: Fetch additional system stats
      if (isAdmin || isSuperadmin) {
        try {
          // Fetch users (filtered by ownership for admins)
          const usersResponse = await api.getUsers('user');
          const totalUsers = usersResponse.data?.length || 0;
          
          // Fetch audits (filtered by ownership for admins)
          const auditsEndpoint = isSuperadmin ? api.getAudits : api.getMyAudits;
          const auditsResponse = await auditsEndpoint({ limit: 100 });
          const allAudits = auditsResponse.data || [];
          
          const totalAudits = allAudits.length;
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
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, isSuperadmin]);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 60 seconds (reduced from 30s to avoid rate limiting)
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

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
            onClick={() => fetchDashboardData(true)} 
            className="btn btn-secondary"
            disabled={refreshing}
            data-testid="dashboard-refresh-button"
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
          <Link to="/audit/new" className="btn btn-primary" data-testid="dashboard-new-audit-button">
            + New Audit
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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

      {/* Role-based content: Admin Stats */}
      {isAdmin && !isSuperadmin && systemStats && (
        <div className="dashboard-card" style={{ marginBottom: '1.5rem', backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3' }}>
          <h3 style={{ color: '#2196f3' }}>👥 User Management Summary (Admin)</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{systemStats.totalUsers}</span>
              <span className="stat-label">Total Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStats.totalAudits}</span>
              <span className="stat-label">All Audits</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Summary Stats */}
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

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <Link to="/audit/new" className="action-link">
              <span className="action-icon">📋</span>
              <span>Start New Audit</span>
            </Link>
            <Link to="/audits" className="action-link">
              <span className="action-icon">📊</span>
              <span>View All Audits</span>
            </Link>
          </div>
        </div>

        {/* Recent Audits */}
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
              <Link to="/audit/new" className="btn btn-outline">
                Create your first audit
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="info-section">
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
