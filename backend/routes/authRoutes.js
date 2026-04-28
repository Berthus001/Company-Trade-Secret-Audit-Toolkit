/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const {
  loginUser,
  getMe,
  updateProfile,
  updatePassword,
  createAdmin,
  createUser,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');

// Public routes
router.post('/login', loginUser);

// Protected routes - User creation with RBAC
router.post('/users/create-admin', protect, allowRoles('superadmin'), createAdmin);
router.post('/users/create-user', protect, allowRoles('admin', 'superadmin'), createUser);

// Protected routes - User management (Admin/Superadmin)
router.get('/users', protect, allowRoles('admin', 'superadmin'), getUsers);
router.put('/users/:id', protect, allowRoles('admin', 'superadmin'), updateUser);
router.delete('/users/:id', protect, allowRoles('admin', 'superadmin'), deleteUser);

// Protected routes - Profile management
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
