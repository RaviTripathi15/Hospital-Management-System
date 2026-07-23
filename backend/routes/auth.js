'use strict';

const express = require('express');
const router = express.Router();

const {
  register, login, logout, getMe, updateProfile,
  changePassword, forgotPassword, resetPassword, refreshToken,
  googleLogin,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  registerValidator, loginValidator, changePasswordValidator, forgotPasswordValidator,
} = require('../middleware/validator');
const { uploadProfilePic } = require('../middleware/upload');

// Public routes
router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.post('/google', googleLogin);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, forgotPassword);
router.put('/reset-password/:token', passwordResetLimiter, resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadProfilePic, updateProfile);
router.put('/change-password', protect, changePasswordValidator, changePassword);

module.exports = router;
