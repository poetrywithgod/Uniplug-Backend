import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters').max(100),
  hodId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid HOD User ID format').optional(),
  facultyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Faculty ID format').optional(),
});

export const createFacultySchema = z.object({
  name: z.string().min(3, 'Faculty name must be at least 3 characters').max(100),
  code: z.string().min(2, 'Faculty code must be at least 2 characters').max(20),
});

export const createCourseSchema = z.object({
  courseName: z.string().min(2, 'Course name must be at least 2 characters').max(120),
  courseCode: z.string().min(2, 'Course code must be at least 2 characters').max(20),
  creditUnits: z.number().int().min(1).max(10),
  level: z.number().int().min(100).max(1000), // e.g. 100, 200, 300, 400...
  category: z.enum(['CORE', 'ELECTIVE', 'GENERAL_STUDIES']),
  semester: z.enum(['FIRST_SEMESTER', 'SECOND_SEMESTER']),
  description: z.string().max(500).optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID format'),
});

export const SEMESTERS = ['FIRST_SEMESTER', 'SECOND_SEMESTER'] as const;

export const createCourseOfferingSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Course ID format'),
  lecturerIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lecturer ID format')).optional(),
});

export const createCourseAssignmentSchema = z.object({
  courseOfferingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Offering ID format'),
  lecturerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Lecturer ID format').optional(),
  role: z.enum(['LEAD_LECTURER', 'CO_LECTURER', 'TA']).optional(),
});

export const approveCourseAssignmentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const registerCourseEnrollmentSchema = z.object({
  courseOfferingIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Offering ID format')).min(1, 'Select at least one course to register'),
});

export const setCourseScheduleSchema = z.object({
  venue: z.string().min(2, 'Venue must be at least 2 characters').max(100),
  day: z.enum([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]),
  time: z.string().min(2, 'Time is required').max(50), // e.g. "1:30pm - 2:30pm" or "10:00 AM"
});

export const setCourseSyllabusSchema = z.object({
  title: z.string().max(150).optional(),
  description: z.string().max(2000).optional(),
  fileUrl: z.string().url('Invalid syllabus document URL').optional(),
  fileName: z.string().max(200).optional(),
});

export const addCourseMaterialsSchema = z.object({
  materials: z
    .array(
      z.object({
        title: z.string().min(1, 'Material title is required').max(150),
        fileUrl: z.string().url('Invalid material file URL'),
        fileType: z.string().min(1, 'File type is required').max(50), // e.g. "PDF", "IMAGE", "SLIDES"
        fileSize: z.number().int().positive().optional(),
      })
    )
    .min(1, 'At least one material must be provided'),
});

export const submitGradesSchema = z.object({
  grades: z
    .array(
      z.object({
        studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student ID format'),
        caScore: z.number().min(0).max(30).optional(),
        examScore: z.number().min(0).max(70).optional(),
        score: z.number().min(0).max(100).optional(),
        remarks: z.string().max(200).optional(),
      })
    )
    .min(1, 'At least one student grade is required'),
});

export const createProgrammeSchema = z.object({
  name: z.string().min(3, 'Programme name must be at least 3 characters').max(100),
  code: z.string().min(2, 'Programme code must be at least 2 characters').max(20),
  durationYears: z.number().int().min(1).max(10),
  creditRequirement: z.number().int().min(1).max(1000),
  category: z.string().min(2, 'Category is required').max(100),
  departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Department ID format'),
});

export const createProgrammeEnrollmentSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student User ID format'),
  programmeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Programme ID format'),
  entryLevel: z.string().min(2, 'Entry level is required'),
  currentLevel: z.string().min(2, 'Current level is required'),
  admissionPathway: z.enum(['UNDERGRADUATE', 'DIRECT_ENTRY', 'PART_TIME', 'POSTGRADUATE']),
});
