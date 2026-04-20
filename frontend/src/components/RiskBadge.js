/**
 * Risk Badge Component
 * Displays risk level with appropriate styling
 */

import React from 'react';

const RiskBadge = ({ level, showLabel = true }) => {
  const config = {
    Low: {
      className: 'risk-low',
      icon: '✓',
      description: 'Strong Protection'
    },
    Medium: {
      className: 'risk-medium',
      icon: '!',
      description: 'Needs Improvement'
    },
    High: {
      className: 'risk-high',
      icon: '✗',
      description: 'Vulnerable'
    }
  };

  const { className, icon, description } = config[level] || config.High;

  return (
    <div className={`risk-badge ${className}`}>
      <span className="risk-badge-icon">{icon}</span>
      <span className="risk-badge-level">{level} Risk</span>
      {showLabel && <span className="risk-badge-description">{description}</span>}
    </div>
  );
};

export default RiskBadge;
