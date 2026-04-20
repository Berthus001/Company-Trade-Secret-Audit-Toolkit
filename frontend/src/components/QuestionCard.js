/**
 * Question Card Component
 * Displays a question with rating options
 */

import React from 'react';

const QuestionCard = ({ question, selectedValue, onSelect }) => {
  return (
    <div className="question-card">
      <div className="question-text">
        <span className="question-number">Q{question.order}.</span>
        {question.text}
        {question.weight > 1 && (
          <span className="question-weight" title="This question has higher weight">
            ×{question.weight}
          </span>
        )}
      </div>

      <div className="question-options">
        {question.options.map((option) => (
          <button
            key={option.value}
            className={`option-btn ${selectedValue === option.value ? 'selected' : ''} option-${option.value}`}
            onClick={() => onSelect(question._id, option.value)}
            title={option.description}
          >
            <span className="option-label">{option.label}</span>
            <span className="option-description">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
