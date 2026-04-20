/**
 * Recommendation Card Component
 * Displays a single recommendation with actions
 */

import React, { useState } from 'react';

const RecommendationCard = ({ recommendation }) => {
  const [expanded, setExpanded] = useState(false);

  const priorityConfig = {
    Critical: { className: 'priority-critical', icon: '🔴' },
    High: { className: 'priority-high', icon: '🟠' },
    Medium: { className: 'priority-medium', icon: '🟡' },
    Low: { className: 'priority-low', icon: '🟢' }
  };

  const { className, icon } = priorityConfig[recommendation.priority] || priorityConfig.Medium;

  return (
    <div className={`recommendation-card ${className}`}>
      <div className="recommendation-header" onClick={() => setExpanded(!expanded)}>
        <div className="recommendation-meta">
          <span className="recommendation-icon">{icon}</span>
          <span className="recommendation-priority">{recommendation.priority}</span>
          <span className="recommendation-category">{recommendation.category}</span>
        </div>
        <h4 className="recommendation-title">{recommendation.title}</h4>
        <button className="expand-btn">
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="recommendation-body">
          <p className="recommendation-description">{recommendation.description}</p>
          <div className="recommendation-actions">
            <h5>Recommended Actions:</h5>
            <ul>
              {recommendation.actions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
