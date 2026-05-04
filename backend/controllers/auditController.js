/**
 * Audit Controller
 * Handles audit submission, retrieval, and management
 */

const Audit = require('../models/Audit');
const Question = require('../models/Question');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { processAuditScores, formatResponse } = require('../utils/scoringEngine');
const { generateRecommendations } = require('../utils/recommendationEngine');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
 * @route   GET /api/audits/my
 * @access  Private (Auditors see their own, Analysts see company audits)
 */
const getMyAudits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, riskLevel, startDate, endDate } = req.query;

  // Build query based on role
  let query = {};
  
  if (req.user.role === 'analyst') {
    // Analysts can see all audits from users in their company
    // First, find all users in the same company
    const companyUsers = await User.find({ company: req.user.company }).select('_id');
    const companyUserIds = companyUsers.map(user => user._id);
    
    // Query audits by these user IDs
    query = { user: { $in: companyUserIds } };
  } else {
    // Auditors and others see only their own audits
    query = { user: req.user._id };
  }

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

  // Get audits with user population
  const audits = await Audit.find(query)
    .populate('user', 'name email company')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('companyName auditDate percentageScore riskLevel status createdAt user recommendationStatus recommendationGenerated reviewedByAnalyst reviewedAt');

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
 * @desc    Get all audits (admin/superadmin only)
 * @route   GET /api/audits
 * @access  Private/Admin/Superadmin
 */
const getAllAudits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, riskLevel, startDate, endDate, userId } = req.query;

  // Build query - admins can see all audits
  const query = {};

  if (userId) {
    query.user = userId;
  }

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

  // Get audits with user details
  const audits = await Audit.find(query)
    .populate('user', 'name email company')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('companyName auditDate percentageScore riskLevel status createdAt user recommendationStatus recommendationGenerated reviewedByAnalyst reviewedAt');

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
 * @access  Private (Owner, Admin, or Analyst from same company)
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

  // Check ownership OR admin role OR analyst from same company
  const isOwner = audit.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
  const isAnalystSameCompany = req.user.role === 'analyst' && audit.user.company === req.user.company;

  if (!isOwner && !isAdmin && !isAnalystSameCompany) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to access this audit'
    });
  }

  // For analysts, return LIMITED VIEW - hide detailed question responses
  if (req.user.role === 'analyst') {
    // Auto-update status to in_progress when analyst opens it (if still pending)
    if (audit.recommendationStatus === 'pending') {
      audit.recommendationStatus = 'in_progress';
      await audit.save();
    }

    const limitedAudit = {
      _id: audit._id,
      companyName: audit.companyName,
      auditDate: audit.auditDate,
      categoryScores: audit.categoryScores,
      totalScore: audit.totalScore,
      maxPossibleScore: audit.maxPossibleScore,
      percentageScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      recommendations: audit.recommendations,
      notes: audit.notes,
      status: audit.status,
      createdAt: audit.createdAt,
      user: audit.user,
      // Recommendation workflow fields
      recommendationStatus: audit.recommendationStatus,
      recommendationGenerated: audit.recommendationGenerated,
      reviewedByAnalyst: audit.reviewedByAnalyst,
      reviewedAt: audit.reviewedAt,
      // responses field is intentionally excluded
      limitedView: true // Flag to indicate this is limited view
    };
    
    return res.status(200).json({
      success: true,
      data: limitedAudit
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
 * @access  Private (Owner or Admin)
 */
const deleteAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id);

  if (!audit) {
    return res.status(404).json({
      success: false,
      error: 'Audit not found'
    });
  }

  // Check ownership OR admin role
  const isOwner = audit.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

  if (!isOwner && !isAdmin) {
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
 * @returns All audits for admins/superadmins, only user's audits for others
 */
const getAuditSummary = asyncHandler(async (req, res) => {
  // Admins and superadmins see ALL audits, others see only their own
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  const query = isAdmin ? {} : { user: req.user._id };

  // Get audits based on role
  const audits = await Audit.find(query);
  
  // Calculate summary statistics
  let summary;
  if (audits.length === 0) {
    summary = {
      totalAudits: 0,
      averageScore: 0,
      riskDistribution: { Low: 0, Medium: 0, High: 0 }
    };
  } else {
    const totalAudits = audits.length;
    const averageScore = audits.reduce((sum, a) => sum + a.percentageScore, 0) / totalAudits;
    
    const riskDistribution = audits.reduce((dist, a) => {
      dist[a.riskLevel] = (dist[a.riskLevel] || 0) + 1;
      return dist;
    }, { Low: 0, Medium: 0, High: 0 });

    summary = {
      totalAudits,
      averageScore: Math.round(averageScore * 10) / 10,
      riskDistribution
    };
  }

  // Get recent audits
  const recentAudits = await Audit.find(query)
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
 * @access  Private (Owner or Admin)
 */
const compareAudits = asyncHandler(async (req, res) => {
  const { audit1, audit2 } = req.query;

  if (!audit1 || !audit2) {
    return res.status(400).json({
      success: false,
      error: 'Please provide two audit IDs to compare'
    });
  }

  // Admins can compare any audits, users can only compare their own
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
  const query = isAdmin 
    ? { _id: { $in: [audit1, audit2] } }
    : { _id: { $in: [audit1, audit2] }, user: req.user._id };

  const audits = await Audit.find(query)
    .select('companyName auditDate categoryScores totalScore percentageScore riskLevel');

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

/**
 * @desc    Generate AI recommendations using Gemini
 * @route   POST /api/recommendations
 * @access  Private
 */
const generateAIRecommendations = async (req, res) => {
  const { categoryScores, weakCategories } = req.body;

  // Validate input
  if (!categoryScores || !weakCategories) {
    return res.status(400).json({
      success: false,
      error: 'categoryScores and weakCategories are required'
    });
  }

  // Fallback recommendations if all AI models fail
  const fallbackRecommendations = `- Implement Multi-Factor Authentication (MFA) for all systems accessing trade secrets
- Enforce Role-Based Access Control (RBAC) with least privilege principles
- Enable AES-256 encryption for all data at rest containing sensitive information
- Deploy end-to-end encryption for all data transmissions
- Establish mandatory security awareness training for all employees handling trade secrets
- Configure automated access revocation within 24 hours of employee termination
- Install Data Loss Prevention (DLP) tools to monitor and block unauthorized data transfers
- Implement centralized logging with real-time alerting for suspicious activities`;

  // Models to try in order (from fastest/cheapest to most capable)
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro'
  ];

  // Build prompt
  const prompt = `You are a cybersecurity expert analyzing trade secret protection audit results.

INPUT DATA:
Category Scores:
${Object.entries(categoryScores).map(([category, data]) => 
  `- ${category}: ${data.score}% (${data.earnedPoints}/${data.maxPoints} points)`
).join('\n')}

Weak Categories Requiring Attention:
${weakCategories.map(cat => `- ${cat}`).join('\n')}

OUTPUT REQUIREMENTS:
Generate 6-8 critical security recommendations as bullet points.

STRICT RULES:
1. Output ONLY bullet points - no headers, no explanations, no introductions, no conclusions
2. Start each bullet with a dash (-)
3. Begin each recommendation with an action verb: Implement, Enforce, Restrict, Enable, Deploy, Establish, Configure, Mandate, Review, Audit, Monitor, Update, Install, Require
4. Focus ONLY on these areas:
   - Access Control (RBAC, authentication, authorization, permissions)
   - Encryption (data at rest, data in transit, key management)
   - Security Policies (NDAs, training, data classification, incident response)
   - Monitoring & Auditing (logging, SIEM, alerts, compliance checks)
5. Be specific and actionable
6. Prioritize recommendations based on weakest categories first
7. Each recommendation must be one concise sentence

DO NOT:
- Add any text before or after the bullet points
- Number the recommendations
- Add categories or section headers
- Provide explanations or reasoning
- Use conversational language

EXAMPLE FORMAT (DO NOT copy these, generate new ones based on INPUT DATA):
- Implement Multi-Factor Authentication (MFA) for all users accessing trade secret systems
- Enforce strict Role-Based Access Control with quarterly permission reviews
- Enable end-to-end encryption for all data transmissions containing sensitive information
- Deploy centralized logging system with real-time alerting for unauthorized access attempts
- Establish mandatory annual security awareness training for all employees
- Restrict USB device usage on systems containing trade secrets

Generate recommendations NOW:`;

  // Try each model in cascade
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const recommendations = response.text();

      console.log(`✓ Success with model: ${modelName}`);
      return res.status(200).json({
        success: true,
        data: {
          recommendations: recommendations.trim(),
          source: 'ai',
          model: modelName
        }
      });

    } catch (error) {
      console.error(`✗ ${modelName} failed:`, error.message);
      // Continue to next model
    }
  }

  // All models failed - return fallback
  console.log('All AI models failed. Using fallback recommendations.');
  res.status(200).json({
    success: true,
    data: {
      recommendations: fallbackRecommendations,
      source: 'fallback',
      note: 'AI service temporarily unavailable. Showing general security recommendations.'
    }
  });
};

/**
 * @desc    Get audit count (with ownership filtering)
 * @route   GET /api/audits/count
 * @access  Private (Auditor/Admin/Superadmin)
 * @ownership Regular users and auditors only count their own audits; Admins/Superadmins count all
 */
const getAuditCount = asyncHandler(async (req, res) => {
  // Build query based on user role
  let query = {};
  
  if (req.user.role === 'analyst') {
    // Analysts count all audits from users in their company
    const companyUsers = await User.find({ company: req.user.company }).select('_id');
    const companyUserIds = companyUsers.map(user => user._id);
    query.user = { $in: companyUserIds };
  } else if (!['admin', 'superadmin'].includes(req.user.role)) {
    // Regular users and auditors can only count their own audits
    query.user = req.user._id;
  }
  // Admins and superadmins count all audits (no filter)

  const count = await Audit.countDocuments(query);

  res.status(200).json({
    success: true,
    count: count
  });
});

/**
 * @desc    Mark audit recommendation as generated (analyst workflow)
 * @route   PATCH /api/audits/:id/recommendation-generated
 * @access  Private (Analyst only)
 */
const markRecommendationGenerated = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id).populate('user', 'company');

  if (!audit) {
    return res.status(404).json({
      success: false,
      error: 'Audit not found'
    });
  }

  // Only analysts from the same company can mark recommendations
  if (req.user.role !== 'analyst' || audit.user.company !== req.user.company) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this audit'
    });
  }

  // Update recommendation generated flag
  audit.recommendationGenerated = true;
  await audit.save();

  res.status(200).json({
    success: true,
    message: 'Recommendation marked as generated',
    data: {
      recommendationGenerated: audit.recommendationGenerated
    }
  });
});

/**
 * @desc    Mark audit as done (analyst workflow)
 * @route   PATCH /api/audits/:id/mark-done
 * @access  Private (Analyst only)
 */
const markAuditAsDone = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id).populate('user', 'company');

  if (!audit) {
    return res.status(404).json({
      success: false,
      error: 'Audit not found'
    });
  }

  // Only analysts from the same company can mark as done
  if (req.user.role !== 'analyst' || audit.user.company !== req.user.company) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to update this audit'
    });
  }

  // Check if recommendation has been generated
  if (!audit.recommendationGenerated) {
    return res.status(400).json({
      success: false,
      error: 'Cannot mark as done. Please generate recommendations first.'
    });
  }

  // Update audit status to done
  audit.recommendationStatus = 'done';
  audit.reviewedByAnalyst = true;
  audit.reviewedAt = new Date();
  await audit.save();

  res.status(200).json({
    success: true,
    message: 'Audit marked as done',
    data: {
      recommendationStatus: audit.recommendationStatus,
      reviewedByAnalyst: audit.reviewedByAnalyst,
      reviewedAt: audit.reviewedAt
    }
  });
});

module.exports = {
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
};
