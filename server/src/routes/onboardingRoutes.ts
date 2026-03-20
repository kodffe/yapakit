import { Router } from 'express';
import {
  initRegistration,
  verifyRegistrationOtp,
  completeRegistration
} from '../controllers/onboardingController';

const router = Router();

/**
 * @route   POST /api/onboarding/init
 * @desc    Initialize registration: validate email and send OTP
 * @access  Public
 */
router.post('/init', initRegistration);

/**
 * @route   POST /api/onboarding/verify
 * @desc    Verify OTP and issue a short-lived registration token
 * @access  Public
 */
router.post('/verify', verifyRegistrationOtp);

/**
 * @route   POST /api/onboarding/complete
 * @desc    Complete onboarding & bootstrap the new SaaS tenant
 * @access  Public
 */
router.post('/complete', completeRegistration);

export default router;
