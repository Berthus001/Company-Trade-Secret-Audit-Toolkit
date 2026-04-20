/**
 * Recommendation Engine
 * Generates rule-based recommendations based on category scores
 * 
 * Logic:
 * - Category < 50%: Critical priority
 * - Category 50-74%: High priority
 * - Category >= 75%: Medium/Low priority (minor improvements suggested)
 */

/**
 * Recommendation rules database
 * Contains specific recommendations for each category based on score thresholds
 */
const RECOMMENDATION_RULES = {
  accessControl: {
    critical: {
      title: 'Implement Comprehensive Access Control System',
      description: 'Your access control measures are critically inadequate, leaving trade secrets highly vulnerable to unauthorized access.',
      actions: [
        'Implement Role-Based Access Control (RBAC) immediately',
        'Deploy Multi-Factor Authentication (MFA) for all sensitive systems',
        'Establish comprehensive access logging and monitoring',
        'Create strict need-to-know access policies',
        'Conduct emergency access audit to revoke unnecessary permissions',
        'Implement principle of least privilege across all systems'
      ]
    },
    high: {
      title: 'Strengthen Access Control Measures',
      description: 'Your access control system needs significant improvements to adequately protect trade secrets.',
      actions: [
        'Review and update RBAC policies across departments',
        'Extend MFA to additional sensitive systems',
        'Implement quarterly access reviews',
        'Enhance logging capabilities for privileged accounts',
        'Develop access request and approval workflows'
      ]
    },
    medium: {
      title: 'Optimize Access Control Procedures',
      description: 'Your access control is adequate but could benefit from optimization.',
      actions: [
        'Automate access reviews and recertification',
        'Implement just-in-time access for privileged operations',
        'Enhance monitoring dashboards for access patterns',
        'Document and test access control procedures'
      ]
    },
    low: {
      title: 'Maintain Access Control Excellence',
      description: 'Your access control measures are strong. Focus on maintenance and continuous improvement.',
      actions: [
        'Continue regular access audits',
        'Stay updated on emerging access control technologies',
        'Conduct periodic penetration testing',
        'Document best practices for knowledge sharing'
      ]
    }
  },
  dataEncryption: {
    critical: {
      title: 'Implement Data Encryption Framework',
      description: 'Critical lack of encryption leaves your trade secrets exposed to interception and theft.',
      actions: [
        'Encrypt all data at rest using AES-256 or equivalent',
        'Implement TLS 1.3 for all data in transit',
        'Deploy a key management solution immediately',
        'Identify and encrypt all trade secret databases',
        'Implement full-disk encryption on all endpoints',
        'Encrypt all backup data and secure backup keys'
      ]
    },
    high: {
      title: 'Enhance Encryption Coverage',
      description: 'Encryption gaps exist that could expose trade secrets to unauthorized parties.',
      actions: [
        'Extend encryption to all file storage systems',
        'Implement email encryption for sensitive communications',
        'Review and upgrade encryption algorithms',
        'Establish key rotation procedures',
        'Encrypt mobile devices and removable media'
      ]
    },
    medium: {
      title: 'Strengthen Encryption Practices',
      description: 'Your encryption is adequate but some areas need attention.',
      actions: [
        'Implement automated key rotation',
        'Conduct encryption coverage audit',
        'Enhance encryption monitoring and alerting',
        'Test disaster recovery for encrypted systems'
      ]
    },
    low: {
      title: 'Maintain Encryption Standards',
      description: 'Your encryption practices are strong. Maintain vigilance and stay current.',
      actions: [
        'Monitor for encryption vulnerabilities',
        'Plan for post-quantum encryption readiness',
        'Regular key management audits',
        'Keep encryption certificates current'
      ]
    }
  },
  employeePolicies: {
    critical: {
      title: 'Establish Comprehensive Employee Security Policies',
      description: 'Lack of employee policies creates significant risk of trade secret exposure through human factors.',
      actions: [
        'Develop and deploy Non-Disclosure Agreements (NDAs) for all employees',
        'Implement mandatory security awareness training',
        'Create clear acceptable use policies',
        'Establish data handling and classification procedures',
        'Implement strict exit interview and offboarding protocols',
        'Create incident reporting procedures'
      ]
    },
    high: {
      title: 'Strengthen Employee Security Framework',
      description: 'Employee policies need significant enhancement to adequately protect trade secrets.',
      actions: [
        'Update NDAs to cover modern threats and scenarios',
        'Implement annual security training with testing',
        'Develop department-specific data handling procedures',
        'Enhance background check procedures',
        'Create clear consequences for policy violations'
      ]
    },
    medium: {
      title: 'Enhance Employee Security Culture',
      description: 'Your employee policies are adequate but could be strengthened.',
      actions: [
        'Implement phishing simulation exercises',
        'Develop role-specific security training',
        'Create security champion program',
        'Enhance policy acknowledgment tracking'
      ]
    },
    low: {
      title: 'Maintain Strong Security Culture',
      description: 'Your employee security policies are robust. Focus on continuous improvement.',
      actions: [
        'Conduct regular policy effectiveness assessments',
        'Stay current with industry best practices',
        'Recognize and reward security-conscious behavior',
        'Share lessons learned from industry incidents'
      ]
    }
  },
  physicalSecurity: {
    critical: {
      title: 'Implement Physical Security Controls',
      description: 'Inadequate physical security allows unauthorized physical access to trade secrets.',
      actions: [
        'Install badge/key card access systems for sensitive areas',
        'Implement comprehensive visitor management and logging',
        'Deploy CCTV surveillance in critical areas',
        'Establish clean desk policy for trade secret documents',
        'Secure server rooms and data centers',
        'Implement secure document destruction procedures'
      ]
    },
    high: {
      title: 'Enhance Physical Security Measures',
      description: 'Physical security gaps could allow unauthorized access to trade secret areas.',
      actions: [
        'Upgrade access control systems with audit trails',
        'Extend CCTV coverage and retention periods',
        'Implement mantraps for high-security areas',
        'Establish regular physical security audits',
        'Enhance perimeter security measures'
      ]
    },
    medium: {
      title: 'Optimize Physical Security',
      description: 'Your physical security is adequate but some improvements are recommended.',
      actions: [
        'Integrate physical and logical access systems',
        'Implement environmental monitoring',
        'Enhance after-hours security procedures',
        'Conduct regular physical penetration tests'
      ]
    },
    low: {
      title: 'Maintain Physical Security Excellence',
      description: 'Your physical security measures are strong. Continue vigilant maintenance.',
      actions: [
        'Regular testing of all security systems',
        'Evaluate emerging physical security technologies',
        'Maintain security guard training programs',
        'Review and update emergency procedures'
      ]
    }
  }
};

/**
 * Category display names mapping
 */
const CATEGORY_DISPLAY_NAMES = {
  accessControl: 'Access Control',
  dataEncryption: 'Data Encryption',
  employeePolicies: 'Employee Policies',
  physicalSecurity: 'Physical Security'
};

/**
 * Determine priority level based on percentage score
 * @param {number} percentage - Category percentage score
 * @returns {string} Priority level
 */
const determinePriority = (percentage) => {
  if (percentage < 50) return 'Critical';
  if (percentage < 75) return 'High';
  if (percentage < 90) return 'Medium';
  return 'Low';
};

/**
 * Get recommendation tier key based on percentage
 * @param {number} percentage - Category percentage score
 * @returns {string} Tier key (critical, high, medium, low)
 */
const getRecommendationTier = (percentage) => {
  if (percentage < 50) return 'critical';
  if (percentage < 75) return 'high';
  if (percentage < 90) return 'medium';
  return 'low';
};

/**
 * Generate recommendation for a single category
 * @param {string} categoryKey - Category key (e.g., 'accessControl')
 * @param {number} percentage - Category percentage score
 * @returns {Object} Recommendation object
 */
const generateCategoryRecommendation = (categoryKey, percentage) => {
  const tier = getRecommendationTier(percentage);
  const rule = RECOMMENDATION_RULES[categoryKey]?.[tier];

  if (!rule) {
    return null;
  }

  return {
    category: CATEGORY_DISPLAY_NAMES[categoryKey] || categoryKey,
    priority: determinePriority(percentage),
    percentage: percentage,
    title: rule.title,
    description: rule.description,
    actions: rule.actions
  };
};

/**
 * Generate all recommendations based on category scores
 * @param {Object} categoryScores - Object containing category scores
 * @returns {Array} Array of recommendation objects, sorted by priority
 */
const generateRecommendations = (categoryScores) => {
  const recommendations = [];

  // Generate recommendations for each category
  Object.keys(categoryScores).forEach(categoryKey => {
    const { percentage } = categoryScores[categoryKey];
    const recommendation = generateCategoryRecommendation(categoryKey, percentage);
    
    if (recommendation) {
      recommendations.push(recommendation);
    }
  });

  // Sort by priority (Critical first, then High, Medium, Low)
  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
};

/**
 * Filter recommendations to show only those needing attention
 * @param {Array} recommendations - Full recommendations array
 * @param {string} minPriority - Minimum priority to include ('Critical', 'High', 'Medium', 'Low')
 * @returns {Array} Filtered recommendations
 */
const filterRecommendations = (recommendations, minPriority = 'Medium') => {
  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
  const threshold = priorityOrder[minPriority] || 2;

  return recommendations.filter(rec => priorityOrder[rec.priority] <= threshold);
};

/**
 * Get summary of recommendations
 * @param {Array} recommendations - Recommendations array
 * @returns {Object} Summary object
 */
const getRecommendationsSummary = (recommendations) => {
  const summary = {
    total: recommendations.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    topPriority: null
  };

  recommendations.forEach(rec => {
    summary[rec.priority.toLowerCase()]++;
  });

  // Set top priority recommendation
  if (recommendations.length > 0) {
    summary.topPriority = recommendations[0];
  }

  return summary;
};

module.exports = {
  RECOMMENDATION_RULES,
  CATEGORY_DISPLAY_NAMES,
  determinePriority,
  generateCategoryRecommendation,
  generateRecommendations,
  filterRecommendations,
  getRecommendationsSummary
};
