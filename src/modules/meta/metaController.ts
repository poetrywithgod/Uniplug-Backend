import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import { getDepartments } from './metaService';

export const listDepartments = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await getDepartments();

    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);
