import express from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as schemas from './courseSchemas';
import * as controller from './courseController';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(ROLES.STUDENT));

// POST /api/v1/student/course-registrations
router.post(
  '/course-registrations',
  validateRequest(schemas.registerCourseEnrollmentSchema),
  controller.handleRegisterCourseEnrollments,
);

// GET /api/v1/student/my-courses
router.get('/my-courses', controller.handleGetStudentEnrollments);

// GET /api/v1/student/results
router.get('/results', controller.handleGetStudentAcademicResults);

// GET /api/v1/student/programme-enrollments
router.get(
  '/programme-enrollments',
  controller.handleGetMyProgrammeEnrollments,
);

export default router;
