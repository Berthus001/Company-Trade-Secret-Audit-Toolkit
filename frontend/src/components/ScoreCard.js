/**
 * Score Card Component
 * Displays category or total score with visual indicator
 */

import React from 'react';

const ScoreCard = ({ title, score, maxScore, percentage, size = 'medium' }) => {
  const getColorClass = (pct) => {
    if (pct >= 75) return 'score-low-risk';
    if (pct >= 50) return 'score-medium-risk';
    return 'score-high-risk';
  };

  const colorClass = getColorClass(percentage);

  return (
    <div className={`score-card score-card-${size}`}>
      <h4 className="score-card-title">{title}</h4>
      <div className={`score-card-value ${colorClass}`}>
        {percentage}%
      </div>
      <div className="score-card-details">
        {score} / {maxScore} points
      </div>
      <div className="score-bar">
        <div
          className={`score-bar-fill ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ScoreCard;
