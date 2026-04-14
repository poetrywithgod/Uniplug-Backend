import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from './authService';

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

export const forgotPasswordOtp = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await forgotPassword(req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const resetPasswordWithOtp = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await resetPassword(req.body);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);
