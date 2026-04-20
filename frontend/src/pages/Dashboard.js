/**
 * Dashboard Page
 * Overview of audit activity and quick actions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import RiskBadge from '../components/RiskBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.getAuditSummary();
        setSummary(data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <Loading message="Loading dashboard..." />;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Welcome, {user?.name}</h1>
          <p className="header-subtitle">
            Trade Secret Audit Dashboard for {user?.company}
          </p>
        </div>
        <Link to="/audit/new" className="btn btn-primary">
          + New Audit
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
