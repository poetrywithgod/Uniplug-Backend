import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import catchAsync from '../../utils/catchAsync';
import { examRecordsService } from './examRecordsService';

export const handleGetOverview = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const data = await examRecordsService.getAcademicWorkflowOverview(user.tenantId);
    res.status(200).json({
      status: 'success',
      data,
    });
  },
);

export const handleGetResultBatches = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const batches = await examRecordsService.getCourseResultBatches(user.tenantId, req.query);
    res.status(200).json({
      status: 'success',
      total: batches.length,
      batches,
    });
  },
);

export const handlePublishResults = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const offeringId = req.params.offeringId as string;
    const result = await examRecordsService.publishOfferingResults(
      user.tenantId,
      user.id,
      offeringId,
      req.body.remarks,
    );

    res.status(200).json({
      status: 'success',
      message: 'Course offering results officially published to students and academic transcripts.',
      result,
    });
  },
);

export const handleFlagDiscrepancy = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const offeringId = req.params.offeringId as string;
    const result = await examRecordsService.flagResultDiscrepancy(
      user.tenantId,
      user.id,
      offeringId,
      req.body.reason,
    );

    res.status(200).json({
      status: 'success',
      message: 'Result batch discrepancy flagged and returned to HOD.',
      result,
    });
  },
);

export const handleGetStudentAudit = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const studentId = req.params.studentId as string;
    const audit = await examRecordsService.getStudentAcademicAudit(user.tenantId, studentId);

    res.status(200).json({
      status: 'success',
      audit,
    });
  },
);

export const handleRunGraduationCohortAudit = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const session = req.query.session as string | undefined;
    const results = await examRecordsService.runGraduationCohortAudit(
      user.tenantId,
      user.id,
      session,
    );

    res.status(200).json({
      status: 'success',
      totalCandidatesAudited: results.length,
      results,
    });
  },
);

export const handleRequestTranscript = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    // If student, use own id; if staff, check query/body for studentId
    const targetStudentId = (user.role === 'STUDENT' ? user.id : req.body.studentId) as string;
    if (!targetStudentId) {
      throw createError(400, 'Student ID is required.');
    }

    const request = await examRecordsService.requestTranscript(
      user.tenantId,
      targetStudentId,
      req.body,
    );

    res.status(201).json({
      status: 'success',
      message: 'Transcript request created and submitted for verification.',
      request,
    });
  },
);

export const handleGetTranscriptRequests = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const status = req.query.status as any;
    const requests = await examRecordsService.getTranscriptRequests(user.tenantId, status);

    res.status(200).json({
      status: 'success',
      total: requests.length,
      requests,
    });
  },
);

export const handleIssueTranscript = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const id = req.params.id as string;
    const result = await examRecordsService.issueOfficialTranscript(user.tenantId, user.id, id);

    res.status(200).json({
      status: 'success',
      message: 'Official academic transcript generated and signed successfully.',
      ...result,
    });
  },
);

export const handleVerifyTranscriptPublic = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const code = req.params.code as string;
    const verification = await examRecordsService.verifyTranscriptByCode(code);

    res.status(200).json({
      status: 'success',
      verification,
    });
  },
);

export const handleClearStudentForGraduation = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const studentId = req.params.studentId as string;
    const session = req.query.session as string | undefined;
    const result = await examRecordsService.clearStudentForGraduation(
      user.tenantId,
      user.id,
      studentId,
      session,
    );

    res.status(200).json({
      status: 'success',
      message: 'Student graduation clearance conferred successfully.',
      ...result,
    });
  },
);
