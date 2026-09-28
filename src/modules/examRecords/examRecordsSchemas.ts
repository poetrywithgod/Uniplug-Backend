import { z } from 'zod';

export const publishOfferingResultsSchema = z.object({
  remarks: z.string().max(250).optional(),
});

export const flagDiscrepancySchema = z.object({
  reason: z.string().min(5, 'Discrepancy explanation must be at least 5 characters'),
});

export const requestTranscriptSchema = z.object({
  type: z.enum(['OFFICIAL', 'UNOFFICIAL']).default('OFFICIAL'),
  recipientName: z.string().min(2, 'Recipient institution or organization name is required'),
  recipientEmail: z.string().email('Valid recipient email address is required').optional(),
  deliveryAddress: z.string().optional(),
  purpose: z.string().min(3, 'Purpose for transcript is required (e.g. Graduate Admission, Employment)'),
});

export const adjudicateTranscriptSchema = z.object({
  status: z.enum(['VERIFYING', 'READY_TO_ISSUE', 'ISSUED', 'REJECTED']),
  holdReason: z.string().optional(),
});

export const resultBatchesQuerySchema = z.object({
  academicSession: z.string().optional(),
  semester: z.enum(['FIRST_SEMESTER', 'SECOND_SEMESTER']).optional(),
  departmentId: z.string().optional(),
  status: z.enum(['PENDING_HOD', 'HOD_APPROVED', 'PUBLISHED', 'DISCREPANCY']).optional(),
});

export const graduationCohortQuerySchema = z.object({
  academicSession: z.string().optional(),
  departmentId: z.string().optional(),
  status: z.enum(['ELIGIBLE', 'NOT_ELIGIBLE', 'UNDER_REVIEW', 'CLEARED']).optional(),
});
