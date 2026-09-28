import express from 'express';
import { requireAuth, requireRole, ROLES } from '../../middlewares/authMiddleware';
import { AccessGroups } from '../../configs/rolesConfig';
import { validateRequest, validateQuery } from '../../utils/validation';
import * as schemas from './examRecordsSchemas';
import * as controller from './examRecordsController';

const router = express.Router();

// --- 1. Public Unauthenticated Verification ---
router.get('/transcripts/verify/:code', controller.handleVerifyTranscriptPublic);

// --- 2. Authenticated Endpoints ---
router.use(requireAuth);

// Student Transcript Application Self-Service
router.post(
  '/transcripts/request',
  requireRole(ROLES.STUDENT, ROLES.EXAMINATION_OFFICER, ROLES.SCHOOL_ADMIN),
  validateRequest(schemas.requestTranscriptSchema),
  controller.handleRequestTranscript,
);

// --- 3. Examination & Records Protected Operations ---
router.use(requireRole(AccessGroups.EXAMINATION_AND_RECORDS));

// Academic Workflow Monitoring
router.get('/overview', controller.handleGetOverview);

// Course Results Verification & 3-Point Checklist
router.get(
  '/results/batches',
  validateQuery(schemas.resultBatchesQuerySchema),
  controller.handleGetResultBatches,
);
router.post(
  '/offerings/:offeringId/publish',
  validateRequest(schemas.publishOfferingResultsSchema),
  controller.handlePublishResults,
);
router.post(
  '/offerings/:offeringId/flag-discrepancy',
  validateRequest(schemas.flagDiscrepancySchema),
  controller.handleFlagDiscrepancy,
);

// Student Academic History & Audits
router.get('/students/:studentId/audit', controller.handleGetStudentAudit);

// Graduation Cohort & Degree Audits
router.get(
  '/graduation/cohort',
  validateQuery(schemas.graduationCohortQuerySchema),
  controller.handleRunGraduationCohortAudit,
);
router.post('/graduation/cohort/audit', controller.handleRunGraduationCohortAudit);
router.post('/graduation/clear/:studentId', controller.handleClearStudentForGraduation);

// Transcript Lifecycle & Issuance
router.get('/transcripts/requests', controller.handleGetTranscriptRequests);
router.post('/transcripts/:id/issue', controller.handleIssueTranscript);

export default router;
