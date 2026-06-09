import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as hostelController from './hostelController';
import {
  createHostelSchema,
  updateHostelSchema,
  reviewApplicationSchema,
} from './hostelSchemas';

const router = Router();

// Routes for STUDENTS
router.post(
  '/:id/apply',
  requireAuth,
  requireRole('STUDENT'),
  hostelController.applyForHostel,
);

// Routes for HOSTEL_ADMIN
router.use(requireAuth, requireRole('HOSTEL_ADMIN'));

router.post(
  '/',
  validateRequest(createHostelSchema),
  hostelController.createHostel,
);

router.get('/', hostelController.getHostels);

router.put(
  '/:id',
  validateRequest(updateHostelSchema),
  hostelController.updateHostel,
);

router.delete('/:id', hostelController.deleteHostel);

router.get('/:id/applications', hostelController.getHostelApplications);

router.patch(
  '/applications/:id/review',
  validateRequest(reviewApplicationSchema),
  hostelController.reviewHostelApplication,
);

export default router;
