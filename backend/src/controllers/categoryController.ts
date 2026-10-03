import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService';

function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch { return false; }
}

// ─────────────────────────────────────────────
// GET /api/categories
// ─────────────────────────────────────────────
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isPublicRoute = !req.baseUrl.includes('/admin');
    const active = isPublicRoute ? true :
      req.query.active === 'true'
        ? true
        : req.query.active === 'false'
          ? false
          : undefined;

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await categoryService.getAll({ active, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/categories/:idOrSlug
// ─────────────────────────────────────────────
export async function getCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const category = await categoryService.getOne(String(req.params.idOrSlug));
    if (!category || (!req.baseUrl.includes('/admin') && (!category.active || category.parent?.active === false))) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/categories
// ─────────────────────────────────────────────
export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, description, imageUrl, active, parentId } = req.body as {
      name?: string;
      description?: string;
      imageUrl?: string;
      active?: boolean;
      parentId?: string | null;
    };

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    if (imageUrl !== undefined && typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'Category photo URL must be text.' });
      return;
    }
    if (imageUrl !== undefined && imageUrl.trim() && !isValidImageUrl(imageUrl.trim())) {
      res.status(400).json({ error: 'Category photo must use a valid HTTP or HTTPS URL.' });
      return;
    }

    const category = await categoryService.create({ name, description, imageUrl, active, parentId });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/categories/:id
// ─────────────────────────────────────────────
export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const existing = await categoryService.getOne(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    const { name, description, imageUrl, active, parentId } = req.body as {
      name?: string;
      description?: string;
      imageUrl?: string;
      active?: boolean;
      parentId?: string | null;
    };

    if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'Category photo URL must be text.' });
      return;
    }
    if (typeof imageUrl === 'string' && imageUrl.trim() && !isValidImageUrl(imageUrl.trim())) {
      res.status(400).json({ error: 'Category photo must use a valid HTTP or HTTPS URL.' });
      return;
    }

    const category = await categoryService.update(String(req.params.id), {
      name,
      description,
      imageUrl,
      active,
      parentId,
    });
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/categories/:id (permanent delete; inactive, unused categories only)
// ─────────────────────────────────────────────
export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const existing = await categoryService.getOne(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    if (existing.active) {
      res.status(400).json({ error: 'Deactivate this category before deleting it.' });
      return;
    }

    const productCount = existing._count?.products ?? 0;
    const childCount = existing._count?.children ?? 0;
    if (childCount > 0) {
      res.status(409).json({
        error: `This category still has ${childCount} subcategor${childCount === 1 ? 'y' : 'ies'}. Move or delete them before deleting the parent category.`,
      });
      return;
    }
    if (productCount > 0) {
      res.status(409).json({
        error: `This category still has ${productCount} product${productCount === 1 ? '' : 's'}. Move or delete those products before deleting the category.`,
      });
      return;
    }

    await categoryService.delete(String(req.params.id));
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
