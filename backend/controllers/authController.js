/**
 * Authentication Controller
 * Handles user registration, login, and profile retrieval
 */

const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;

  // Validate required fields
  if (!name || !email || !password || !company) {
    return res.status(400).json({
      success: false,
      error: 'Please provide all required fields: name, email, password, company'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Email is already registered'
    });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    company
  });

  // Generate token
  const token = user.generateToken();

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide email and password'
    });
  }

  // Find user by credentials
  const user = await User.findByCredentials(email.toLowerCase(), password);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Generate token
  const token = user.generateToken();

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      token
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, company } = req.body;

  const updateFields = {};
  if (name) updateFields.name = name;
  if (company) updateFields.company = company;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateFields,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role
    }
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Please provide current password and new password'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters long'
    });
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateToken();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token
  });
});

/**
 * @desc    Create admin user (superadmin only)
 * @route   POST /api/users/create-admin
 * @access  Private/Superadmin
 */
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, company } = req.body;

  // Validate required fields
  if (!name || !email || !password || !company) {
    return res.status(400).json({
      success: false,
      error: 'Please provide all required fields: name, email, password, company'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Email is already registered'
    });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  // Create admin user (set createdBy to superadmin)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    company,
    role: 'admin',
    createdBy: req.user._id // Superadmin who created this admin
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      createdBy: user.createdBy
    }
  });
});

/**
 * @desc    Create regular user (admin and superadmin)
 * @route   POST /api/users/create-user
 * @access  Private/Admin/Superadmin
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, company, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !company) {
    return res.status(400).json({
      success: false,
      error: 'Please provide all required fields: name, email, password, company'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Email is already registered'
    });
  }

  // Validate password length
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long'
    });
  }

  // Validate role - admins can assign auditor, analyst, or user
  const allowedRoles = ['user', 'auditor', 'analyst'];
  const userRole = role && allowedRoles.includes(role) ? role : 'user';

  // Create regular user (set createdBy to admin or superadmin)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    company,
    role: userRole,
    createdBy: req.user._id // Admin/Superadmin who created this user
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      createdBy: user.createdBy
    }
  });
});

/**
 * @desc    Get all users (with optional role filter)
 * @route   GET /api/auth/users
 * @access  Private/Admin/Superadmin
 * @ownership Admins only see users they created; Superadmins see all
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  
  // Build query based on user role
  const query = {};
  
  // Admins can ONLY see users they created
  if (req.user.role === 'admin') {
    query.createdBy = req.user._id;
  }
  // Superadmins see all users (no filter)
  
  // Apply role filter if provided
  if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .select('-password')
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/auth/users/:id
 * @access  Private/Admin/Superadmin
 * @ownership Admins can only update users they created; Superadmins can update all
 */
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, company, role } = req.body;

  // Find user
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Ownership check: Admins can only update users they created
  if (req.user.role === 'admin') {
    if (!user.createdBy || user.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only update users you created'
      });
    }

    // Admins can only assign roles: user, auditor, analyst (not admin or superadmin)
    if (role && role !== user.role) {
      if (!['user', 'auditor', 'analyst'].includes(role)) {
        return res.status(403).json({
          success: false,
          error: 'Admins can only assign user, auditor, or analyst roles'
        });
      }
    }
  }

  // Superadmin can change any role except superadmin role
  if (req.user.role === 'superadmin') {
    // Prevent changing superadmin role to anything else (for safety)
    if (user.role === 'superadmin' && role && role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot demote superadmin accounts'
      });
    }
    
    // Superadmin can change admin, auditor, analyst, user roles freely
    // This allows demoting admins to other roles
  }

  // Prevent non-superadmins from modifying superadmin accounts
  if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot modify superadmin accounts'
    });
  }

  // Check if email is being changed and is unique
  if (email && email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email is already in use'
      });
    }
    user.email = email.toLowerCase();
  }

  // Update fields
  if (name) user.name = name;
  if (company) user.company = company;
  if (role && ['user', 'admin', 'superadmin', 'auditor', 'analyst'].includes(role)) {
    user.role = role;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role
    }
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/auth/users/:id
 * @access  Private/Admin/Superadmin
 * @ownership Admins can only delete users they created; Superadmins can delete all
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Ownership check: Admins can only delete users they created
  if (req.user.role === 'admin') {
    if (!user.createdBy || user.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only delete users you created'
      });
    }
  }

  // Prevent deleting superadmin accounts
  if (user.role === 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Cannot delete superadmin accounts'
    });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * @desc    Freeze a user account
 * @route   PUT /api/auth/users/:id/freeze
 * @access  Private/Admin/Superadmin
 * @ownership Admins can only freeze users they created; Superadmins can freeze all
 */
const freezeUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Ownership check: Admins can only freeze users they created
  if (req.user.role === 'admin') {
    if (!user.createdBy || user.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only freeze users you created'
      });
    }
  }

  // Prevent freezing superadmin or admin accounts
  if (['superadmin', 'admin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Cannot freeze admin or superadmin accounts'
    });
  }

  // Check if already frozen
  if (user.isFrozen) {
    return res.status(400).json({
      success: false,
      error: 'User is already frozen'
    });
  }

  // Freeze the user
  user.isFrozen = true;
  user.frozenBy = req.user._id;
  user.frozenAt = new Date();
  user.freezeReason = reason || 'No reason provided';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account frozen successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isFrozen: user.isFrozen,
      frozenAt: user.frozenAt,
      freezeReason: user.freezeReason
    }
  });
});

/**
 * @desc    Unfreeze a user account
 * @route   PUT /api/auth/users/:id/unfreeze
 * @access  Private/Admin/Superadmin
 * @ownership Admins can only unfreeze users they created; Superadmins can unfreeze all
 */
const unfreezeUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Ownership check: Admins can only unfreeze users they created
  if (req.user.role === 'admin') {
    if (!user.createdBy || user.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You can only unfreeze users you created'
      });
    }
  }

  // Check if user is frozen
  if (!user.isFrozen) {
    return res.status(400).json({
      success: false,
      error: 'User is not frozen'
    });
  }

  // Unfreeze the user
  user.isFrozen = false;
  user.frozenBy = null;
  user.frozenAt = null;
  user.freezeReason = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User account unfrozen successfully',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isFrozen: user.isFrozen
    }
  });
});

/**
 * @desc    Get user count (with ownership filtering)
 * @route   GET /api/auth/users/count
 * @access  Private/Admin/Superadmin
 * @ownership Admins only count users they created; Superadmins count all
 */
const getUserCount = asyncHandler(async (req, res) => {
  // Build query based on user role
  const query = {};
  
  // Admins can ONLY count users they created
  if (req.user.role === 'admin') {
    query.createdBy = req.user._id;
  }
  // Superadmins count all users (no filter)

  const count = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: count
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  updatePassword,
  createAdmin,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  freezeUser,
  unfreezeUser,
  getUserCount
};
