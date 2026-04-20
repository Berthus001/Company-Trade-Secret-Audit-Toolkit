/**
 * Audit Results Page
 * Displays detailed audit results with scores and recommendations
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loading from '../components/Loading';
import ScoreCard from '../components/ScoreCard';
import RiskBadge from '../components/RiskBadge';
import RecommendationCard from '../components/RecommendationCard';

const CATEGORY_LABELS = {
  accessControl: 'Access Control',
  dataEncryption: 'Data Encryption',
  employeePolicies: 'Employee Policies',
  physicalSecurity: 'Physical Security'
};

const AuditResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const data = await api.getAudit(id);
        setAudit(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load audit');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this audit? This action cannot be undone.')) {
      try {
        await api.deleteAudit(id);
        navigate('/audits');
      } catch (err) {
        setError('Failed to delete audit');
      }
    }
  };

  if (loading) return <Loading message="Loading audit results..." />;
  if (error) return <div className="error-page"><div className="alert alert-error">{error}</div><Link to="/audits" className="btn btn-outline">Back to Audits</Link></div>;
  if (!audit) return <div className="error-page"><p>Audit not found</p><Link to="/audits" className="btn btn-outline">Back to Audits</Link></div>;

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <div className="header-content">
          <div className="header-top">
            <Link to="/audits" className="back-link">← Back to Audits</Link>
            <button onClick={handleDelete} className="btn btn-danger btn-sm">
              Delete Audit
            </button>
          </div>
          <h1>{audit.companyName}</h1>
          <p className="audit-date">
            Audit completed on {new Date(audit.auditDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Overall Score Banner */}
      <div className={`score-banner risk-${audit.riskLevel.toLowerCase()}`}>
        <div className="score-banner-content">
          <div className="overall-score">
            <span className="score-number">{audit.percentageScore}%</span>
            <span className="score-label">Overall Score</span>
          </div>
          <RiskBadge level={audit.riskLevel} />
          <div className="score-details">
            <span>{audit.totalScore} / {audit.maxPossibleScore} points</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="results-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations ({audit.recommendations?.filter(r => r.priority === 'Critical' || r.priority === 'High').length || 0} urgent)
        </button>
        <button
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Detailed Responses
        </button>
      </div>

      {/* Tab Content */}
      <div className="results-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Category Scores</h2>
            <div className="score-cards-grid">
              {Object.entries(audit.categoryScores).map(([key, scores]) => (
                <ScoreCard
                  key={key}
                  title={CATEGORY_LABELS[key]}
                  score={scores.score}
                  maxScore={scores.maxScore}
                  percentage={scores.percentage}
                />
              ))}
            </div>

            {/* Risk Summary */}
            <div className="risk-summary">
              <h2>Risk Assessment Summary</h2>
              <div className={`risk-summary-content risk-${audit.riskLevel.toLowerCase()}`}>
                {audit.riskLevel === 'High' && (
                  <p>
                    <strong>⚠️ High Risk:</strong> Your organization has significant vulnerabilities
                    in trade secret protection. Immediate action is recommended to address critical
                    gaps before potential exposure occurs.
                  </p>
                )}
                {audit.riskLevel === 'Medium' && (
                  <p>
                    <strong>⚡ Medium Risk:</strong> Your organization has adequate protection but
                    there are areas that need improvement. Review the recommendations to strengthen
                    your trade secret security.
                  </p>
                )}
                {audit.riskLevel === 'Low' && (
                  <p>
                    <strong>✅ Low Risk:</strong> Your organization demonstrates strong trade secret
                    protection measures. Continue maintaining these practices and consider the
                    recommendations for continuous improvement.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <h2>Security Recommendations</h2>
            <p className="recommendations-intro">
              Based on your audit responses, here are prioritized recommendations to improve
              your trade secret protection:
            </p>

            {audit.recommendations && audit.recommendations.length > 0 ? (
              <div className="recommendations-list">
                {audit.recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </div>
            ) : (
              <div className="no-recommendations">
                <p>Great job! No critical recommendations at this time.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            <h2>Detailed Responses</h2>
            
            {Object.entries(
              audit.responses.reduce((acc, response) => {
                if (!acc[response.category]) acc[response.category] = [];
                acc[response.category].push(response);
                return acc;
              }, {})
            ).map(([category, responses]) => (
              <div key={category} className="category-responses">
                <h3>{category}</h3>
                <div className="responses-list">
                  {responses.map((response, index) => (
                    <div key={index} className={`response-item score-${response.selectedOption.value}`}>
                      <div className="response-question">{response.questionText}</div>
                      <div className="response-answer">
                        <span className={`answer-badge value-${response.selectedOption.value}`}>
                          {response.selectedOption.label}
                        </span>
                        <span className="answer-description">
                          {response.selectedOption.description}
                        </span>
                        <span className="answer-score">
                          {response.score} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="results-actions">
        <Link to="/audit/new" className="btn btn-primary">
          Start New Audit
        </Link>
        <button onClick={() => window.print()} className="btn btn-outline">
          Print Report
        </button>
      </div>
    </div>
  );
};

export default AuditResults;
