import express from 'express';
import { validate } from '../middlewares/validate.js';
import { auth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { 
  sendOTP,
  verifyOTP,
  registerBusiness,
  forgotPasswordRequest,
  forgotPasswordReset,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
  sendOtpSchema,
  verifyOtpSchema,
  registerBusinessSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  loginSchema
} from '../controllers/authController.js';
import { submitKyc, kycSubmitSchema } from '../controllers/kycController.js';

const router = express.Router();

// OTP Routing
router.post('/otp/send', authLimiter, validate(sendOtpSchema), sendOTP);
router.post('/otp/verify', authLimiter, validate(verifyOtpSchema), verifyOTP);

// Business Sign up (Step 3: Completion)
router.post('/register-business', authLimiter, validate(registerBusinessSchema), registerBusiness);

// Password Recovery Routing
router.post('/password/reset-request', authLimiter, validate(resetPasswordRequestSchema), forgotPasswordRequest);
router.post('/password/reset-confirm', authLimiter, validate(resetPasswordConfirmSchema), forgotPasswordReset);

// Standard Login & Profile Verification
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

// Profile update & password change
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);

// KYC Submission
router.post('/kyc/submit', auth, validate(kycSubmitSchema), submitKyc);

export default router;
