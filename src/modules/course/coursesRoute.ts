import express from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as schemas from './courseSchemas';
import * as controller from './courseController';

const router = express.Router();

router.use(requireAuth);

// --- Courses ---
router.post(
  '/',
  requireRole(ROLES.HOD),
  validateRequest(schemas.createCourseSchema),
  controller.handleCreateCourse,
);
router.get(
  '/',
  requireRole(ROLES.HOD, ROLES.SCHOOL_ADMIN, ROLES.LECTURER),
  controller.handleGetCourses,
);

// --- Course Offerings ---
router.post(
  '/course-offerings',
  requireRole(ROLES.HOD),
  validateRequest(schemas.createCourseOfferingSchema),
  controller.handleCreateCourseOffering,
);
router.get(
  '/course-offerings',
  requireRole(ROLES.HOD, ROLES.LECTURER, ROLES.STUDENT, ROLES.SCHOOL_ADMIN),
  controller.handleGetCourseOfferings,
);

// --- Course Offering Schedule (Lecturer) ---
router.post(
  '/course-offerings/:courseOfferingId/schedule',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.setCourseScheduleSchema),
  controller.handleSetSchedule,
);
router.put(
  '/course-offerings/:courseOfferingId/schedule',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.setCourseScheduleSchema),
  controller.handleSetSchedule,
);
router.delete(
  '/course-offerings/:courseOfferingId/schedule',
  requireRole(ROLES.LECTURER),
  controller.handleDeleteSchedule,
);

// --- Course Offering Syllabus (Lecturer) ---
router.post(
  '/course-offerings/:courseOfferingId/syllabus',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.setCourseSyllabusSchema),
  controller.handleSetSyllabus,
);
router.put(
  '/course-offerings/:courseOfferingId/syllabus',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.setCourseSyllabusSchema),
  controller.handleSetSyllabus,
);
router.delete(
  '/course-offerings/:courseOfferingId/syllabus',
  requireRole(ROLES.LECTURER),
  controller.handleDeleteSyllabus,
);

// --- Course Offering Materials (Lecturer) ---
router.post(
  '/course-offerings/:courseOfferingId/materials',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.addCourseMaterialsSchema),
  controller.handleAddMaterials,
);
router.delete(
  '/course-offerings/:courseOfferingId/materials/:materialId',
  requireRole(ROLES.LECTURER),
  controller.handleDeleteMaterial,
);

// --- Course Offering Students & Grades ---
router.get(
  '/course-offerings/:courseOfferingId/students',
  requireRole(ROLES.LECTURER, ROLES.HOD, ROLES.SCHOOL_ADMIN),
  controller.handleGetEnrolledStudents,
);
router.post(
  '/course-offerings/:courseOfferingId/grades',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.submitGradesSchema),
  controller.handleSubmitGrades,
);


// --- Lecturer Course Offerings & Dashboard ---
router.get(
  '/lecturer/my-courses',
  requireRole(ROLES.LECTURER),
  controller.handleGetLecturerCourses,
);

// --- Course Assignments (Lecturer <-> HOD) ---
router.post(
  '/assignments/request',
  requireRole(ROLES.LECTURER),
  validateRequest(schemas.createCourseAssignmentSchema),
  controller.handleRequestCourseAssignment,
);
router.patch(
  '/assignments/:assignmentId/approve',
  requireRole(ROLES.HOD),
  validateRequest(schemas.approveCourseAssignmentSchema),
  controller.handleApproveCourseAssignment,
);
router.get(
  '/assignments/pending',
  requireRole(ROLES.HOD),
  controller.handleGetPendingAssignments,
);

export default router;
