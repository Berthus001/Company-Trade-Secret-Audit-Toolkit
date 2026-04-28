/**
 * User Model
 * Defines the schema for user authentication and profile data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password in queries by default
  },
  company: {
    type: String,
    required: [true, 'Please provide your company name'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user'],
    default: 'user'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster email lookups
userSchema.index({ email: 1 });

/**
 * Pre-save middleware to hash password
 * Only hashes if password is modified
 */
userSchema.pre('save', async function(next) {
  // Skip if password not modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method to compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {boolean} True if passwords match
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method to generate JWT token
 * @returns {string} Signed JWT token
 */
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Static method to find user by credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User document or null
 */
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    return null;
  }

  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    return null;
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
