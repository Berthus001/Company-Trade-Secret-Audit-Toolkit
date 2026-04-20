/**
 * Question Model
 * Defines the schema for audit questions with multi-level scoring options
 */

const mongoose = require('mongoose');

// Sub-schema for answer options
const optionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    enum: ['Very Good', 'Good', 'Decent', 'Bad', 'Very Bad']
  },
  value: {
    type: Number,
    required: true,
    min: 0,
    max: 4
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Question category is required'],
    enum: {
      values: ['Access Control', 'Data Encryption', 'Employee Policies', 'Physical Security'],
      message: '{VALUE} is not a valid category'
    }
  },
  text: {
    type: String,
    required: [true, 'Question text is required'],
    maxlength: [500, 'Question text cannot exceed 500 characters']
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(v) {
        return v && v.length === 5; // Must have exactly 5 options
      },
      message: 'Question must have exactly 5 options'
    }
  },
  weight: {
    type: Number,
    default: 1,
    min: [1, 'Weight must be at least 1'],
    max: [3, 'Weight cannot exceed 3']
  },
  order: {
    type: Number,
    required: [true, 'Display order is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient category-based queries
questionSchema.index({ category: 1, order: 1 });
questionSchema.index({ isActive: 1 });

/**
 * Static method to get questions grouped by category
 * @returns {Object} Questions organized by category
 */
questionSchema.statics.getGroupedByCategory = async function() {
  const questions = await this.find({ isActive: true }).sort({ category: 1, order: 1 });
  
  const grouped = {
    'Access Control': [],
    'Data Encryption': [],
    'Employee Policies': [],
    'Physical Security': []
  };

  questions.forEach(question => {
    if (grouped[question.category]) {
      grouped[question.category].push(question);
    }
  });

  return grouped;
};

/**
 * Static method to calculate max possible score for a category
 * @param {string} category - Category name
 * @returns {number} Maximum possible score
 */
questionSchema.statics.getMaxScoreByCategory = async function(category) {
  const questions = await this.find({ category, isActive: true });
  return questions.reduce((total, q) => total + (4 * q.weight), 0); // Max value is 4
};

/**
 * Static method to get total max possible score
 * @returns {number} Total maximum possible score
 */
questionSchema.statics.getTotalMaxScore = async function() {
  const questions = await this.find({ isActive: true });
  return questions.reduce((total, q) => total + (4 * q.weight), 0);
};

module.exports = mongoose.model('Question', questionSchema);
