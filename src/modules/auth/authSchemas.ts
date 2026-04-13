import { z } from 'zod';

import {
  normalizeEmail,
  normalizeName,
  normalizePhoneNumber,
} from '../../utils/sanitize';

const roleSchema = z.enum(['applicant', 'parent']);

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50),
    email: z.string().email('Provide a valid email address'),
    phoneNumber: z.string().min(8, 'Provide a valid phone number').max(20),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        'Password must include uppercase, lowercase, and number',
      ),
    role: roleSchema,
  })
  .transform((data) => ({
    ...data,
    firstName: normalizeName(data.firstName),
    lastName: normalizeName(data.lastName),
    email: normalizeEmail(data.email),
    phoneNumber: normalizePhoneNumber(data.phoneNumber),
    role: data.role.toLowerCase() as 'applicant' | 'parent',
  }));

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email('Provide a valid email address')
    .transform(normalizeEmail),
  otpCode: z.string().regex(/^\d{6}$/, 'OTP code must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z
    .string()
    .email('Provide a valid email address')
    .transform(normalizeEmail),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Provide a valid email address')
    .transform(normalizeEmail),
  password: z.string().min(1, 'Password is required'),
});
