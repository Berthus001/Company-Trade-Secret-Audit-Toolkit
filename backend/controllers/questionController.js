/**
 * Question Controller
 * Handles CRUD operations for audit questions
 */

const Question = require('../models/Question');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * Default questions for seeding the database
 */
const DEFAULT_QUESTIONS = [
  // Access Control Questions
  {
    category: 'Access Control',
    text: 'How well does your organization implement Role-Based Access Control (RBAC) for sensitive information?',
    options: [
      { label: 'Very Good', value: 4, description: 'Comprehensive RBAC with regular reviews, principle of least privilege strictly enforced' },
      { label: 'Good', value: 3, description: 'RBAC implemented with occasional reviews, most users follow least privilege' },
      { label: 'Decent', value: 2, description: 'Basic RBAC in place but inconsistently applied across departments' },
      { label: 'Bad', value: 1, description: 'Limited access controls, many users have excessive permissions' },
      { label: 'Very Bad', value: 0, description: 'No formal access control system, open access to most resources' }
    ],
    weight: 2,
    order: 1
  },
  {
    category: 'Access Control',
    text: 'How effective is your Multi-Factor Authentication (MFA) implementation?',
    options: [
      { label: 'Very Good', value: 4, description: 'MFA required for all systems accessing trade secrets, hardware tokens available' },
      { label: 'Good', value: 3, description: 'MFA required for most sensitive systems, app-based authentication' },
      { label: 'Decent', value: 2, description: 'MFA available but optional for some systems' },
      { label: 'Bad', value: 1, description: 'MFA only for a few critical systems' },
      { label: 'Very Bad', value: 0, description: 'No MFA implemented' }
    ],
    weight: 2,
    order: 2
  },
  {
    category: 'Access Control',
    text: 'How well does your organization log and monitor access to trade secret information?',
    options: [
      { label: 'Very Good', value: 4, description: 'Real-time monitoring with automated alerts, comprehensive audit trails' },
      { label: 'Good', value: 3, description: 'Regular log reviews, alerts for suspicious activity' },
      { label: 'Decent', value: 2, description: 'Logs are collected but reviewed infrequently' },
      { label: 'Bad', value: 1, description: 'Minimal logging, no regular review process' },
      { label: 'Very Bad', value: 0, description: 'No access logging in place' }
    ],
    weight: 1,
    order: 3
  },
  {
    category: 'Access Control',
    text: 'How effective is your process for revoking access when employees change roles or leave?',
    options: [
      { label: 'Very Good', value: 4, description: 'Automated access revocation within hours, comprehensive offboarding checklist' },
      { label: 'Good', value: 3, description: 'Access removed within 24 hours, documented process' },
      { label: 'Decent', value: 2, description: 'Access usually removed within a week' },
      { label: 'Bad', value: 1, description: 'Inconsistent access removal, often delayed' },
      { label: 'Very Bad', value: 0, description: 'No formal process, orphaned accounts common' }
    ],
    weight: 2,
    order: 4
  },
  {
    category: 'Access Control',
    text: 'How well do you control third-party and contractor access to trade secrets?',
    options: [
      { label: 'Very Good', value: 4, description: 'Strict vetting, limited access scope, regular audits, NDAs enforced' },
      { label: 'Good', value: 3, description: 'NDAs required, access limited to necessary systems' },
      { label: 'Decent', value: 2, description: 'Some controls but access scope too broad' },
      { label: 'Bad', value: 1, description: 'Minimal vetting, broad access granted' },
      { label: 'Very Bad', value: 0, description: 'No distinction between employee and third-party access' }
    ],
    weight: 2,
    order: 5
  },

  // Data Encryption Questions
  {
    category: 'Data Encryption',
    text: 'How well does your organization encrypt trade secret data at rest?',
    options: [
      { label: 'Very Good', value: 4, description: 'All trade secret data encrypted with AES-256 or equivalent, regular key rotation' },
      { label: 'Good', value: 3, description: 'Most sensitive data encrypted, key management in place' },
      { label: 'Decent', value: 2, description: 'Some encryption but inconsistent across systems' },
      { label: 'Bad', value: 1, description: 'Limited encryption, mostly for compliance only' },
      { label: 'Very Bad', value: 0, description: 'No encryption of data at rest' }
    ],
    weight: 2,
    order: 1
  },
  {
    category: 'Data Encryption',
    text: 'How effective is your encryption for data in transit?',
    options: [
      { label: 'Very Good', value: 4, description: 'TLS 1.3 everywhere, certificate pinning, no exceptions' },
      { label: 'Good', value: 3, description: 'TLS 1.2+ for all external communications' },
      { label: 'Decent', value: 2, description: 'Encryption for most but not all data transfers' },
      { label: 'Bad', value: 1, description: 'Some unencrypted internal communications' },
      { label: 'Very Bad', value: 0, description: 'Significant unencrypted data transmission' }
    ],
    weight: 2,
    order: 2
  },
  {
    category: 'Data Encryption',
    text: 'How well does your organization manage encryption keys?',
    options: [
      { label: 'Very Good', value: 4, description: 'HSM-backed key management, automated rotation, strict access controls' },
      { label: 'Good', value: 3, description: 'Dedicated key management solution, documented procedures' },
      { label: 'Decent', value: 2, description: 'Manual key management with some controls' },
      { label: 'Bad', value: 1, description: 'Ad-hoc key management, keys stored insecurely' },
      { label: 'Very Bad', value: 0, description: 'No formal key management process' }
    ],
    weight: 1,
    order: 3
  },
  {
    category: 'Data Encryption',
    text: 'How well are endpoint devices (laptops, mobile) encrypted?',
    options: [
      { label: 'Very Good', value: 4, description: 'Full disk encryption on all devices, centrally managed' },
      { label: 'Good', value: 3, description: 'Encryption required and verified on most devices' },
      { label: 'Decent', value: 2, description: 'Encryption available but not enforced' },
      { label: 'Bad', value: 1, description: 'Only some devices encrypted' },
      { label: 'Very Bad', value: 0, description: 'No endpoint encryption' }
    ],
    weight: 2,
    order: 4
  },
  {
    category: 'Data Encryption',
    text: 'How well does your organization encrypt backups containing trade secrets?',
    options: [
      { label: 'Very Good', value: 4, description: 'All backups encrypted, keys stored separately, tested recovery' },
      { label: 'Good', value: 3, description: 'Backups encrypted with documented key storage' },
      { label: 'Decent', value: 2, description: 'Some backups encrypted but not consistently' },
      { label: 'Bad', value: 1, description: 'Backups rarely encrypted' },
      { label: 'Very Bad', value: 0, description: 'Backups not encrypted' }
    ],
    weight: 1,
    order: 5
  },

  // Employee Policies Questions
  {
    category: 'Employee Policies',
    text: 'How comprehensive are your Non-Disclosure Agreements (NDAs) for employees?',
    options: [
      { label: 'Very Good', value: 4, description: 'Comprehensive NDAs reviewed by legal, covering all trade secret scenarios, regularly updated' },
      { label: 'Good', value: 3, description: 'Standard NDAs for all employees with specific trade secret clauses' },
      { label: 'Decent', value: 2, description: 'Basic NDAs in place but may not cover all situations' },
      { label: 'Bad', value: 1, description: 'NDAs only for certain positions' },
      { label: 'Very Bad', value: 0, description: 'No NDAs or confidentiality agreements' }
    ],
    weight: 2,
    order: 1
  },
  {
    category: 'Employee Policies',
    text: 'How effective is your security awareness training program?',
    options: [
      { label: 'Very Good', value: 4, description: 'Annual mandatory training with testing, role-specific modules, phishing simulations' },
      { label: 'Good', value: 3, description: 'Annual training for all employees with acknowledgment' },
      { label: 'Decent', value: 2, description: 'Training available but not mandatory or tracked' },
      { label: 'Bad', value: 1, description: 'Minimal training, only during onboarding' },
      { label: 'Very Bad', value: 0, description: 'No security awareness training' }
    ],
    weight: 2,
    order: 2
  },
  {
    category: 'Employee Policies',
    text: 'How well defined are your data handling and classification procedures?',
    options: [
      { label: 'Very Good', value: 4, description: 'Clear classification system, handling procedures for each level, regular audits' },
      { label: 'Good', value: 3, description: 'Classification system in place with documented procedures' },
      { label: 'Decent', value: 2, description: 'Some classification but inconsistently applied' },
      { label: 'Bad', value: 1, description: 'Informal classification, no clear procedures' },
      { label: 'Very Bad', value: 0, description: 'No data classification system' }
    ],
    weight: 2,
    order: 3
  },
  {
    category: 'Employee Policies',
    text: 'How effective is your employee exit/offboarding process for protecting trade secrets?',
    options: [
      { label: 'Very Good', value: 4, description: 'Comprehensive checklist, exit interviews, device return verification, reminder of obligations' },
      { label: 'Good', value: 3, description: 'Standard offboarding process with NDA reminders' },
      { label: 'Decent', value: 2, description: 'Basic offboarding, some steps may be missed' },
      { label: 'Bad', value: 1, description: 'Inconsistent offboarding process' },
      { label: 'Very Bad', value: 0, description: 'No formal offboarding process' }
    ],
    weight: 2,
    order: 4
  },
  {
    category: 'Employee Policies',
    text: 'How well does your organization enforce acceptable use policies?',
    options: [
      { label: 'Very Good', value: 4, description: 'Clear policies, technical enforcement, regular acknowledgment, consequences enforced' },
      { label: 'Good', value: 3, description: 'Documented policies with some technical controls' },
      { label: 'Decent', value: 2, description: 'Policies exist but enforcement is limited' },
      { label: 'Bad', value: 1, description: 'Policies poorly communicated or outdated' },
      { label: 'Very Bad', value: 0, description: 'No acceptable use policies' }
    ],
    weight: 1,
    order: 5
  },

  // Physical Security Questions
  {
    category: 'Physical Security',
    text: 'How effective is your physical access control system?',
    options: [
      { label: 'Very Good', value: 4, description: 'Badge access with biometrics for sensitive areas, comprehensive audit trails' },
      { label: 'Good', value: 3, description: 'Badge access system with logging for all areas' },
      { label: 'Decent', value: 2, description: 'Badge access for main areas, some areas unsecured' },
      { label: 'Bad', value: 1, description: 'Basic locks, limited access control' },
      { label: 'Very Bad', value: 0, description: 'Open access to most areas' }
    ],
    weight: 2,
    order: 1
  },
  {
    category: 'Physical Security',
    text: 'How well does your organization manage visitor access?',
    options: [
      { label: 'Very Good', value: 4, description: 'Pre-registration required, photo ID, escorted access, badge tracking' },
      { label: 'Good', value: 3, description: 'Sign-in required, visitor badges, escort for sensitive areas' },
      { label: 'Decent', value: 2, description: 'Sign-in log but limited escort requirements' },
      { label: 'Bad', value: 1, description: 'Informal visitor tracking' },
      { label: 'Very Bad', value: 0, description: 'No visitor management system' }
    ],
    weight: 1,
    order: 2
  },
  {
    category: 'Physical Security',
    text: 'How effective is your surveillance and monitoring system?',
    options: [
      { label: 'Very Good', value: 4, description: 'Comprehensive CCTV coverage, 90+ day retention, 24/7 monitoring' },
      { label: 'Good', value: 3, description: 'CCTV in key areas, adequate retention, regular review' },
      { label: 'Decent', value: 2, description: 'Some CCTV coverage but gaps exist' },
      { label: 'Bad', value: 1, description: 'Minimal surveillance' },
      { label: 'Very Bad', value: 0, description: 'No surveillance system' }
    ],
    weight: 1,
    order: 3
  },
  {
    category: 'Physical Security',
    text: 'How well are sensitive documents and media physically protected?',
    options: [
      { label: 'Very Good', value: 4, description: 'Clean desk policy enforced, secure storage, cross-cut shredding, media destruction' },
      { label: 'Good', value: 3, description: 'Clean desk policy, locked storage available' },
      { label: 'Decent', value: 2, description: 'Some secure storage but policy inconsistently followed' },
      { label: 'Bad', value: 1, description: 'Limited secure storage options' },
      { label: 'Very Bad', value: 0, description: 'No physical document security measures' }
    ],
    weight: 2,
    order: 4
  },
  {
    category: 'Physical Security',
    text: 'How secure are your server rooms and data centers?',
    options: [
      { label: 'Very Good', value: 4, description: 'Biometric access, mantraps, environmental monitoring, 24/7 security' },
      { label: 'Good', value: 3, description: 'Restricted access, environmental controls, logging' },
      { label: 'Decent', value: 2, description: 'Locked but access not tightly controlled' },
      { label: 'Bad', value: 1, description: 'Basic locks, minimal monitoring' },
      { label: 'Very Bad', value: 0, description: 'Inadequate server room security' }
    ],
    weight: 2,
    order: 5
  }
];

/**
 * @desc    Get all active questions grouped by category
 * @route   GET /api/questions
 * @access  Private
 */
const getQuestions = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let query = { isActive: true };
  if (category) {
    query.category = category;
  }

  const questions = await Question.find(query).sort({ category: 1, order: 1 });

  // Group questions by category
  const grouped = await Question.getGroupedByCategory();
  const count = questions.length;

  res.status(200).json({
    success: true,
    count,
    data: grouped
  });
});

/**
 * @desc    Get single question by ID
 * @route   GET /api/questions/:id
 * @access  Private
 */
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return res.status(404).json({
      success: false,
      error: 'Question not found'
    });
  }

  res.status(200).json({
    success: true,
    data: question
  });
});

/**
 * @desc    Seed database with default questions
 * @route   POST /api/questions/seed
 * @access  Private (ideally Admin only)
 */
const seedQuestions = asyncHandler(async (req, res) => {
  // Check if questions already exist
  const existingCount = await Question.countDocuments();
  
  if (existingCount > 0) {
    // Option to force reseed
    if (req.body.force !== true) {
      return res.status(400).json({
        success: false,
        error: 'Questions already exist. Send { force: true } to reseed.',
        existingCount
      });
    }
    // Delete existing questions if force is true
    await Question.deleteMany({});
  }

  // Insert default questions
  const questions = await Question.insertMany(DEFAULT_QUESTIONS);

  res.status(201).json({
    success: true,
    message: 'Questions seeded successfully',
    count: questions.length
  });
});

/**
 * @desc    Get questions list (flat array)
 * @route   GET /api/questions/list
 * @access  Private
 */
const getQuestionsList = asyncHandler(async (req, res) => {
  const questions = await Question.find({ isActive: true })
    .sort({ category: 1, order: 1 })
    .select('_id category text weight order');

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions
  });
});

module.exports = {
  getQuestions,
  getQuestion,
  seedQuestions,
  getQuestionsList,
  DEFAULT_QUESTIONS
};
