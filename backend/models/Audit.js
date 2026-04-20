/**
 * Audit Model
 * Defines the schema for completed audit assessments
 */

const mongoose = require('mongoose');

// Sub-schema for individual responses
const responseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  selectedOption: {
    label: String,
    value: Number,
    description: String
  },
  weight: {
    type: Number,
    default: 1
  },
  score: {
    type: Number,
    required: true
  }
}, { _id: false });

// Sub-schema for category scores
const categoryScoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

// Sub-schema for recommendations
const recommendationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  actions: [{
    type: String
  }]
}, { _id: false });

const auditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  auditDate: {
    type: Date,
    default: Date.now
  },
  responses: {
    type: [responseSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one response is required'
    }
  },
  categoryScores: {
    accessControl: categoryScoreSchema,
    dataEncryption: categoryScoreSchema,
    employeePolicies: categoryScoreSchema,
    physicalSecurity: categoryScoreSchema
  },
  totalScore: {
    type: Number,
    required: true,
    min: 0
  },
  maxPossibleScore: {
    type: Number,
    required: true,
    min: 0
  },
  percentageScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: '{VALUE} is not a valid risk level'
    },
    required: true
  },
  recommendations: [recommendationSchema],
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'completed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
auditSchema.index({ user: 1, createdAt: -1 });
auditSchema.index({ companyName: 1 });
auditSchema.index({ riskLevel: 1, createdAt: -1 });
auditSchema.index({ status: 1 });

/**
 * Static method to get user's audit summary
 * @param {ObjectId} userId - User's ID
 * @returns {Object} Summary statistics
 */
auditSchema.statics.getUserSummary = async function(userId) {
  const audits = await this.find({ user: userId });
  
  if (audits.length === 0) {
    return {
      totalAudits: 0,
      averageScore: 0,
      riskDistribution: { Low: 0, Medium: 0, High: 0 }
    };
  }

  const totalAudits = audits.length;
  const averageScore = audits.reduce((sum, a) => sum + a.percentageScore, 0) / totalAudits;
  
  const riskDistribution = audits.reduce((dist, a) => {
    dist[a.riskLevel] = (dist[a.riskLevel] || 0) + 1;
    return dist;
  }, { Low: 0, Medium: 0, High: 0 });

  return {
    totalAudits,
    averageScore: Math.round(averageScore * 10) / 10,
    riskDistribution
  };
};

/**
 * Virtual for formatted audit date
 */
auditSchema.virtual('formattedDate').get(function() {
  return this.auditDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Ensure virtuals are included in JSON output
auditSchema.set('toJSON', { virtuals: true });
auditSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Audit', auditSchema);
