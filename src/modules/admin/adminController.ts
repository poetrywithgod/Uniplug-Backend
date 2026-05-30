import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import {
  createHostelAdmin,
  createLecturer,
  getApplications,
  rejectStaffAccount,
  updateApplicationStatus,
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

export const handleGetApplications = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    // Explicitly casting since Zod already validated this
    const query = req.query as any;
    const result = await getApplications(query, res.locals.user);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const handleUpdateApplicationStatus = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const applicationId = Array.isArray(req.params.applicationId)
      ? req.params.applicationId[0]
      : req.params.applicationId;

    const result = await updateApplicationStatus(
      applicationId,
      req.body,
      res.locals.user,
    );

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);
