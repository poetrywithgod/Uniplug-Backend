import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  resendRegistrationOtp,
  verifyRegistrationOtp,
  getCurrentUser,
} from './authService';

export const getMe = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await getCurrentUser(res.locals.user.id);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const register = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await registerUser(req.body);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const verifyOtp = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await verifyRegistrationOtp(req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const resendOtp = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await resendRegistrationOtp(req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const login = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await loginUser(req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const forgotPasswordWithToken = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await forgotPassword(req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const resetPasswordWithToken = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { token } = req.params as { token: string };
    const { newPassword } = req.body;
    
    // Pass the token and body parameter to the service
    const result = await resetPassword({ token, newPassword });

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);
