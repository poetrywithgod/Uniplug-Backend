import express from 'express';

import {
  forgotPasswordOtp,
  login,
  register,
  resendOtp,
  resetPasswordWithOtp,
  verifyOtp,
} from './authController';
import { validateRequest } from '../../utils/validation';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from './authSchemas';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', validateRequest(resendOtpSchema), resendOtp);
router.post('/login', validateRequest(loginSchema), login);
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  forgotPasswordOtp,
);
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  resetPasswordWithOtp,
);

export default router;
