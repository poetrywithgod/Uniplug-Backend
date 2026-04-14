import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import { createHostelAdmin, createLecturer } from './adminService';

export const onboardLecturer = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createLecturer(req.body);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const onboardHostelAdmin = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createHostelAdmin(req.body);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);
