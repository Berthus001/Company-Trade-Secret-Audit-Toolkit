/**
 * Audit Routes
 * Handles audit submission, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const {
  submitAudit,
  getMyAudits,
  getAllAudits,
  getAudit,
  deleteAudit,
  getAuditSummary,
  compareAudits,
  generateAIRecommendations
} = require('../controllers/auditController');

// All routes are protected
router.use(protect);

// Audit management
router.post('/', submitAudit);

// Get all audits (admin/superadmin only)
router.get('/', allowRoles('admin', 'superadmin'), getAllAudits);

// Get current user's audits (all roles)
router.get('/my', getMyAudits);

router.get('/summary', getAuditSummary);
router.get('/compare', compareAudits);
router.get('/:id', getAudit);
router.delete('/:id', deleteAudit);

// AI Recommendations
router.post('/recommendations', generateAIRecommendations);

module.exports = router;
