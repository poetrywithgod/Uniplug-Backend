import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware';
import { validateQuery } from '../../utils/validation';
import { getUploadSignatureQuerySchema } from './mediaSchemas';
import { handleGetUploadSignature } from './mediaController';

const router = express.Router();

router.use(requireAuth);

router.get(
  '/upload-signature',
  validateQuery(getUploadSignatureQuerySchema),
  handleGetUploadSignature,
);

export default router;
