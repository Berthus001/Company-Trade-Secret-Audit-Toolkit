/**
 * Recommendation Controller
 * Provides standalone recommendation generation
 */

const { asyncHandler } = require('../middleware/errorMiddleware');
const { generateRecommendations, getRecommendationsSummary, filterRecommendations } = require('../utils/recommendationEngine');

/**
 * @desc    Generate recommendations based on category scores
 * @route   POST /api/recommendations
 * @access  Private
 */
const getRecommendations = asyncHandler(async (req, res) => {
  const { categoryScores } = req.body;

  // Validate input
  if (!categoryScores) {
    return res.status(400).json({
      success: false,
      error: 'Category scores are required'
    });
  }

  const requiredCategories = ['accessControl', 'dataEncryption', 'employeePolicies', 'physicalSecurity'];
  const missingCategories = requiredCategories.filter(cat => !categoryScores[cat]?.percentage && categoryScores[cat]?.percentage !== 0);

  if (missingCategories.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing percentage for categories: ${missingCategories.join(', ')}`
    });
  }

  // Format category scores if needed
  const formattedScores = {};
  requiredCategories.forEach(cat => {
    formattedScores[cat] = {
      percentage: categoryScores[cat].percentage
    };
  });

  // Generate recommendations
  const recommendations = generateRecommendations(formattedScores);

  // Get summary
  const summary = getRecommendationsSummary(recommendations);

  res.status(200).json({
    success: true,
    summary,
    data: recommendations
  });
});

/**
 * @desc    Get filtered recommendations (actionable items only)
 * @route   POST /api/recommendations/actionable
 * @access  Private
 */
const getActionableRecommendations = asyncHandler(async (req, res) => {
  const { categoryScores, minPriority = 'High' } = req.body;

  // Validate input
  if (!categoryScores) {
    return res.status(400).json({
      success: false,
      error: 'Category scores are required'
    });
  }

  // Generate all recommendations
  const recommendations = generateRecommendations(categoryScores);

  // Filter to actionable items only
  const actionable = filterRecommendations(recommendations, minPriority);

  res.status(200).json({
    success: true,
    count: actionable.length,
    data: actionable
  });
});

/**
 * @desc    Get recommendation rules documentation
 * @route   GET /api/recommendations/rules
 * @access  Public
 */
const getRecommendationRules = asyncHandler(async (req, res) => {
  const rules = {
    scoringThresholds: {
      critical: { range: '0-49%', description: 'Significant vulnerabilities requiring immediate action' },
      high: { range: '50-74%', description: 'Notable gaps that should be addressed soon' },
      medium: { range: '75-89%', description: 'Minor improvements recommended' },
      low: { range: '90-100%', description: 'Strong protection, focus on maintenance' }
    },
    categories: [
      {
        name: 'Access Control',
        key: 'accessControl',
        description: 'Controls who can access trade secret information',
        focus: ['RBAC', 'MFA', 'Access logging', 'Permission management']
      },
      {
        name: 'Data Encryption',
        key: 'dataEncryption',
        description: 'Protects trade secrets through encryption',
        focus: ['At-rest encryption', 'In-transit encryption', 'Key management', 'Endpoint security']
      },
      {
        name: 'Employee Policies',
        key: 'employeePolicies',
        description: 'Human-factor controls for trade secret protection',
        focus: ['NDAs', 'Training', 'Data handling', 'Offboarding']
      },
      {
        name: 'Physical Security',
        key: 'physicalSecurity',
        description: 'Physical protection of trade secret assets',
        focus: ['Access control', 'Surveillance', 'Document security', 'Facility security']
      }
    ],
    priorityLevels: [
      { level: 'Critical', color: '#dc3545', urgency: 'Immediate action required' },
      { level: 'High', color: '#fd7e14', urgency: 'Address within 30 days' },
      { level: 'Medium', color: '#ffc107', urgency: 'Address within 90 days' },
      { level: 'Low', color: '#28a745', urgency: 'Continuous improvement' }
    ]
  };

  res.status(200).json({
    success: true,
    data: rules
  });
});

module.exports = {
  getRecommendations,
  getActionableRecommendations,
  getRecommendationRules
};
