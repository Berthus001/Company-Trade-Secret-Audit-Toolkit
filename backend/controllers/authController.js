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

  // Create admin user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    company,
    role: 'admin'
  });

  res.status(201).json({
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
 * @desc    Create regular user (admin and superadmin)
 * @route   POST /api/users/create-user
 * @access  Private/Admin/Superadmin
 */
const createUser = asyncHandler(async (req, res) => {
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

  // Create regular user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    company,
    role: 'user'
  });

  res.status(201).json({
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
 * @desc    Get all users (with optional role filter)
 * @route   GET /api/auth/users
 * @access  Private/Admin/Superadmin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  
  // Build query
  const query = {};
  if (role) {
    query.role = role;
  }

  const users = await User.find(query)
    .select('-password')
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
  if (role && ['user', 'admin', 'superadmin'].includes(role)) {
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
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Prevent deleting superadmin accounts (optional safety)
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
  deleteUser
};
