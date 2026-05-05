import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../utils/validation';
import * as applicationController from './applicationController';
import {
  personalDetailsSchema,
  academicHistorySchema,
  programmeSelectionSchema,
  documentSignatureSchema,
  addDocumentSchema,
  startApplicationSchema,
} from './applicationSchemas';

const router = Router();

// All application routes require the user to be authenticated and an applicant
router.use(requireAuth, requireRole('APPLICANT'));

// Start a new application
router.post(
  '/',
  validateRequest(startApplicationSchema),
  applicationController.startApplication,
);

// Get all applications for the current applicant
router.get('/', applicationController.getMyApplications);

// Update step 1: Personal Details
router.patch(
  '/:applicationId/personal-details',
  validateRequest(personalDetailsSchema),
  applicationController.updatePersonalDetails,
);

// Update step 2: Academic History
router.patch(
  '/:applicationId/academic-history',
  validateRequest(academicHistorySchema),
  applicationController.updateAcademicHistory,
);

// Update step 3: Programme Selection
router.patch(
  '/:applicationId/programme-selection',
  validateRequest(programmeSelectionSchema),
  applicationController.updateProgrammeSelection,
);

// Step 4a: Get Cloudinary signature for document upload
router.post(
  '/:applicationId/documents/signature',
  validateRequest(documentSignatureSchema),
  applicationController.getCloudinarySignature,
);

// Step 4b: Save uploaded document details to application
router.post(
  '/:applicationId/documents',
  validateRequest(addDocumentSchema),
  applicationController.addDocumentToApplication,
);

// Step 5: Final Submission
router.post('/:applicationId/submit', applicationController.submitApplication);

export default router;
