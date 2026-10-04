import { Router } from 'express';
import { createSupportMessage } from '../controllers/supportMessageController';
import { optionalCustomer } from '../middleware/requireCustomer';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.post('/', optionalCustomer, asyncHandler(createSupportMessage));
export default router;
