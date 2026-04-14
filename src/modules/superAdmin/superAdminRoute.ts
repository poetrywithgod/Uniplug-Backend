import express from 'express';

import {
  approveSchoolAdmin,
  declineSchoolAdmin,
  onboardSchoolAdmin,
  onboardTenant,
} from './superAdminController';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import {
  createSchoolAdminSchema,
  createTenantSchema,
  reviewSchoolAdminSchema,
} from './superAdminSchemas';

const router = express.Router();

router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.post('/tenants', validateRequest(createTenantSchema), onboardTenant);
router.post('/school-admins', validateRequest(createSchoolAdminSchema), onboardSchoolAdmin);
router.patch('/school-admins/:userId/verify', approveSchoolAdmin);
router.patch('/school-admins/:userId/reject', validateRequest(reviewSchoolAdminSchema), declineSchoolAdmin);

export default router;
