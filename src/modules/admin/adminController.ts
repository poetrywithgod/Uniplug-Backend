import { NextFunction, Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import {
  createHostelAdmin,
  createLecturer,
  createHOD,
  createAdmissionOfficer,
  createExaminationOfficer,
  createFinanceOfficer,
  createHostelStaff,
  getApplications,
  rejectStaffAccount,
  updateApplicationStatus,
  verifyStaffAccount,
  createSession,
  activateSession,
  createSemester,
  activateSemester,
  getSessions,
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

export const onboardHOD = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createHOD(req.body, res.locals.user);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const onboardAdmissionOfficer = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createAdmissionOfficer(req.body, res.locals.user);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const onboardExaminationOfficer = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createExaminationOfficer(req.body, res.locals.user);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const onboardFinanceOfficer = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createFinanceOfficer(req.body, res.locals.user);

    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const onboardHostelStaff = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createHostelStaff(req.body, res.locals.user);

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

export const handleCreateSession = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await createSession(req.body, res.locals.user);
    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const handleActivateSession = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await activateSession(id, res.locals.user);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const handleCreateSemester = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;
    const result = await createSemester(
      sessionId,
      req.body,
      res.locals.user,
    );
    res.status(201).json({
      status: 'success',
      ...result,
    });
  },
);

export const handleActivateSemester = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await activateSemester(id, res.locals.user);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);


export const handleGetSessions = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const result = await getSessions(res.locals.user);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

