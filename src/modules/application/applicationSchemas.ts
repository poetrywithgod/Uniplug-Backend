import { z } from 'zod';

import {
  normalizeEmail,
  normalizeName,
  normalizePhoneNumber,
} from '../../utils/sanitize';

export const startApplicationSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
});

export const personalDetailsSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
    phoneNumber: z.string().min(8, 'Provide a valid phone number').max(20),
    email: z.string().email('Provide a valid email address'),
  })
  .transform((data) => ({
    ...data,
    firstName: normalizeName(data.firstName),
    lastName: normalizeName(data.lastName),
    email: normalizeEmail(data.email),
    phoneNumber: normalizePhoneNumber(data.phoneNumber),
    dateOfBirth: new Date(data.dateOfBirth),
  }));

export const academicHistorySchema = z.object({
  institution: z.string().min(2, 'Institution name is required'),
  highestQualification: z.string().min(2, 'Highest qualification is required'),
  graduationYear: z
    .number()
    .int()
    .min(1900, 'Graduation year must be valid')
    .max(new Date().getFullYear(), 'Graduation year cannot be in the future'),
  overallGrade: z.string().min(1, 'Overall grade is required'),
});

export const programmeSelectionSchema = z.object({
  faculty: z.string().min(2, 'Faculty is required'),
  course: z.string().min(2, 'Course/Programme is required'),
  studyMode: z.enum(['FULL_TIME', 'PART_TIME', 'DISTANCE_LEARNING']),
});

export const documentSignatureSchema = z.object({
  documentType: z.enum([
    'TRANSCRIPT',
    'ID_PASSPORT',
    'PASSPORT_PHOTOGRAPH',
    'CERTIFICATE',
    'JAMB_RESULT',
    'BIRTH_CERTIFICATE',
    'LGA_CERTIFICATE',
  ]),
  fileName: z.string().min(1, 'File name is required'),
});

export const addDocumentSchema = z.object({
  documentType: z.enum([
    'TRANSCRIPT',
    'ID_PASSPORT',
    'PASSPORT_PHOTOGRAPH',
    'CERTIFICATE',
    'JAMB_RESULT',
    'BIRTH_CERTIFICATE',
    'LGA_CERTIFICATE',
  ]),
  fileUrl: z.string().url('Must be a valid Cloudinary URL'),
});
