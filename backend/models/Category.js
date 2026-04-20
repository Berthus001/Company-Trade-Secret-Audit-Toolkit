/**
 * Category Model
 * Defines the schema for audit categories
 * Optional model for cleaner structure
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    enum: {
      values: ['Access Control', 'Data Encryption', 'Employee Policies', 'Physical Security'],
      message: '{VALUE} is not a valid category'
    }
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: '📋'
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for ordering
categorySchema.index({ order: 1 });

/**
 * Static method to get all active categories in order
 */
categorySchema.statics.getActiveCategories = async function() {
  return await this.find({ isActive: true }).sort({ order: 1 });
};

// Default categories data
categorySchema.statics.getDefaultCategories = function() {
  return [
    {
      name: 'Access Control',
      description: 'Measures controlling who can access trade secret information, including authentication, authorization, and access management systems.',
      icon: '🔐',
      order: 1
    },
    {
      name: 'Data Encryption',
      description: 'Protection of trade secret data through encryption at rest and in transit, including key management practices.',
      icon: '🔒',
      order: 2
    },
    {
      name: 'Employee Policies',
      description: 'Human resource policies including NDAs, training programs, onboarding/offboarding procedures, and security awareness.',
      icon: '👥',
      order: 3
    },
    {
      name: 'Physical Security',
      description: 'Physical protection measures including facility security, visitor management, and secure document handling.',
      icon: '🏢',
      order: 4
    }
  ];
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
