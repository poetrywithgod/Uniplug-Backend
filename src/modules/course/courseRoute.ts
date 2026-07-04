import express from 'express';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as schemas from './courseSchemas';
import * as controller from './courseController';

const router = express.Router();

router.use(requireAuth);

// --- Departments ---
router.post(
  '/departments',
  requireRole('SCHOOL_ADMIN'),
  validateRequest(schemas.createDepartmentSchema),
  controller.handleCreateDepartment
);
router.get(
  '/departments',
  requireRole('SCHOOL_ADMIN', 'HOD'),
  controller.handleGetDepartments
);

// --- Faculties ---
router.post(
  '/faculties',
  requireRole('SCHOOL_ADMIN'),
  validateRequest(schemas.createFacultySchema),
  controller.handleCreateFaculty
);
router.get(
  '/faculties',
  requireRole('SCHOOL_ADMIN', 'HOD'),
  controller.handleGetFaculties
);


// --- Courses ---
router.post(
  '/courses',
  requireRole('HOD'),
  validateRequest(schemas.createCourseSchema),
  controller.handleCreateCourse
);
router.get(
  '/courses',
  requireRole('HOD', 'SCHOOL_ADMIN', 'LECTURER'),
  controller.handleGetCourses
);

// --- Course Offerings ---
router.post(
  '/course-offerings',
  requireRole('HOD'),
  validateRequest(schemas.createCourseOfferingSchema),
  controller.handleCreateCourseOffering
);
router.get(
  '/course-offerings',
  requireRole('HOD', 'LECTURER', 'STUDENT'),
  controller.handleGetCourseOfferings
);

// --- Lecturer Assignments ---
router.post(
  '/course-assignments/request',
  requireRole('LECTURER'),
  validateRequest(schemas.createCourseAssignmentSchema),
  controller.handleRequestCourseAssignment
);
router.patch(
  '/course-assignments/:assignmentId/approve',
  requireRole('HOD'),
  validateRequest(schemas.approveCourseAssignmentSchema),
  controller.handleApproveCourseAssignment
);
router.get(
  '/course-assignments/pending',
  requireRole('HOD'),
  controller.handleGetPendingAssignments
);

// --- Student Enrollments ---
router.post(
  '/course-enrollments/register',
  requireRole('STUDENT'),
  validateRequest(schemas.registerCourseEnrollmentSchema),
  controller.handleRegisterCourseEnrollments
);
router.get(
  '/course-enrollments/my-courses',
  requireRole('STUDENT'),
  controller.handleGetStudentEnrollments
);

// --- Lecturer Grading & Roster ---
router.get(
  '/course-offerings/:courseOfferingId/students',
  requireRole('LECTURER', 'HOD', 'SCHOOL_ADMIN'),
  controller.handleGetEnrolledStudents
);
router.post(
  '/course-offerings/:courseOfferingId/grades',
  requireRole('LECTURER'),
  validateRequest(schemas.submitGradesSchema),
  controller.handleSubmitGrades
);

export default router;
