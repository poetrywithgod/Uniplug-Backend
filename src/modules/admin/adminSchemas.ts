import { z } from 'zod';

import { normalizeEmail, normalizeName } from '../../utils/sanitize';

const staffSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100),
  staffId: z.string().min(2, 'Staff ID is required').max(40),
  email: z.string().email('Provide a valid email address'),
  department: z.string().min(2, 'Department is required').max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'Password must include uppercase, lowercase, and number',
    ),
});

export const createLecturerSchema = staffSchema.transform((data) => ({
  ...data,
  fullName: normalizeName(data.fullName),
  email: normalizeEmail(data.email),
  department: data.department.trim(),
  staffId: data.staffId.trim(),
}));

export const createStaffSchema = createLecturerSchema;


export const createHostelAdminSchema = staffSchema.transform((data) => ({
  ...data,
  fullName: normalizeName(data.fullName),
  email: normalizeEmail(data.email),
  department: data.department.trim(),
  staffId: data.staffId.trim(),
}));

export const reviewStaffSchema = z.object({
  remark: z.string().max(250).optional(),
});

export const getApplicationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .enum([
      'NOT_STARTED',
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
    ])
    .optional(),
  program: z.string().optional(),
  session: z.string().optional(),
  search: z.string().optional(),
});

export const updateApplicationStatusSchema = z
  .object({
    status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'REJECTED' && !data.rejectionReason?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when status is REJECTED',
      path: ['rejectionReason'],
    },
  );

export const createSessionSchema = z.object({
  name: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, 'Session name must be in YYYY/YYYY format (e.g. 2025/2026)'),
  isActive: z.boolean().optional().default(false),
});

export const createSemesterSchema = z.object({
  name: z.string().min(3, 'Semester name must be at least 3 characters'),
  isActive: z.boolean().optional().default(false),
});

