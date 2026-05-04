/**
 * Audit Results Page
 * Displays detailed audit results with scores and recommendations
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import ScoreCard from '../components/ScoreCard';
import RiskBadge from '../components/RiskBadge';
import RecommendationCard from '../components/RecommendationCard';
import { downloadPDFReport } from '../utils/pdfGenerator';

const CATEGORY_LABELS = {
  accessControl: 'Access Control',
  dataEncryption: 'Data Encryption',
  employeePolicies: 'Employee Policies',
  physicalSecurity: 'Physical Security'
};

const AuditResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAnalyst, isAuditor, canViewRecommendations, canCreateAudits } = useAuth();

  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSource, setAiSource] = useState(null);
  const [aiNote, setAiNote] = useState(null);
  const [aiModel, setAiModel] = useState(null);
  const [isLimitedView, setIsLimitedView] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const data = await api.getAudit(id);
        setAudit(data);
        setIsLimitedView(data.limitedView === true || isAnalyst);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load audit');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [id, isAnalyst]);

  const generateAIRecommendations = async () => {
    if (!audit) return;

    setLoadingAI(true);
    setAiError(null);

    try {
      // Prepare categoryScores in the format expected by API
      const categoryScores = {};
      Object.entries(audit.categoryScores).forEach(([key, scores]) => {
        categoryScores[CATEGORY_LABELS[key]] = {
          score: scores.percentage,
          earnedPoints: scores.score,
          maxPoints: scores.maxScore
        };
      });

      // Identify weak categories (below 75%)
      const weakCategories = Object.entries(audit.categoryScores)
        .filter(([_, scores]) => scores.percentage < 75)
        .map(([key]) => CATEGORY_LABELS[key]);

      const data = await api.getAIRecommendations(categoryScores, weakCategories);
      setAiRecommendations(data.recommendations);
      setAiSource(data.source);
      setAiNote(data.note);
      setAiModel(data.model);

      // For analysts: Mark recommendation as generated
      if (isAnalyst) {
        await api.markRecommendationGenerated(id);
        // Update local audit state
        setAudit(prev => ({ ...prev, recommendationGenerated: true }));
      }
    } catch (err) {
      setAiError(err.response?.data?.error || 'Failed to generate AI recommendations');
    } finally {
      setLoadingAI(false);
    }
  };

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

  const handleMarkAsDone = async () => {
    if (!audit.recommendationGenerated) {
      alert('Please generate recommendations before marking as done.');
      return;
    }

    setWorkflowLoading(true);
    try {
      const response = await api.markAuditAsDone(id);
      // Update local audit state
      setAudit(prev => ({
        ...prev,
        recommendationStatus: 'done',
        reviewedByAnalyst: true,
        reviewedAt: response.data.reviewedAt
      }));
      setShowConfirmModal(false);
      alert('Audit marked as done successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark audit as done');
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    // CRITICAL: Validate audit data before proceeding
    if (!audit) {
      alert('❌ Audit data not loaded. Please refresh the page.');
      return;
    }

    // Validate required audit fields
    if (!audit.companyName || !audit.auditDate || audit.percentageScore === undefined) {
      console.error('Missing required audit fields:', {
        companyName: audit.companyName,
        auditDate: audit.auditDate,
        percentageScore: audit.percentageScore
      });
      alert('❌ Audit data is incomplete. Please refresh and try again.');
      return;
    }

    console.log('🚀 Starting PDF generation...');
    console.log('📊 Audit data:', {
      companyName: audit.companyName,
      percentageScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      hasRecommendations: !!aiRecommendations
    });
    console.log('📝 AI Recommendations:', aiRecommendations ? 'Present' : 'None');
    console.log('👤 User:', user?.name);

    setPdfLoading(true);
    try {
      const analystName = user?.name || 'Trade Secret Analyst';
      console.log('✅ Calling downloadPDFReport with analystName:', analystName);
      
      // Call the PDF generator
      const result = await downloadPDFReport(audit, aiRecommendations, analystName);
      console.log('📄 PDF generation result:', result);
      
      if (result && result.success) {
        console.log('✅ PDF generated successfully!');
        // Optional: Show success message
        // alert('✅ PDF downloaded successfully!');
      }
    } catch (err) {
      console.error('❌ PDF generation error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        audit: audit
      });
      alert(`❌ Failed to generate PDF report:\n\n${err.message || 'Unknown error'}\n\nPlease check the console for details.`);
    } finally {
      setPdfLoading(false);
      console.log('🏁 PDF generation process completed');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#ffc107', bg: '#fff3cd', label: 'Pending Review' },
      in_progress: { color: '#2196f3', bg: '#e3f2fd', label: 'In Progress' },
      done: { color: '#4caf50', bg: '#e8f5e9', label: 'Done' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        backgroundColor: badge.bg,
        color: badge.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '0.875rem',
        fontWeight: '600',
        border: `1px solid ${badge.color}`
      }}>
        {badge.label}
      </span>
    );
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {isAnalyst && audit.recommendationStatus && getStatusBadge(audit.recommendationStatus)}
              
              <button onClick={handleDelete} className="btn btn-danger btn-sm">
                Delete Audit
              </button>
            </div>
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
        {canViewRecommendations && (
          <button
            className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations ({audit.recommendations?.filter(r => r.priority === 'Critical' || r.priority === 'High').length || 0} urgent)
          </button>
        )}
        {!isLimitedView && (
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Detailed Responses
          </button>
        )}
      </div>

      {/* Role-Based Access Alerts */}
      {isLimitedView && (
        <div className="alert alert-info" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107', margin: '1rem 0' }}>
          <strong>👁️ Limited View (Analyst):</strong> You can view scores and recommendations but not the detailed question responses. This maintains separation of duties and objectivity.
        </div>
      )}
      {isAuditor && (
        <div className="alert alert-info" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #2196f3', margin: '1rem 0' }}>
          <strong>🔒 Auditor Access:</strong> You can view the overview and detailed responses. Recommendations are restricted to maintain separation of duties.
        </div>
      )}

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

        {activeTab === 'recommendations' && canViewRecommendations && (
          <div className="recommendations-tab">
            <h2>Security Recommendations</h2>
            <p className="recommendations-intro">
              Based on your audit responses, here are prioritized recommendations to improve
              your trade secret protection:
            </p>

            {/* AI Recommendations Section */}
            <div className="ai-recommendations-section">
              <div className="section-header">
                <h3>🤖 AI-Powered Recommendations</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={generateAIRecommendations} 
                    className="btn btn-primary btn-sm"
                    disabled={loadingAI}
                  >
                    {loadingAI ? 'Generating...' : aiRecommendations ? 'Regenerate' : 'Generate AI Insights'}
                  </button>
                  {isAnalyst && audit.recommendationStatus !== 'done' && (
                    <button 
                      onClick={() => setShowConfirmModal(true)} 
                      className="btn btn-success btn-sm"
                      disabled={!audit.recommendationGenerated || workflowLoading}
                      title={!audit.recommendationGenerated ? 'Generate recommendations first' : 'Mark audit as done'}
                    >
                      {workflowLoading ? 'Processing...' : '✓ Mark as Done'}
                    </button>
                  )}
                </div>
              </div>

              {aiError && (
                <div className="alert alert-error">{aiError}</div>
              )}

              {aiRecommendations && (
                <div className="ai-recommendations-box">
                  {aiSource === 'fallback' && aiNote && (
                    <div className="fallback-notice">
                      ℹ️ {aiNote}
                    </div>
                  )}
                  {aiSource === 'ai' && aiModel && (
                    <div className="model-badge">
                      ✨ Generated by {aiModel}
                    </div>
                  )}
                  <ul className="ai-recommendations-list">
                    {aiRecommendations.split('\n').filter(line => line.trim().startsWith('-')).map((rec, index) => (
                      <li key={index}>{rec.replace(/^-\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Standard Recommendations */}
            <div className="standard-recommendations-section">
              <h3>Standard Recommendations</h3>
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
        {canCreateAudits && (
          <Link to="/audit/new" className="btn btn-primary">
            Start New Audit
          </Link>
        )}
        {isAnalyst && (
          <button 
            onClick={handleDownloadPDF} 
            className="btn btn-outline"
            disabled={pdfLoading}
            title="Download formal audit report as PDF"
          >
            {pdfLoading ? '⏳ Generating...' : '📄 Download PDF'}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Completion</h3>
            <p>Are you sure the audit analysis is complete?</p>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
              This will mark the audit as <strong>Done</strong> and indicate that you have reviewed the audit summary and generated recommendations.
            </p>
            <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="btn btn-outline"
                disabled={workflowLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleMarkAsDone} 
                className="btn btn-success"
                disabled={workflowLoading}
              >
                {workflowLoading ? 'Processing...' : 'Yes, Mark as Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditResults;
