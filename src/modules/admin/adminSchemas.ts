import { z } from 'zod';

import { normalizeEmail, normalizeName } from '../../utils/sanitize';

const staffSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100),
  staffId: z.string().min(2, 'Staff ID must be at least 2 characters').max(40).optional(),
  email: z.string().email('Provide a valid email address'),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
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
  staffId: data.staffId ? data.staffId.trim() : undefined,
}));

export const createStaffSchema = createLecturerSchema;


export const createHostelAdminSchema = staffSchema.transform((data) => ({
  ...data,
  fullName: normalizeName(data.fullName),
  email: normalizeEmail(data.email),
  staffId: data.staffId ? data.staffId.trim() : undefined,
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

export const getAdmittedStudentsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  programmeId: z.string().optional(),
  session: z.string().optional(),
});

export const getLecturersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  departmentId: z.string().optional(),
});

export const assignHODSchema = z.object({
  hodId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid HOD User ID format'),
});

export const issueOfferSchema = z.object({
  offeredCourse: z.string().min(2, 'Offered course name is required'),
  offeredFaculty: z.string().min(2, 'Offered faculty name is required'),
  offeredDepartmentId: z.string().optional(),
  isAlternativeOffer: z.boolean().optional().default(false),
  remarks: z.string().optional(),
  deadlineDays: z.coerce.number().min(1).max(90).optional().default(14),
});

export const getOffersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED']).optional(),
  isAlternativeOffer: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});


