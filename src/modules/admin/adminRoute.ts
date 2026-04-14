import express from 'express';

import { onboardHostelAdmin, onboardLecturer } from './adminController';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import { createHostelAdminSchema, createLecturerSchema } from './adminSchemas';

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.post('/lecturers', validateRequest(createLecturerSchema), onboardLecturer);
router.post('/hostel-admins', validateRequest(createHostelAdminSchema), onboardHostelAdmin);

export default router;
