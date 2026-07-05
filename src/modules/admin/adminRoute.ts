import express from 'express';

import {
  approveStaff,
  declineStaff,
  handleGetApplications,
  handleUpdateApplicationStatus,
  onboardHostelAdmin,
  onboardLecturer,
  onboardHOD,
  onboardAdmissionOfficer,
  onboardExaminationOfficer,
  onboardFinanceOfficer,
  onboardHostelStaff,
  handleCreateSession,
  handleActivateSession,
  handleCreateSemester,
  handleActivateSemester,
  handleGetSessions,
} from './adminController';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest, validateQuery } from '../../utils/validation';
import {
  createHostelAdminSchema,
  createLecturerSchema,
  createStaffSchema,
  getApplicationsQuerySchema,
  reviewStaffSchema,
  updateApplicationStatusSchema,
  createSessionSchema,
  createSemesterSchema,
} from './adminSchemas';

const router = express.Router();

router.use(requireAuth, requireRole('SCHOOL_ADMIN'));

router.post(
  '/lecturers',
  validateRequest(createLecturerSchema),
  onboardLecturer,
);
router.post(
  '/hostel-admins',
  validateRequest(createHostelAdminSchema),
  onboardHostelAdmin,
);
router.post(
  '/hods',
  validateRequest(createStaffSchema),
  onboardHOD,
);
router.post(
  '/admission-officers',
  validateRequest(createStaffSchema),
  onboardAdmissionOfficer,
);
router.post(
  '/examination-officers',
  validateRequest(createStaffSchema),
  onboardExaminationOfficer,
);
router.post(
  '/finance-officers',
  validateRequest(createStaffSchema),
  onboardFinanceOfficer,
);
router.post(
  '/hostel-staff',
  validateRequest(createStaffSchema),
  onboardHostelStaff,
);

router.patch('/staff/:userId/verify', approveStaff);
router.patch(
  '/staff/:userId/reject',
  validateRequest(reviewStaffSchema),
  declineStaff,
);

router.get(
  '/applications',
  validateQuery(getApplicationsQuerySchema),
  handleGetApplications,
);

router.patch(
  '/applications/:applicationId/status',
  validateRequest(updateApplicationStatusSchema),
  handleUpdateApplicationStatus,
);

// Academic Session & Semester Management
router.post(
  '/sessions',
  validateRequest(createSessionSchema),
  handleCreateSession,
);
router.get('/sessions', handleGetSessions);
router.patch('/sessions/:id/activate', handleActivateSession);
router.post(
  '/sessions/:sessionId/semesters',
  validateRequest(createSemesterSchema),
  handleCreateSemester,
);
router.patch('/semesters/:id/activate', handleActivateSemester);


export default router;
