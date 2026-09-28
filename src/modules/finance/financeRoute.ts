import express from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { AccessGroups } from '../../configs/rolesConfig';
import { validateRequest, validateQuery } from '../../utils/validation';
import * as schemas from './financeSchemas';
import * as controller from './financeController';

const router = express.Router();

router.use(requireAuth);

// 1. Student self-service: Check my financial clearance
router.get(
  '/clearance/my-status',
  requireRole(ROLES.STUDENT),
  controller.handleGetMyClearance,
);

// 2. Finance Operations: Strictly restricted to finance personnel and administrative supervisors
router.use(requireRole(AccessGroups.FINANCE_OPERATIONS));

// Overview & Monitoring
router.get('/metrics', controller.handleGetFinancialMetrics);

// Fee Catalog & Lifecycle Management
router.get(
  '/fees',
  validateQuery(schemas.getFeeCatalogQuerySchema),
  controller.handleGetFeeCatalog,
);
router.post(
  '/fees',
  validateRequest(schemas.createFeeStructureSchema),
  controller.handleCreateFeeStructure,
);
router.patch(
  '/fees/:id/status',
  validateRequest(schemas.updateFeeStatusSchema),
  controller.handleUpdateFeeStatus,
);

// Payment Auditing & Transaction Ledger
router.get(
  '/transactions',
  validateQuery(schemas.getTransactionsQuerySchema),
  controller.handleGetPaymentTransactions,
);
router.get('/transactions/:id', controller.handleGetTransactionById);
router.post(
  '/transactions/record',
  validateRequest(schemas.recordManualPaymentSchema),
  controller.handleRecordManualPayment,
);

// Refund Processing & Adjudication
router.get('/refunds', controller.handleGetRefundClaims);
router.patch(
  '/refunds/:id/adjudicate',
  validateRequest(schemas.adjudicateRefundSchema),
  controller.handleAdjudicateRefund,
);

// Financial Reports & Export
router.get('/reports', controller.handleGetFinancialReport);
router.get('/reports/export', controller.handleExportFinancialReport);

// Student Financial Clearance Inspection
router.get('/clearance/:studentId', controller.handleGetStudentClearance);

export default router;
