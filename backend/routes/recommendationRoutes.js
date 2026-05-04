/**
 * Recommendation Routes
 * Handles recommendation generation based on scores
 */

const express = require('express');
const router = express.Router();
const { protect, blockAuditorsFromRecommendations } = require('../middleware/authMiddleware');
const {
  getRecommendations,
  getActionableRecommendations,
  getRecommendationRules
} = require('../controllers/recommendationController');

// Public route for rules documentation
router.get('/rules', getRecommendationRules);

// Protected routes - analysts can access, auditors cannot
router.post('/', protect, blockAuditorsFromRecommendations, getRecommendations);
router.post('/actionable', protect, blockAuditorsFromRecommendations, getActionableRecommendations);

module.exports = router;
