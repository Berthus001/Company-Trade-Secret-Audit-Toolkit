/**
 * Audit Routes
 * Handles audit submission, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitAudit,
  getAudits,
  getAudit,
  deleteAudit,
  getAuditSummary,
  compareAudits
} = require('../controllers/auditController');

// All routes are protected
router.use(protect);

// Audit management
router.post('/', submitAudit);
router.get('/', getAudits);
router.get('/summary', getAuditSummary);
router.get('/compare', compareAudits);
router.get('/:id', getAudit);
router.delete('/:id', deleteAudit);

module.exports = router;
