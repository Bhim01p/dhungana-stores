import { Router } from 'express';
import { healthCheck, dbHealthCheck } from '../controllers/healthController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/health
router.get('/', asyncHandler(healthCheck));

// GET /api/health/db
router.get('/db', asyncHandler(dbHealthCheck));

export default router;
