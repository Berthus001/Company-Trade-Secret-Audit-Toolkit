/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/authController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes - User creation with RBAC
router.post('/users/create-admin', protect, allowRoles('superadmin'), createAdmin);
router.post('/users/create-user', protect, allowRoles('admin', 'superadmin'), createUser);

// Protected routes - User management (Admin/Superadmin)
router.get('/users', protect, allowRoles('admin', 'superadmin'), getUsers);
router.get('/users/count', protect, allowRoles('admin', 'superadmin'), getUserCount);
router.put('/users/:id', protect, allowRoles('admin', 'superadmin'), updateUser);
router.delete('/users/:id', protect, allowRoles('admin', 'superadmin'), deleteUser);

// Protected routes - Freeze/Unfreeze (Admin/Superadmin)
router.put('/users/:id/freeze', protect, allowRoles('admin', 'superadmin'), freezeUser);
router.put('/users/:id/unfreeze', protect, allowRoles('admin', 'superadmin'), unfreezeUser);

// Protected routes - Profile management
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
