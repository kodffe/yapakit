import { Router } from 'express';
import { register, login, requestPasswordReset, resetPasswordWithOtp } from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT + memberships
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request a 6-digit OTP for password reset
 * @access  Public
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Verify OTP and reset user password
 * @access  Public
 */
router.post('/reset-password', resetPasswordWithOtp);

export default router;
