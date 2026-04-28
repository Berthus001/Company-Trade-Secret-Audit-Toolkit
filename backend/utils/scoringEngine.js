/**
 * Scoring Engine
 * Handles all score calculations for the Trade Secret Audit
 * 
 * Scoring Scale:
 * - Very Good = 3 points
 * - Good = 2 points
 * - Bad = 1 point
 * - Very Bad = 0 points
 * 
 * Risk Classification:
 * - 75-100%: Low Risk (Strong protection)
 * - 50-74%: Medium Risk (Needs improvement)
 * - 0-49%: High Risk (Significant vulnerabilities)
 */

/**
 * Category key mapping
 * Converts display names to object keys
 */
const CATEGORY_KEYS = {
  'Access Control': 'accessControl',
  'Data Encryption': 'dataEncryption',
  'Employee Policies': 'employeePolicies',
  'Physical Security': 'physicalSecurity'
};

/**
 * Calculate score for a single response
 * @param {number} selectedValue - The value selected (0-4)
 * @param {number} weight - Question weight (1-3)
 * @returns {number} Calculated score
 */
const calculateResponseScore = (selectedValue, weight = 1) => {
  return selectedValue * weight;
};

/**
 * Calculate category scores from responses
 * @param {Array} responses - Array of response objects
 * @param {Array} questions - Array of question objects
 * @returns {Object} Category scores with score, maxScore, and percentage
 */
const calculateCategoryScores = (responses, questions) => {
  // Initialize category scores
  const categoryScores = {
    accessControl: { score: 0, maxScore: 0, percentage: 0 },
    dataEncryption: { score: 0, maxScore: 0, percentage: 0 },
    employeePolicies: { score: 0, maxScore: 0, percentage: 0 },
    physicalSecurity: { score: 0, maxScore: 0, percentage: 0 }
  };

  // Create a map of question IDs to questions for quick lookup
  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q._id.toString(), q);
  });

  // Calculate max possible scores per category
  questions.forEach(question => {
    const categoryKey = CATEGORY_KEYS[question.category];
    if (categoryKey) {
      const maxPoints = 3 * (question.weight || 1); // Max value is 3
      categoryScores[categoryKey].maxScore += maxPoints;
    }
  });

  // Calculate actual scores from responses
  responses.forEach(response => {
    const question = questionMap.get(response.questionId.toString());
    if (question) {
      const categoryKey = CATEGORY_KEYS[question.category];
      if (categoryKey) {
        const score = calculateResponseScore(
          response.selectedOption.value,
          question.weight || 1
        );
        categoryScores[categoryKey].score += score;
      }
    }
  });

  // Calculate percentages for each category
  Object.keys(categoryScores).forEach(category => {
    const { score, maxScore } = categoryScores[category];
    categoryScores[category].percentage = maxScore > 0 
      ? Math.round((score / maxScore) * 100) 
      : 0;
  });

  return categoryScores;
};

/**
 * Calculate total scores
 * @param {Object} categoryScores - Object containing all category scores
 * @returns {Object} Total score, max possible score, and percentage
 */
const calculateTotalScores = (categoryScores) => {
  let totalScore = 0;
  let maxPossibleScore = 0;

  Object.values(categoryScores).forEach(category => {
    totalScore += category.score;
    maxPossibleScore += category.maxScore;
  });

  const percentageScore = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;

  return {
    totalScore,
    maxPossibleScore,
    percentageScore
  };
};

/**
 * Determine risk level based on percentage score
 * @param {number} percentageScore - Overall percentage (0-100)
 * @returns {string} Risk level: 'Low', 'Medium', or 'High'
 */
const determineRiskLevel = (percentageScore) => {
  if (percentageScore >= 75) {
    return 'Low';     // Strong protection measures
  } else if (percentageScore >= 50) {
    return 'Medium';  // Adequate but needs improvement
  } else {
    return 'High';    // Significant vulnerabilities
  }
};

/**
 * Get risk level details including color and description
 * @param {string} riskLevel - Risk level string
 * @returns {Object} Risk level details
 */
const getRiskLevelDetails = (riskLevel) => {
  const details = {
    'Low': {
      color: '#28a745',
      description: 'Your organization has strong trade secret protection measures in place.',
      icon: '✓'
    },
    'Medium': {
      color: '#ffc107',
      description: 'Your organization has adequate protection but needs improvement in some areas.',
      icon: '!'
    },
    'High': {
      color: '#dc3545',
      description: 'Your organization has significant vulnerabilities in trade secret protection.',
      icon: '✗'
    }
  };

  return details[riskLevel] || details['High'];
};

/**
 * Process complete audit and return all calculated scores
 * @param {Array} responses - Array of response objects with questionId and selectedOption
 * @param {Array} questions - Array of all question documents
 * @returns {Object} Complete scoring results
 */
const processAuditScores = (responses, questions) => {
  // Calculate category scores
  const categoryScores = calculateCategoryScores(responses, questions);

  // Calculate total scores
  const { totalScore, maxPossibleScore, percentageScore } = calculateTotalScores(categoryScores);

  // Determine risk level
  const riskLevel = determineRiskLevel(percentageScore);

  // Get risk level details
  const riskDetails = getRiskLevelDetails(riskLevel);

  return {
    categoryScores,
    totalScore,
    maxPossibleScore,
    percentageScore,
    riskLevel,
    riskDetails
  };
};

/**
 * Format response for storage
 * @param {Object} question - Question document
 * @param {number} selectedValue - Selected option value
 * @returns {Object} Formatted response object
 */
const formatResponse = (question, selectedValue) => {
  const selectedOption = question.options.find(opt => opt.value === selectedValue);
  
  return {
    questionId: question._id,
    category: question.category,
    questionText: question.text,
    selectedOption: {
      label: selectedOption.label,
      value: selectedOption.value,
      description: selectedOption.description
    },
    weight: question.weight || 1,
    score: calculateResponseScore(selectedValue, question.weight || 1)
  };
};

module.exports = {
  CATEGORY_KEYS,
  calculateResponseScore,
  calculateCategoryScores,
  calculateTotalScores,
  determineRiskLevel,
  getRiskLevelDetails,
  processAuditScores,
  formatResponse
};
