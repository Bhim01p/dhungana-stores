import { Router } from 'express';
import { AdminRole } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';

const router = Router();

// GET  /api/products
// Supports: ?active=true|false  ?featured=true  ?category=<slug>
//           ?categoryId=<id>    ?search=<term>  ?page=1  ?limit=20
router.get('/', getProducts);

// GET  /api/products/:idOrSlug
router.get('/:idOrSlug', getProduct);

// POST /api/products
router.post('/', requireAuth, requireRole(AdminRole.ADMIN), createProduct);

// PATCH /api/products/:id
router.patch('/:id', requireAuth, requireRole(AdminRole.ADMIN), updateProduct);

// DELETE /api/products/:id  (soft-delete — sets active=false)
router.delete('/:id', requireAuth, requireRole(AdminRole.ADMIN), deleteProduct);

export default router;
