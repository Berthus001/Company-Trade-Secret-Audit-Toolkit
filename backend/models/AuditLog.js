/**
 * AuditLog Model
 * Tracks user activity for security and compliance purposes
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: [
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_UPDATE',
        'CREATE_AUDIT',
        'VIEW_AUDIT',
        'DELETE_AUDIT',
        'EXPORT_AUDIT',
        'SEED_QUESTIONS',
        'PASSWORD_CHANGE',
        'FAILED_LOGIN'
      ],
      message: '{VALUE} is not a valid action'
    }
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  resourceType: {
    type: String,
    enum: ['User', 'Audit', 'Question', 'Category', null],
    default: null
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

/**
 * Static method to log an action
 * @param {Object} logData - Log entry data
 */
auditLogSchema.statics.logAction = async function(logData) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error('Failed to create audit log:', error.message);
    // Don't throw - logging should not break the main flow
    return null;
  }
};

/**
 * Static method to get user activity
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 */
auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const { limit = 50, page = 1, action = null } = options;
  
  const query = { userId };
  if (action) query.action = action;
  
  return await this.find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

/**
 * Static method to get recent activity across all users
 * @param {Object} options - Query options
 */
auditLogSchema.statics.getRecentActivity = async function(options = {}) {
  const { limit = 100, hours = 24 } = options;
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await this.find({ timestamp: { $gte: since } })
    .populate('userId', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
