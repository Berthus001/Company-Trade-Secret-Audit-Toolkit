/**
 * Example Usage: Gemini AI Integration
 * 
 * This file demonstrates how to use the Gemini service in your audit controller
 */

const {
  analyzeAuditResponses,
  generateCategoryRecommendations,
  generateExecutiveSummary,
  testConnection
} = require('../services/gemini');

// ============================================
// EXAMPLE 1: Generate AI Insights for Audit
// ============================================

/**
 * @desc    Generate AI-powered insights for an existing audit
 * @route   POST /api/audits/:id/ai-insights
 * @access  Private
 * 
 * Add this to your auditController.js:
 */
const generateAIInsights = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id)
      .populate('user', 'name email company');

    if (!audit) {
      return res.status(404).json({
        success: false,
        error: 'Audit not found'
      });
    }

    // Check authorization (owner or admin)
    const isOwner = audit.user._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this audit'
      });
    }

    // Prepare audit data for AI analysis
    const auditData = {
      companyName: audit.companyName,
      overallScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      categoryScores: audit.categoryScores,
      answers: audit.responses.map(response => ({
        questionText: response.questionText,
        category: response.category,
        selectedOption: response.selectedOption
      }))
    };

    // Generate AI insights
    const insights = await analyzeAuditResponses(auditData);

    // Optionally save insights to audit
    audit.aiInsights = insights;
    audit.aiGeneratedAt = new Date();
    await audit.save();

    res.status(200).json({
      success: true,
      data: {
        auditId: audit._id,
        insights,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI insights'
    });
  }
};

// ============================================
// EXAMPLE 2: Category-Specific Recommendations
// ============================================

/**
 * @desc    Get AI recommendations for weak categories
 * @route   POST /api/audits/:id/category-recommendations
 * @access  Private
 */
const getCategoryRecommendations = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' });
    }

    // Generate recommendations for weak categories
    const recommendations = await generateCategoryRecommendations(audit.categoryScores);

    res.status(200).json({
      success: true,
      data: { recommendations }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// EXAMPLE 3: Executive Summary Generation
// ============================================

/**
 * @desc    Generate executive summary for audit
 * @route   POST /api/audits/:id/executive-summary
 * @access  Private
 */
const getExecutiveSummary = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' });
    }

    const summary = await generateExecutiveSummary({
      companyName: audit.companyName,
      overallScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      categoryScores: audit.categoryScores,
      completedAt: audit.createdAt
    });

    res.status(200).json({
      success: true,
      data: { summary }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// EXAMPLE 4: Test Gemini Connection
// ============================================

/**
 * @desc    Test Gemini API connection
 * @route   GET /api/test/gemini
 * @access  Private/Admin
 */
const testGeminiConnection = async (req, res) => {
  try {
    const isConnected = await testConnection();

    res.status(200).json({
      success: true,
      data: {
        geminiConnected: isConnected,
        message: isConnected 
          ? 'Gemini API is connected and working' 
          : 'Failed to connect to Gemini API'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// EXAMPLE 5: Integrate into Existing submitAudit
// ============================================

/**
 * Modified submitAudit function with optional AI insights
 * 
 * Add this code AFTER creating the audit in your existing submitAudit function:
 */

/*
// ... existing submitAudit code ...

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

// OPTIONAL: Generate AI insights automatically (if enabled)
if (req.body.generateAIInsights === true) {
  try {
    const auditData = {
      companyName: audit.companyName,
      overallScore: audit.percentageScore,
      riskLevel: audit.riskLevel,
      categoryScores: audit.categoryScores,
      answers: audit.responses.map(response => ({
        questionText: response.questionText,
        category: response.category,
        selectedOption: response.selectedOption
      }))
    };

    const insights = await analyzeAuditResponses(auditData);
    
    // Save AI insights to audit
    audit.aiInsights = insights;
    audit.aiGeneratedAt = new Date();
    await audit.save();

  } catch (error) {
    console.error('AI Insights Generation Failed:', error);
    // Don't fail the audit submission if AI fails
  }
}

res.status(201).json({
  success: true,
  data: audit
});
*/

// ============================================
// EXPORT FUNCTIONS
// ============================================

module.exports = {
  generateAIInsights,
  getCategoryRecommendations,
  getExecutiveSummary,
  testGeminiConnection
};

// ============================================
// ROUTE DEFINITIONS (Add to auditRoutes.js)
// ============================================

/*
const {
  generateAIInsights,
  getCategoryRecommendations,
  getExecutiveSummary,
  testGeminiConnection
} = require('../controllers/auditController');

// AI-powered insights
router.post('/audits/:id/ai-insights', protect, generateAIInsights);
router.post('/audits/:id/category-recommendations', protect, getCategoryRecommendations);
router.post('/audits/:id/executive-summary', protect, getExecutiveSummary);

// Test endpoint (admin only)
router.get('/test/gemini', protect, allowRoles('admin', 'superadmin'), testGeminiConnection);
*/
