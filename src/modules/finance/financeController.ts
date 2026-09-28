import { NextFunction, Request, Response } from 'express';
import createError from 'http-errors';
import catchAsync from '../../utils/catchAsync';
import { financeService } from './financeService';

export const handleGetFinancialMetrics = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const data = await financeService.getFinancialMetrics(user.tenantId);
    res.status(200).json({
      status: 'success',
      data,
    });
  },
);

export const handleCreateFeeStructure = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const fee = await financeService.createFeeStructure(user.tenantId, user.id, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Fee structure created successfully.',
      fee,
    });
  },
);

export const handleGetFeeCatalog = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const fees = await financeService.getFeeCatalog(user.tenantId, req.query);
    res.status(200).json({
      status: 'success',
      total: fees.length,
      fees,
    });
  },
);

export const handleUpdateFeeStatus = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const id = req.params.id as string;
    const fee = await financeService.updateFeeStatus(user.tenantId, id, req.body.status);
    res.status(200).json({
      status: 'success',
      message: `Fee structure status updated to ${req.body.status}.`,
      fee,
    });
  },
);

export const handleGetPaymentTransactions = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const result = await financeService.getPaymentTransactions(user.tenantId, req.query);
    res.status(200).json({
      status: 'success',
      ...result,
    });
  },
);

export const handleGetTransactionById = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const id = req.params.id as string;
    const transaction = await financeService.getTransactionById(user.tenantId, id);
    res.status(200).json({
      status: 'success',
      transaction,
    });
  },
);

export const handleRecordManualPayment = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const transaction = await financeService.recordManualPayment(
      user.tenantId,
      user.id,
      req.body,
    );
    res.status(201).json({
      status: 'success',
      message: 'Payment recorded and reconciled successfully.',
      transaction,
    });
  },
);

export const handleGetRefundClaims = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const status = req.query.status as any;
    const claims = await financeService.getRefundClaims(user.tenantId, status);
    res.status(200).json({
      status: 'success',
      total: claims.length,
      claims,
    });
  },
);

export const handleAdjudicateRefund = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const id = req.params.id as string;
    const claim = await financeService.adjudicateRefundClaim(
      user.tenantId,
      user.id,
      id,
      req.body,
    );
    res.status(200).json({
      status: 'success',
      message: `Refund claim adjudicated with status ${req.body.status}.`,
      claim,
    });
  },
);

export const handleGetStudentClearance = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const studentId = req.params.studentId as string;
    const clearance = await financeService.getStudentFinancialClearanceStatus(
      user.tenantId,
      studentId,
    );
    res.status(200).json({
      status: 'success',
      clearance,
    });
  },
);

export const handleGetMyClearance = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId || !user?.id) {
      throw createError(400, 'Authentication and tenant context are required.');
    }

    const clearance = await financeService.getStudentFinancialClearanceStatus(
      user.tenantId,
      user.id,
    );
    res.status(200).json({
      status: 'success',
      clearance,
    });
  },
);

export const handleGetFinancialReport = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const session = req.query.session as string | undefined;
    const report = await financeService.getFinancialReport(user.tenantId, { session });
    res.status(200).json({
      status: 'success',
      report,
    });
  },
);

export const handleExportFinancialReport = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const user = res.locals.user;
    if (!user?.tenantId) {
      throw createError(400, 'Tenant context is required.');
    }

    const session = req.query.session as string | undefined;
    const format = (req.query.format as string) || 'csv';

    if (format === 'csv') {
      const csv = await financeService.exportFinancialReportCSV(user.tenantId, { session });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="finance_report_${session || 'all'}.csv"`);
      res.status(200).send(csv);
    } else {
      // Default: return JSON report for frontend PDF rendering
      const report = await financeService.getFinancialReport(user.tenantId, { session });
      res.status(200).json({
        status: 'success',
        report,
      });
    }
  },
);
