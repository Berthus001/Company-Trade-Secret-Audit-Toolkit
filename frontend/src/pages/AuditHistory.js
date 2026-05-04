/**
 * Audit History Page
 * Lists all previous audits with filtering options
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import RiskBadge from '../components/RiskBadge';

const AuditHistory = () => {
  const { isAdmin, isSuperadmin, isAnalyst, canCreateAudits } = useAuth();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  const fetchAudits = useCallback(async (page = 1, riskLevel = null) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (riskLevel && riskLevel !== 'all') {
        params.riskLevel = riskLevel;
      }
      
      // Use appropriate endpoint based on user role
      // Admins see all, auditors/analysts see their scope
      const response = (isAdmin || isSuperadmin) 
        ? await api.getAudits(params)
        : await api.getMyAudits(params);
      setAudits(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load audits');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isSuperadmin]);

  useEffect(() => {
    fetchAudits(1, filter);
  }, [fetchAudits, filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handlePageChange = (newPage) => {
    fetchAudits(newPage, filter);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this audit?')) {
      try {
        await api.deleteAudit(id);
        fetchAudits(pagination.page, filter);
      } catch (err) {
        setError('Failed to delete audit');
      }
    }
  };

  if (loading && audits.length === 0) {
    return <Loading message="Loading audit history..." />;
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Audit History</h1>
          <p className="header-subtitle">
            {isAnalyst 
              ? 'View audits from your company (Limited View - No detailed answers)' 
              : 'View and manage your previous trade secret audits'}
          </p>
        </div>
        {!isAnalyst && (
          <Link to="/audit/new" className="btn btn-primary">
            + New Audit
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      
      {isAnalyst && (
        <div className="alert alert-info" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
          <strong>👁️ Limited View:</strong> As an analyst, you can view audits from your company but cannot see detailed question answers. You can generate recommendations based on the scores.
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Risk Level:</label>
          <div className="filter-buttons">
            {['all', 'Low', 'Medium', 'High'].map((level) => (
              <button
                key={level}
                className={`filter-btn ${filter === level ? 'active' : ''} ${level !== 'all' ? `risk-${level.toLowerCase()}` : ''}`}
                onClick={() => handleFilterChange(level)}
              >
                {level === 'all' ? 'All' : `${level} Risk`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit List */}
      {audits.length > 0 ? (
        <>
          <div className="audit-list">
            {audits.map((audit) => (
              <div key={audit._id} className="audit-list-item">
                <Link to={`/audit/${audit._id}`} className="audit-link">
                  <div className="audit-main-info">
                    <h3>{audit.companyName}</h3>
                    <span className="audit-date">
                      {new Date(audit.auditDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="audit-score-info">
                    <span className="score-percentage">{audit.percentageScore}%</span>
                    <RiskBadge level={audit.riskLevel} showLabel={false} />
                  </div>
                </Link>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(audit._id);
                  }}
                  title="Delete audit"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                ← Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No audits found</h3>
          <p>
            {filter !== 'all'
              ? `No audits with ${filter} risk level.`
              : isAnalyst 
                ? "No audits available from your company yet."
                : "You haven't completed any audits yet."}
          </p>
          {canCreateAudits && (
            <Link to="/audit/new" className="btn btn-primary">
              Start Your First Audit
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditHistory;
