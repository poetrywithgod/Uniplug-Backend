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
  facultyId: z.string().min(1, 'Faculty ID is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
  studyMode: z.enum(['FULL_TIME', 'PART_TIME', 'DISTANCE_LEARNING']),
  admissionPathway: z.enum(['UNDERGRADUATE', 'DIRECT_ENTRY', 'PART_TIME', 'POSTGRADUATE']),
});


export const DOCUMENT_TYPES = [
  'OLEVEL_RESULT',
  'HIGHER_QUALIFICATION_CERTIFICATE',
  'TRANSCRIPT',
  'JAMB_RESULT',
  'PASSPORT_PHOTOGRAPH',
  'BIRTH_CERTIFICATE',
  'LGA_CERTIFICATE',
  'ID_PASSPORT',
  'NYSC_CERTIFICATE',
  'CV',
  'STATEMENT_OF_PURPOSE',
  'REFERENCE_LETTERS',
  'CERTIFICATE',
  'OTHER',
] as const;

export const documentSignatureSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  fileName: z.string().min(1, 'File name is required'),
});

export const addDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  fileUrl: z.string().url('Must be a valid Cloudinary URL'),
});

export const declineOfferSchema = z.object({
  declineReason: z.string().optional(),
});


