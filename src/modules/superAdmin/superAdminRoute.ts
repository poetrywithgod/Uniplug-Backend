import express from 'express';

import {
  approveSchoolAdmin,
  declineSchoolAdmin,
  onboardSchoolAdmin,
  onboardTenant,
  handleGetTenants,
  handleGetSchoolAdmins,
  handleGetAllSchoolAdmins,
} from './superAdminController';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import {
  createSchoolAdminSchema,
  createTenantSchema,
  reviewSchoolAdminSchema,
} from './superAdminSchemas';

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.SUPER_ADMIN));

router.get('/tenants', handleGetTenants);
router.get('/school-admins', handleGetAllSchoolAdmins);
router.get('/tenants/:tenantId/school-admins', handleGetSchoolAdmins);

router.post('/tenants', validateRequest(createTenantSchema), onboardTenant);
router.post(
  '/school-admins',
  validateRequest(createSchoolAdminSchema),
  onboardSchoolAdmin,
);
router.patch('/school-admins/:userId/verify', approveSchoolAdmin);
router.patch(
  '/school-admins/:userId/reject',
  validateRequest(reviewSchoolAdminSchema),
  declineSchoolAdmin,
);

export default router;
