import express from 'express';

import {
  forgotPasswordWithToken,
  login,
  register,
  resendOtp,
  resetPasswordWithToken,
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
  forgotPasswordWithToken,
);
router.post(
  '/reset-password/:token',
  validateRequest(resetPasswordSchema),
  resetPasswordWithToken,
);

export default router;
