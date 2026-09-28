import { ROLES, AllowedRole } from '../middlewares/authMiddleware';

/**
 * Centralized Access Groups defining role combinations and authorization intent
 * across Uniplug institutional modules.
 */
export const AccessGroups = {
  // Global & Administrative Supervisors
  SUPER_ADMIN_ONLY: [ROLES.SUPER_ADMIN] as const,
  SCHOOL_ADMIN_ONLY: [ROLES.SCHOOL_ADMIN] as const,
  ADMINISTRATIVE_SUPERVISORS: [ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN] as const,

  // 1. Finance Operations: Restricted to finance personnel and administrative supervisors
  FINANCE_OPERATIONS: [
    ROLES.FINANCE_OFFICER,
    ROLES.SCHOOL_ADMIN,
    ROLES.SUPER_ADMIN,
  ] as const,

  // 2. Examination & Records: Restricted to examination officers and administrative supervisors
  EXAMINATION_AND_RECORDS: [
    ROLES.EXAMINATION_OFFICER,
    ROLES.SCHOOL_ADMIN,
    ROLES.SUPER_ADMIN,
  ] as const,

  // Application & Admission Management
  MANAGE_APPLICATIONS: [
    ROLES.SCHOOL_ADMIN,
    ROLES.ADMISSION_OFFICER,
  ] as const,

  // Academic Structure (Faculties & Departments)
  MANAGE_DEPARTMENTS: [ROLES.SCHOOL_ADMIN] as const,
  VIEW_DEPARTMENTS: [
    ROLES.SCHOOL_ADMIN,
    ROLES.HOD,
    ROLES.ADMISSION_OFFICER,
    ROLES.LECTURER,
    ROLES.STUDENT,
    ROLES.APPLICANT,
  ] as const,
  MANAGE_PROGRAMMES: [ROLES.SCHOOL_ADMIN] as const,
  VIEW_PROGRAMMES: [
    ROLES.SCHOOL_ADMIN,
    ROLES.HOD,
    ROLES.ADMISSION_OFFICER,
    ROLES.STUDENT,
    ROLES.APPLICANT,
  ] as const,

  // Courses & Course Offerings
  CREATE_COURSES: [ROLES.HOD] as const,
  VIEW_COURSES: [
    ROLES.HOD,
    ROLES.SCHOOL_ADMIN,
    ROLES.LECTURER,
    ROLES.STUDENT,
  ] as const,

  // Results & Grade Workflow (Lecturer -> HOD Review -> Senate/Exam Records Publishing)
  COURSE_RESULTS_VIEW: [
    ROLES.HOD,
    ROLES.LECTURER,
    ROLES.SCHOOL_ADMIN,
    ROLES.EXAMINATION_OFFICER,
  ] as const,
  COURSE_RESULTS_HOD_APPROVAL: [
    ROLES.HOD,
    ROLES.SCHOOL_ADMIN,
  ] as const,
  COURSE_RESULTS_SENATE_PUBLISH: [
    ROLES.EXAMINATION_OFFICER,
    ROLES.SCHOOL_ADMIN,
    ROLES.SUPER_ADMIN,
  ] as const,

  // Hostel Operations
  MANAGE_HOSTELS: [
    ROLES.HOSTEL_MANAGER,
    ROLES.HOSTEL_STAFF,
  ] as const,

  // Single Role Guards
  STUDENT_ONLY: [ROLES.STUDENT] as const,
  LECTURER_ONLY: [ROLES.LECTURER] as const,
  APPLICANT_ONLY: [ROLES.APPLICANT] as const,
} as const;

export type AccessGroupKey = keyof typeof AccessGroups;

/**
 * Helper to get the allowed roles array for an access group key.
 */
export const getRolesForGroup = (groupKey: AccessGroupKey): readonly AllowedRole[] => {
  return AccessGroups[groupKey];
};
