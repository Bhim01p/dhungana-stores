import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getFulfillmentOptions } from '../controllers/fulfillmentController';

const router = Router();
router.get('/options', asyncHandler(getFulfillmentOptions));
export default router;
