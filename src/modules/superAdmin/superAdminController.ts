import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import {
  createSchoolAdmin,
  createTenant,
  rejectSchoolAdmin,
  verifySchoolAdmin,
} from './superAdminService';

export const onboardTenant = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const result = await createTenant(req.body);

  res.status(201).json({
    status: 'success',
    ...result,
  });
});

export const onboardSchoolAdmin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const result = await createSchoolAdmin(req.body);

  res.status(201).json({
    status: 'success',
    ...result,
  });
});

export const approveSchoolAdmin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const result = await verifySchoolAdmin(userId);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

export const declineSchoolAdmin = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const result = await rejectSchoolAdmin(userId, req.body?.remark);

  res.status(200).json({
    status: 'success',
    ...result,
  });
});
