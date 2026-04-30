/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Requires valid JWT token
 * Attaches user object to request if authenticated
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token payload (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user not found'
        });
      }

      // Attach user to request object with decoded payload (includes role)
      req.user = {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: decoded.role || user.role,
        _id: user._id
      };
      next();

    } catch (error) {
      // Token verification failed
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, token expired'
        });
      }

      throw error;
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Admin only middleware
 * Must be used after protect middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Not authorized, admin access required'
    });
  }
};

/**
 * Role-based access control middleware
 * Must be used after protect middleware
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'superadmin', 'user')
 * @returns Middleware function
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized, insufficient permissions'
      });
    }
    next();
  };
};

/**
 * Ownership verification middleware
 * Ensures admins can only access users they created
 * Superadmins bypass this check
 * Must be used after protect middleware
 */
const verifyOwnership = async (req, res, next) => {
  try {
    // Superadmin bypasses ownership checks
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Admins must own the resource
    if (req.user.role === 'admin') {
      const targetUserId = req.params.id;
      
      // Get the target user to check ownership
      const targetUser = await User.findById(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if admin created this user
      if (!targetUser.createdBy || targetUser.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: You can only manage users you created'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization error'
    });
  }
};

/**
 * Optional authentication
 * Attaches user to request if token present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            company: user.company,
            role: decoded.role || user.role,
            _id: user._id
          };
        }
      } catch (error) {
        // Token invalid, but that's okay for optional auth
        console.log('Optional auth token invalid');
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { protect, adminOnly, allowRoles, optionalAuth };
