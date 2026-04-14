import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import {
  createHostelAdmin,
  createLecturer,
  rejectStaffAccount,
  verifyStaffAccount,
} from './adminService';

export const onboardLecturer = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createLecturer(req.body, res.locals.user);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const onboardHostelAdmin = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createHostelAdmin(req.body, res.locals.user);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const approveStaff = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const result = await verifyStaffAccount(userId, res.locals.user);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const declineStaff = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const result = await rejectStaffAccount(
      userId,
      res.locals.user,
      req.body?.remark,
    );

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);
