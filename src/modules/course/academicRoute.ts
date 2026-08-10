import express, { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as schemas from './courseSchemas';
import * as controller from './courseController';

const router = express.Router();

// --- Public / Authenticated Programmes ---
router.get('/programmes', (req: Request, res: Response, next: NextFunction) => {
  if (req.query.schoolId) {
    return controller.handleGetProgrammes(req, res, next);
  }
  return requireAuth(req, res, () => controller.handleGetProgrammes(req, res, next));
});

router.post(
  '/programmes',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createProgrammeSchema),
  controller.handleCreateProgramme,
);

// --- Departments ---
router.post(
  '/departments',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createDepartmentSchema),
  controller.handleCreateDepartment,
);
router.get(
  '/departments',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD),
  controller.handleGetDepartments,
);

// --- Faculties ---
router.post(
  '/faculties',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.createFacultySchema),
  controller.handleCreateFaculty,
);
router.get(
  '/faculties',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD),
  controller.handleGetFaculties,
);

// --- Programme Enrollments ---
router.post(
  '/programme-enrollments',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.ADMISSION_OFFICER),
  validateRequest(schemas.createProgrammeEnrollmentSchema),
  controller.handleCreateProgrammeEnrollment,
);
router.get(
  '/programme-enrollments/students/:studentId',
  requireAuth,
  requireRole(ROLES.SCHOOL_ADMIN, ROLES.HOD, ROLES.STUDENT, ROLES.ADMISSION_OFFICER),
  controller.handleGetStudentProgrammeEnrollments,
);

export default router;


