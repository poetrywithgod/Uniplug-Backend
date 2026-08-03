import { NextFunction, Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { getUniversalUploadSignature } from './mediaService';

export const handleGetUploadSignature = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const query = req.query as { folder: string };
    const signatureData = await getUniversalUploadSignature(query);

    res.status(200).json({
      status: 'success',
      message: 'Cloudinary upload signature generated successfully',
      data: signatureData,
    });
  },
);
