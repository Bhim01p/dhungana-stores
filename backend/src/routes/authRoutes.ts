import { Router } from 'express';
import { login, me, changePassword, updateRecoveryEmail, forgotAdminPassword, resetAdminPassword } from '../controllers/authController';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// POST /api/auth/login  — public
router.post('/login', asyncHandler(login));
router.post('/forgot-password', asyncHandler(forgotAdminPassword));
router.post('/reset-password', asyncHandler(resetAdminPassword));

// GET  /api/auth/me     — protected
router.get('/me', requireAuth, asyncHandler(me));
router.patch('/password', requireAuth, asyncHandler(changePassword));
router.patch('/recovery-email', requireAuth, asyncHandler(updateRecoveryEmail));

export default router;
