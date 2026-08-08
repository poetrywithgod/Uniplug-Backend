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
  '/offerings',
  requireRole(ROLES.HOD),
  validateRequest(schemas.createCourseOfferingSchema),
  controller.handleCreateCourseOffering,
);
router.get(
  '/offerings',
  requireRole(ROLES.HOD, ROLES.LECTURER, ROLES.STUDENT, ROLES.SCHOOL_ADMIN),
  controller.handleGetCourseOfferings,
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
