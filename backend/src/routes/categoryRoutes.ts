import { Router } from 'express';
import { AdminRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';

const router = Router();

// GET  /api/categories
router.get('/', getCategories);

// GET  /api/categories/:idOrSlug
router.get('/:idOrSlug', getCategory);

// POST /api/categories
router.post('/', requireAuth, requireRole(AdminRole.ADMIN), createCategory);

// PATCH /api/categories/:id
router.patch('/:id', requireAuth, requireRole(AdminRole.ADMIN), updateCategory);

// DELETE /api/categories/:id  (permanent delete; inactive and unused only)
router.delete('/:id', requireAuth, requireRole(AdminRole.ADMIN), deleteCategory);

export default router;
