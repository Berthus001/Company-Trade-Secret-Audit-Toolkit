/**
 * Audit Routes
 * Handles audit submission, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const { 
  protect, 
  allowRoles, 
  blockAuditorsFromRecommendations,
  blockAnalystsFromAuditDetails 
} = require('../middleware/authMiddleware');
const {
  submitAudit,
  getMyAudits,
  getAllAudits,
  getAudit,
  deleteAudit,
  getAuditSummary,
  compareAudits,
  generateAIRecommendations,
  getAuditCount,
  markRecommendationGenerated,
  markAuditAsDone
} = require('../controllers/auditController');

// All routes are protected
router.use(protect);

// Audit management
// Auditors, admins, and superadmins can create audits
router.post('/', allowRoles('auditor', 'admin', 'superadmin'), submitAudit);

// Get all audits (admin/superadmin only)
router.get('/', allowRoles('admin', 'superadmin'), getAllAudits);

// Get current user's audits (auditors see own, analysts see company audits)
router.get('/my', allowRoles('auditor', 'analyst', 'admin', 'superadmin'), getMyAudits);

// Get audit summary for current user
router.get('/summary', allowRoles('auditor', 'analyst', 'admin', 'superadmin'), getAuditSummary);
router.get('/count', allowRoles('auditor', 'analyst', 'admin', 'superadmin'), getAuditCount);
router.get('/compare', allowRoles('auditor', 'admin', 'superadmin'), compareAudits);

// Get single audit - analysts get LIMITED VIEW (no detailed answers)
router.get('/:id', allowRoles('auditor', 'analyst', 'admin', 'superadmin'), getAudit);

// Delete audit - auditors and admins only
router.delete('/:id', allowRoles('auditor', 'admin', 'superadmin'), deleteAudit);

// AI Recommendations - auditors are blocked from this
router.post('/recommendations', blockAuditorsFromRecommendations, generateAIRecommendations);

// Recommendation workflow (analyst only)
router.patch('/:id/recommendation-generated', allowRoles('analyst'), markRecommendationGenerated);
router.patch('/:id/mark-done', allowRoles('analyst'), markAuditAsDone);

module.exports = router;
