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
  controller.handleCreateDepartment,
);
router.get(
  '/departments',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD),
  controller.handleGetDepartments,
);

// --- Faculties ---
router.post(
  '/faculties',
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createFacultySchema),
  controller.handleCreateFaculty,
);
router.get(
  '/faculties',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD),
  controller.handleGetFaculties,
);

// --- Programmes ---
router.post(
  '/programmes',
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createProgrammeSchema),
  controller.handleCreateProgramme,
);
router.get(
  '/programmes',
  controller.handleGetProgrammes,
);

// --- Programme Enrollments ---
router.post(
  '/programme-enrollments',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.ADMISSION_OFFICER),
  validateRequest(schemas.createProgrammeEnrollmentSchema),
  controller.handleCreateProgrammeEnrollment,
);
router.get(
  '/programme-enrollments/students/:studentId',
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD, ROLES.STUDENT, ROLES.ADMISSION_OFFICER),
  controller.handleGetStudentProgrammeEnrollments,
);

export default router;
