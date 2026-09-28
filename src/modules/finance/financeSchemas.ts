import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  name: z.string().min(3, 'Fee name must be at least 3 characters'),
  category: z.enum([
    'TUITION',
    'ACCEPTANCE',
    'HOSTEL',
    'DEPARTMENTAL',
    'EXAMINATION',
    'LATE_REGISTRATION',
    'CONVOCATION',
    'OTHER',
  ]),
  amount: z.coerce.number().positive('Fee amount must be greater than zero'),
  currency: z.string().default('NGN'),
  academicSession: z.string().min(4, 'Academic session is required (e.g. 2024/2025)'),
  semester: z.enum(['FIRST_SEMESTER', 'SECOND_SEMESTER']).optional(),
  level: z.coerce.number().optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional(),
  programmeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid programme ID').optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
});

export const updateFeeStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
});

export const getFeeCatalogQuerySchema = z.object({
  academicSession: z.string().optional(),
  category: z.enum([
    'TUITION',
    'ACCEPTANCE',
    'HOSTEL',
    'DEPARTMENTAL',
    'EXAMINATION',
    'LATE_REGISTRATION',
    'CONVOCATION',
    'OTHER',
  ]).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  departmentId: z.string().optional(),
  level: z.coerce.number().optional(),
});

export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED']).optional(),
  channel: z.enum(['CARD', 'BANK_TRANSFER', 'BANK_BRANCH', 'USSD', 'MANUAL_RECEIPT']).optional(),
  session: z.string().optional(),
});

export const recordManualPaymentSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID'),
  feeStructureId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid fee structure ID').optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  reference: z.string().min(3, 'Payment reference/teller is required'),
  channel: z.enum(['BANK_TRANSFER', 'BANK_BRANCH', 'MANUAL_RECEIPT']).default('MANUAL_RECEIPT'),
  session: z.string().min(4, 'Session is required'),
  description: z.string().optional(),
});

export const adjudicateRefundSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'DISBURSED', 'UNDER_REVIEW']),
  amountApproved: z.coerce.number().positive().optional(),
  adjudicationNote: z.string().min(2, 'Adjudication note/reason is required'),
  disbursementRef: z.string().optional(),
});

export const createRefundClaimSchema = z.object({
  transactionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid transaction ID'),
  amountRequested: z.coerce.number().positive('Requested amount must be positive'),
  reason: z.string().min(5, 'Reason for refund must be at least 5 characters'),
});
