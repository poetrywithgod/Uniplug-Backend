import express from 'express';

import { listDepartments } from './metaController';

const router = express.Router();

router.get('/departments', listDepartments);

export default router;
