/**
 * Audit Form Page
 * Multi-step form for completing an audit
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Loading from '../components/Loading';
import QuestionCard from '../components/QuestionCard';

const CATEGORIES = [
  'Access Control',
  'Data Encryption',
  'Employee Policies',
  'Physical Security'
];

const AuditForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState({});
  const [currentCategory, setCurrentCategory] = useState(0);
  const [responses, setResponses] = useState({});
  const [companyName, setCompanyName] = useState(user?.company || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await api.getQuestions();
        setQuestions(data);
        
        // Initialize responses
        const initialResponses = {};
        Object.values(data).flat().forEach(q => {
          initialResponses[q._id] = null;
        });
        setResponses(initialResponses);
      } catch (err) {
        // If no questions, try to seed them
        if (err.response?.status === 404 || Object.keys(questions).length === 0) {
          try {
            await api.seedQuestions();
            const data = await api.getQuestions();
            setQuestions(data);
          } catch (seedErr) {
            setError('Failed to load questions. Please try again.');
          }
        } else {
          setError('Failed to load questions. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const getCurrentQuestions = () => {
    return questions[CATEGORIES[currentCategory]] || [];
  };

  const getCategoryProgress = (categoryIndex) => {
    const categoryQuestions = questions[CATEGORIES[categoryIndex]] || [];
    const answered = categoryQuestions.filter(q => responses[q._id] !== null).length;
    return { answered, total: categoryQuestions.length };
  };

  const getTotalProgress = () => {
    const allQuestions = Object.values(questions).flat();
    const answered = allQuestions.filter(q => responses[q._id] !== null).length;
    return { answered, total: allQuestions.length };
  };

  const canProceed = () => {
    const categoryQuestions = getCurrentQuestions();
    return categoryQuestions.every(q => responses[q._id] !== null);
  };

  const handleNext = () => {
    if (currentCategory < CATEGORIES.length - 1) {
      setCurrentCategory(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentCategory > 0) {
      setCurrentCategory(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    const totalProgress = getTotalProgress();
    if (totalProgress.answered < totalProgress.total) {
      setError('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const auditData = {
        companyName: companyName.trim(),
        responses: Object.entries(responses).map(([questionId, value]) => ({
          questionId,
          selectedValue: value
        }))
      };

      const result = await api.submitAudit(auditData);
      navigate(`/audit/${result._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit audit');
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading audit questions..." />;

  const currentQuestions = getCurrentQuestions();
  const totalProgress = getTotalProgress();
  const isLastCategory = currentCategory === CATEGORIES.length - 1;

  return (
    <div className="audit-form-page">
      <div className="page-header">
        <h1>Trade Secret Audit</h1>
        <p className="header-subtitle">
          Evaluate your organization's trade secret protection measures
        </p>
      </div>

      {/* Company Name Input */}
      <div className="company-input-section">
        <label htmlFor="companyName">Company Being Audited:</label>
        <input
          type="text"
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter company name"
          className="company-input"
          data-testid="audit-company-input"
        />
      </div>

      {/* Progress Bar */}
      <div className="audit-progress" data-testid="audit-progress-bar">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(totalProgress.answered / totalProgress.total) * 100}%` }}
          ></div>
        </div>
        <span className="progress-text">
          {totalProgress.answered} of {totalProgress.total} questions answered
        </span>
      </div>

      {/* Category Navigation */}
      <div className="category-nav">
        {CATEGORIES.map((category, index) => {
          const progress = getCategoryProgress(index);
          const isComplete = progress.answered === progress.total;
          const isCurrent = index === currentCategory;

          return (
            <button
              key={category}
              className={`category-tab ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              onClick={() => setCurrentCategory(index)}
            >
              <span className="category-name">{category}</span>
              <span className="category-progress">
                {progress.answered}/{progress.total}
              </span>
            </button>
          );
        })}
      </div>

      {error && <div className="alert alert-error" data-testid="audit-error-message">{error}</div>}

      {/* Questions */}
      <div className="questions-section">
        <h2 className="category-title" data-testid="audit-category-title">{CATEGORIES[currentCategory]}</h2>
        
        {currentQuestions.map((question) => (
          <QuestionCard
            key={question._id}
            question={question}
            selectedValue={responses[question._id]}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="form-actions">
        <button
          className="btn btn-outline"
          onClick={handlePrevious}
          disabled={currentCategory === 0}
          data-testid="audit-previous-button"
        >
          ← Previous
        </button>

        {isLastCategory ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={submitting || totalProgress.answered < totalProgress.total}
            data-testid="audit-submit-button"
          >
            {submitting ? 'Submitting...' : 'Submit Audit'}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canProceed()}
            data-testid="audit-next-button"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default AuditForm;
