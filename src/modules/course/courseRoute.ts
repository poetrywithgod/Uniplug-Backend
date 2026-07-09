import express from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as schemas from './courseSchemas';
import * as controller from './courseController';

const router = express.Router();

router.use(requireAuth);

// --- Departments ---
router.post(
  '/departments',
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createDepartmentSchema),
  controller.handleCreateDepartment
);
router.get(
  '/departments',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD),
  controller.handleGetDepartments
);

// --- Faculties ---
router.post(
  '/faculties',
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createFacultySchema),
  controller.handleCreateFaculty
);
router.get(
  '/faculties',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD),
  controller.handleGetFaculties
);

// --- Programmes ---
router.post(
  '/programmes',
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createProgrammeSchema),
  controller.handleCreateProgramme
);
router.get(
  '/programmes',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD, ROLES.APPLICANT, ROLES.STUDENT),
  controller.handleGetProgrammes
);

// --- Programme Enrollments ---
router.post(
  '/enrollments',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.ADMISSION_OFFICER),
  validateRequest(schemas.createProgrammeEnrollmentSchema),
  controller.handleCreateProgrammeEnrollment
);
router.get(
  '/students/:studentId/enrollments',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD, ROLES.STUDENT, ROLES.ADMISSION_OFFICER),
  controller.handleGetStudentProgrammeEnrollments
);

// --- Courses ---
router.post(
  '/courses',
  requireRole(ROLES.HOD),
  validateRequest(schemas.createCourseSchema),
  controller.handleCreateCourse
);
router.get(
  '/courses',
  requireRole(ROLES.HOD, ROLES.SCHOOL_ADMIN, ROLES.LECTURER),
  controller.handleGetCourses
);

// --- Course Offerings ---
router.post(
  '/course-offerings',
  requireRole(ROLES.HOD),
  validateRequest(schemas.createCourseOfferingSchema),
  controller.handleCreateCourseOffering
);
router.get(
  '/course-offerings',
  requireRole(ROLES.HOD, ROLES.LECTURER, ROLES.STUDENT),
  controller.handleGetCourseOfferings
);

// --- Lecturer Assignments ---
router.post(
  '/course-assignments/request',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.createCourseAssignmentSchema),
  controller.handleRequestCourseAssignment
);
router.patch(
  '/course-assignments/:assignmentId/approve',
  requireRole(ROLES.HOD),
  validateRequest(schemas.approveCourseAssignmentSchema),
  controller.handleApproveCourseAssignment
);
router.get(
  '/course-assignments/pending',
  requireRole(ROLES.HOD),
  controller.handleGetPendingAssignments
);

// --- Student Enrollments ---
router.post(
  '/course-enrollments/register',
  requireRole(ROLES.STUDENT),
  validateRequest(schemas.registerCourseEnrollmentSchema),
  controller.handleRegisterCourseEnrollments
);
router.get(
  '/course-enrollments/my-courses',
  requireRole(ROLES.STUDENT),
  controller.handleGetStudentEnrollments
);

// --- Lecturer Grading & Roster ---
router.get(
  '/course-offerings/:courseOfferingId/students',
  requireRole(ROLES.LECTURER, ROLES.HOD, ROLES.SCHOOL_ADMIN),
  controller.handleGetEnrolledStudents
);
router.post(
  '/course-offerings/:courseOfferingId/grades',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.submitGradesSchema),
  controller.handleSubmitGrades
);

export default router;
