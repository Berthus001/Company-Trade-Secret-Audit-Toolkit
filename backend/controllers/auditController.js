/**
 * Audit Controller
 * Handles audit submission, retrieval, and management
 */

const Audit = require('../models/Audit');
const Question = require('../models/Question');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { processAuditScores, formatResponse } = require('../utils/scoringEngine');
const { generateRecommendations } = require('../utils/recommendationEngine');

/**
 * @desc    Submit a new audit
 * @route   POST /api/audits
 * @access  Private
 */
const submitAudit = asyncHandler(async (req, res) => {
  const { companyName, responses, notes } = req.body;

  // Validate required fields
  if (!companyName) {
    return res.status(400).json({
      success: false,
      error: 'Company name is required'
    });
  }

  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one response is required'
    });
  }

  // Get all questions to validate responses and calculate scores
  const questions = await Question.find({ isActive: true });
  const questionMap = new Map();
  questions.forEach(q => questionMap.set(q._id.toString(), q));

  // Format and validate responses
  const formattedResponses = [];
  for (const response of responses) {
    const question = questionMap.get(response.questionId);
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: `Question not found: ${response.questionId}`
      });
    }

    // Validate selected value
    const selectedValue = parseInt(response.selectedValue);
    if (isNaN(selectedValue) || selectedValue < 0 || selectedValue > 4) {
      return res.status(400).json({
        success: false,
        error: `Invalid selected value for question: ${response.questionId}`
      });
    }

    formattedResponses.push(formatResponse(question, selectedValue));
  }

  // Calculate scores
  const scoreResults = processAuditScores(formattedResponses, questions);

  // Generate recommendations
  const recommendations = generateRecommendations(scoreResults.categoryScores);

  // Create audit document
  const audit = await Audit.create({
    user: req.user._id,
    companyName,
    responses: formattedResponses,
    categoryScores: scoreResults.categoryScores,
    totalScore: scoreResults.totalScore,
    maxPossibleScore: scoreResults.maxPossibleScore,
    percentageScore: scoreResults.percentageScore,
    riskLevel: scoreResults.riskLevel,
    recommendations,
    notes: notes || '',
    status: 'completed'
  });

  res.status(201).json({
    success: true,
    data: audit
  });
});

/**
 * @desc    Get all audits for current user
 * @route   GET /api/audits
 * @access  Private
 */
const getAudits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, riskLevel, startDate, endDate } = req.query;

  // Build query
  const query = { user: req.user._id };

  if (riskLevel) {
    query.riskLevel = riskLevel;
  }

  if (startDate || endDate) {
    query.auditDate = {};
    if (startDate) query.auditDate.$gte = new Date(startDate);
    if (endDate) query.auditDate.$lte = new Date(endDate);
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const totalCount = await Audit.countDocuments(query);
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  // Get audits
  const audits = await Audit.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('companyName auditDate percentageScore riskLevel status createdAt');

  res.status(200).json({
    success: true,
    count: audits.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalCount
    },
    data: audits
  });
});

/**
 * @desc    Get single audit by ID
 * @route   GET /api/audits/:id
 * @access  Private (Owner only)
 */
const getAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id)
    .populate('user', 'name email company');

  if (!audit) {
    return res.status(404).json({
      success: false,
      error: 'Audit not found'
    });
  }

  // Check ownership
  if (audit.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this audit'
    });
  }

  res.status(200).json({
    success: true,
    data: audit
  });
});

/**
 * @desc    Delete an audit
 * @route   DELETE /api/audits/:id
 * @access  Private (Owner only)
 */
const deleteAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id);

  if (!audit) {
    return res.status(404).json({
      success: false,
      error: 'Audit not found'
    });
  }

  // Check ownership
  if (audit.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this audit'
    });
  }

  await audit.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Audit deleted successfully'
  });
});

/**
 * @desc    Get user's audit summary/statistics
 * @route   GET /api/audits/summary
 * @access  Private
 */
const getAuditSummary = asyncHandler(async (req, res) => {
  const summary = await Audit.getUserSummary(req.user._id);

  // Get recent audits
  const recentAudits = await Audit.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('companyName auditDate percentageScore riskLevel');

  res.status(200).json({
    success: true,
    data: {
      ...summary,
      recentAudits
    }
  });
});

/**
 * @desc    Compare two audits
 * @route   GET /api/audits/compare
 * @access  Private
 */
const compareAudits = asyncHandler(async (req, res) => {
  const { audit1, audit2 } = req.query;

  if (!audit1 || !audit2) {
    return res.status(400).json({
      success: false,
      error: 'Please provide two audit IDs to compare'
    });
  }

  const audits = await Audit.find({
    _id: { $in: [audit1, audit2] },
    user: req.user._id
  }).select('companyName auditDate categoryScores totalScore percentageScore riskLevel');

  if (audits.length !== 2) {
    return res.status(404).json({
      success: false,
      error: 'One or both audits not found or not authorized'
    });
  }

  // Calculate differences
  const comparison = {
    audit1: audits[0],
    audit2: audits[1],
    differences: {
      totalScore: audits[1].totalScore - audits[0].totalScore,
      percentageScore: audits[1].percentageScore - audits[0].percentageScore,
      categoryScores: {}
    }
  };

  // Calculate category differences
  const categories = ['accessControl', 'dataEncryption', 'employeePolicies', 'physicalSecurity'];
  categories.forEach(cat => {
    comparison.differences.categoryScores[cat] = 
      audits[1].categoryScores[cat].percentage - audits[0].categoryScores[cat].percentage;
  });

  res.status(200).json({
    success: true,
    data: comparison
  });
});

module.exports = {
  submitAudit,
  getAudits,
  getAudit,
  deleteAudit,
  getAuditSummary,
  compareAudits
};
