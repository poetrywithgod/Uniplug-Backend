import { Request, Response } from 'express';
import * as hostelService from './hostelService';
import catchAsync from '../../utils/catchAsync';

export const createHostel = catchAsync(async (req: Request, res: Response) => {
  const user = res.locals.user as { tenantId: string };
  const hostel = await hostelService.createHostel(req.body, user.tenantId);

  res.status(201).json({
    status: 'success',
    data: hostel,
  });
});

export const updateHostel = catchAsync(async (req: Request, res: Response) => {
  const user = res.locals.user as { tenantId: string };
  const hostel = await hostelService.updateHostel(
    req.params.id as string,
    user.tenantId,
    req.body,
  );

  res.status(200).json({
    status: 'success',
    data: hostel,
  });
});

export const deleteHostel = catchAsync(async (req: Request, res: Response) => {
  const user = res.locals.user as { tenantId: string };
  await hostelService.deleteHostel(req.params.id as string, user.tenantId);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getHostels = catchAsync(async (req: Request, res: Response) => {
  const user = res.locals.user as { tenantId: string };
  const hostels = await hostelService.getHostels(user.tenantId);

  res.status(200).json({
    status: 'success',
    data: hostels,
  });
});

export const applyForHostel = catchAsync(
  async (req: Request, res: Response) => {
    const user = res.locals.user as { id: string; tenantId: string };
    const application = await hostelService.applyForHostel(
      req.params.id as string,
      user.id,
      user.tenantId,
    );

    res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully',
      data: application,
    });
  },
);

export const getHostelApplications = catchAsync(
  async (req: Request, res: Response) => {
    const user = res.locals.user as { tenantId: string };
    const applications = await hostelService.getHostelApplications(
      req.params.id as string,
      user.tenantId,
    );

    res.status(200).json({
      status: 'success',
      data: applications,
    });
  },
);

export const reviewHostelApplication = catchAsync(
  async (req: Request, res: Response) => {
    const user = res.locals.user as { tenantId: string };
    const { status, rejectionReason } = req.body;

    const application = await hostelService.reviewHostelApplication(
      req.params.id as string,
      user.tenantId,
      status,
      rejectionReason,
    );

    res.status(200).json({
      status: 'success',
      message: `Application ${status.toLowerCase()} successfully`,
      data: application,
    });
  },
);
