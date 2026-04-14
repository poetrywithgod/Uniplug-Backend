import { z } from 'zod';

import { normalizeEmail, normalizeName } from '../../utils/sanitize';

export const createTenantSchema = z.object({
  schoolName: z.string().min(2, 'School name must be at least 2 characters').max(120),
  schoolId: z.string().min(2, 'School ID is required').max(40),
  email: z.string().email('Provide a valid email address'),
  school: z.string().min(2, 'School is required').max(120),
  address: z.string().min(5, 'Address is required').max(200),
  postalCode: z.string().min(3, 'Postal code is required').max(20),
}).transform((data) => ({
  ...data,
  schoolName: normalizeName(data.schoolName),
  schoolId: data.schoolId.trim(),
  email: normalizeEmail(data.email),
  school: data.school.trim(),
  address: data.address.trim(),
  postalCode: data.postalCode.trim(),
}));

export const createSchoolAdminSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters').max(120),
  schoolId: z.string().min(2, 'School ID is required').max(40),
  email: z.string().email('Provide a valid email address'),
  school: z.string().min(2, 'School is required').max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 'Password must include uppercase, lowercase, and number'),
}).transform((data) => ({
  ...data,
  fullName: normalizeName(data.fullName),
  schoolId: data.schoolId.trim(),
  email: normalizeEmail(data.email),
  school: data.school.trim(),
}));

export const reviewSchoolAdminSchema = z.object({
  remark: z.string().max(250).optional(),
});
