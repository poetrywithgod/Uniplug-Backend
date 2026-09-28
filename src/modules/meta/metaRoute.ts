import express from 'express';

import { listDepartments } from './metaController';
import { handleVerifyTranscriptPublic } from '../examRecords/examRecordsController';

const router = express.Router();

router.get('/departments', listDepartments);
router.get('/transcripts/verify/:code', handleVerifyTranscriptPublic);

export default router;
