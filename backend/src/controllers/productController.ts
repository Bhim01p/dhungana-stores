import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { Unit } from '@prisma/client';

// ─────────────────────────────────────────────
// GET /api/products
// ─────────────────────────────────────────────
export async function getProducts(
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

    const featured =
      req.query.featured === 'true'
        ? true
        : req.query.featured === 'false'
          ? false
          : undefined;

    const lowStock = req.query.lowStock === 'true' ? true : undefined;
    const missingImage = req.query.missingImage === 'true' ? true : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const categoryId = req.query.categoryId as string | undefined;
    const categorySlug = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await productService.getAll({
      publicOnly: isPublicRoute,
      active,
      featured,
      lowStock,
      missingImage,
      page,
      limit,
      categoryId,
      categorySlug,
      search,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// GET /api/products/:idOrSlug
// ─────────────────────────────────────────────
export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await productService.getOne(String(req.params.idOrSlug));
    if (!product || (!req.baseUrl.includes('/admin') && (!product.active || !product.category.active || product.category.parent?.active === false))) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// POST /api/products
// ─────────────────────────────────────────────
export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as {
      name?: string;
      description?: string;
      categoryId?: string;
      brand?: string;
      sku?: string;
      price?: number | string;
      unit?: string;
      stockQuantity?: number;
      lowStockThreshold?: number;
      image?: string;
      active?: boolean;
      featured?: boolean;
    };

    // Required field validation
    if (!body.name || body.name.trim() === '') {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }
    if (!body.categoryId) {
      res.status(400).json({ error: 'categoryId is required.' });
      return;
    }
    if (body.price === undefined || body.price === null) {
      res.status(400).json({ error: 'Price is required.' });
      return;
    }
    if (!body.unit) {
      res.status(400).json({ error: 'Unit is required.' });
      return;
    }

    // Validate unit enum
    const validUnits = Object.values(Unit);
    if (!validUnits.includes(body.unit as Unit)) {
      res.status(400).json({
        error: `Invalid unit. Must be one of: ${validUnits.join(', ')}`,
      });
      return;
    }

    // Numeric validation
    if (Number(body.price) < 0) {
      res.status(400).json({ error: 'Price cannot be negative.' });
      return;
    }
    if (body.stockQuantity !== undefined && Number(body.stockQuantity) < 0) {
      res.status(400).json({ error: 'Stock quantity cannot be negative.' });
      return;
    }
    if (body.lowStockThreshold !== undefined && Number(body.lowStockThreshold) < 0) {
      res.status(400).json({ error: 'Low stock threshold cannot be negative.' });
      return;
    }

    const product = await productService.create({
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      brand: body.brand,
      sku: body.sku,
      price: body.price,
      unit: body.unit as Unit,
      stockQuantity: body.stockQuantity,
      lowStockThreshold: body.lowStockThreshold,
      image: body.image,
      active: body.active,
      featured: body.featured,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/products/:id
// ─────────────────────────────────────────────
export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const existing = await productService.getOne(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const body = req.body as {
      name?: string;
      description?: string;
      categoryId?: string;
      brand?: string;
      sku?: string;
      price?: number | string;
      unit?: string;
      stockQuantity?: number;
      lowStockThreshold?: number;
      image?: string;
      active?: boolean;
      featured?: boolean;
    };

    // Validate unit if provided
    if (body.unit !== undefined) {
      const validUnits = Object.values(Unit);
      if (!validUnits.includes(body.unit as Unit)) {
        res.status(400).json({
          error: `Invalid unit. Must be one of: ${validUnits.join(', ')}`,
        });
        return;
      }
    }

    // Numeric guards
    if (body.price !== undefined && Number(body.price) < 0) {
      res.status(400).json({ error: 'Price cannot be negative.' });
      return;
    }
    if (body.stockQuantity !== undefined && Number(body.stockQuantity) < 0) {
      res.status(400).json({ error: 'Stock quantity cannot be negative.' });
      return;
    }
    if (body.lowStockThreshold !== undefined && Number(body.lowStockThreshold) < 0) {
      res.status(400).json({ error: 'Low stock threshold cannot be negative.' });
      return;
    }

    const product = await productService.update(String(req.params.id), {
      ...body,
      unit: body.unit as Unit | undefined,
    });

    res.status(200).json(product);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/products/:id  (soft-delete)
// ─────────────────────────────────────────────
export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const existing = await productService.getOne(String(req.params.id));
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    await productService.deactivate(String(req.params.id));
    res.status(200).json({ message: 'Product deactivated successfully.' });
  } catch (err) {
    next(err);
  }
}
