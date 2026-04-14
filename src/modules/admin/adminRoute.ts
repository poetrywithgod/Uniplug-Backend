import express from 'express';

import {
  approveStaff,
  declineStaff,
  onboardHostelAdmin,
  onboardLecturer,
} from './adminController';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import {
  createHostelAdminSchema,
  createLecturerSchema,
  reviewStaffSchema,
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
router.patch('/staff/:userId/verify', approveStaff);
router.patch(
  '/staff/:userId/reject',
  validateRequest(reviewStaffSchema),
  declineStaff,
);

export default router;
