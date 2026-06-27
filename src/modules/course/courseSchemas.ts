import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(100),
  hodId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid HOD User ID format').optional(),
});

export const createCourseSchema = z.object({
  courseName: z.string().min(2, 'Course name must be at least 2 characters').max(120),
  courseCode: z.string().min(2, 'Course code must be at least 2 characters').max(20),
  creditUnits: z.number().int().min(1).max(10),
  level: z.number().int().min(100).max(1000), // e.g. 100, 200, 300, 400...
  category: z.enum(['CORE', 'ELECTIVE', 'GENERAL_STUDIES']),
  description: z.string().max(500).optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID format'),
});

export const createCourseOfferingSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID format'),
  academicSession: z.string().regex(/^\d{4}\/\d{4}$/, 'Session must be in format YYYY/YYYY (e.g. 2025/2026)'),
  semester: z.string().min(2, 'Semester is required'),
});

export const createCourseAssignmentSchema = z.object({
  courseOfferingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Offering ID format'),
  lecturerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lecturer ID format'),
  role: z.enum(['LEAD_LECTURER', 'CO_LECTURER', 'TA']).optional(),
});

export const approveCourseAssignmentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const registerCourseEnrollmentSchema = z.object({
  courseOfferingIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Offering ID format')).min(1, 'Select at least one course to register'),
});

export const submitGradesSchema = z.object({
  grades: z.array(
    z.object({
      studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student ID format'),
      score: z.number().min(0).max(100),
    })
  ).min(1, 'At least one student grade is required'),
});
