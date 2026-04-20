/**
 * Question Routes
 * Handles audit question retrieval and seeding
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getQuestions,
  getQuestion,
  seedQuestions,
  getQuestionsList
} = require('../controllers/questionController');

// Protected routes
router.get('/', protect, getQuestions);
router.get('/list', protect, getQuestionsList);
router.post('/seed', protect, seedQuestions);
router.get('/:id', protect, getQuestion);

module.exports = router;
