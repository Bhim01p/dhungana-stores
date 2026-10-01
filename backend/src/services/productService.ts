import prisma from '../config/prisma';
import { slugify } from '../utils/slugify';
import { Unit } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CreateProductInput {
  name: string;
  description?: string;
  categoryId: string;
  brand?: string;
  sku?: string;
  price: number | string;
  unit: Unit;
  stockQuantity?: number;
  lowStockThreshold?: number;
  image?: string;
  active?: boolean;
  featured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  sku?: string;
  price?: number | string;
  unit?: Unit;
  stockQuantity?: number;
  lowStockThreshold?: number;
  image?: string;
  active?: boolean;
  featured?: boolean;
}

export interface ProductFilters {
  publicOnly?: boolean;
  categoryId?: string;
  categorySlug?: string;
  active?: boolean;
  featured?: boolean;
  lowStock?: boolean;
  missingImage?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────

function assertNonNegative(value: number | string | undefined, field: string) {
  if (value !== undefined && Number(value) < 0) {
    throw Object.assign(new Error(`${field} cannot be negative.`), { statusCode: 400 });
  }
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export const productService = {
  /**
   * List products with filters + pagination.
   */
  async getAll(filters: ProductFilters = {}) {
    const {
      categoryId,
      categorySlug,
      publicOnly,
      active,
      featured,
      lowStock,
      missingImage,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    const and: Record<string, any>[] = [];

    if (active !== undefined) where.active = active;
    if (featured !== undefined) where.featured = featured;

    if (publicOnly) {
      and.push({ category: { active: true, OR: [{ parentId: null }, { parent: { active: true } }] } });
    }

    if (categoryId || categorySlug) {
      const category = await prisma.category.findFirst({
        where: categoryId ? { id: categoryId } : { slug: categorySlug },
        select: { id: true, parentId: true, active: true, parent: { select: { active: true } } },
      });
      if (!category || (active === true && (!category.active || category.parent?.active === false))) {
        where.categoryId = '__missing_category__';
      } else if (category.parentId) {
        where.categoryId = category.id;
      } else {
        where.category = { OR: [{ id: category.id }, { parentId: category.id, active: true }] };
      }
    }

    if (lowStock) {
      where.stockQuantity = { lte: prisma.product.fields.lowStockThreshold };
    }

    if (missingImage) {
      and.push({ OR: [{ image: null }, { image: '' }] });
    }

    if (search) {
      and.push({ OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ] });
    }
    if (and.length) where.AND = and;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true, name: true, slug: true, parentId: true,
              parent: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get a single product by id or slug.
   */
  async getOne(idOrSlug: string) {
    return prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: {
          select: {
            id: true, name: true, slug: true, parentId: true, active: true,
            parent: { select: { id: true, name: true, slug: true, active: true } },
          },
        },
      },
    });
  },

  /**
   * Create a new product.
   */
  async create(input: CreateProductInput) {
    assertNonNegative(input.price, 'Price');
    assertNonNegative(input.stockQuantity, 'Stock quantity');
    assertNonNegative(input.lowStockThreshold, 'Low stock threshold');

    const slug = slugify(input.name);

    return prisma.product.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim(),
        categoryId: input.categoryId,
        brand: input.brand?.trim(),
        sku: input.sku?.trim() || null,
        price: new Decimal(input.price),
        unit: input.unit,
        stockQuantity: input.stockQuantity ?? 0,
        lowStockThreshold: input.lowStockThreshold ?? 10,
        image: input.image?.trim(),
        active: input.active ?? true,
        featured: input.featured ?? false,
      },
      include: {
        category: {
          select: {
            id: true, name: true, slug: true, parentId: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  },

  /**
   * Update an existing product by id.
   */
  async update(id: string, input: UpdateProductInput) {
    assertNonNegative(input.price, 'Price');
    assertNonNegative(input.stockQuantity, 'Stock quantity');
    assertNonNegative(input.lowStockThreshold, 'Low stock threshold');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};

    if (input.name !== undefined) {
      data.name = input.name.trim();
      data.slug = slugify(input.name);
    }
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.brand !== undefined) data.brand = input.brand.trim();
    if (input.sku !== undefined) data.sku = input.sku.trim() || null;
    if (input.price !== undefined) data.price = new Decimal(input.price);
    if (input.unit !== undefined) data.unit = input.unit;
    if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
    if (input.lowStockThreshold !== undefined) data.lowStockThreshold = input.lowStockThreshold;
    if (input.image !== undefined) data.image = input.image.trim();
    if (input.active !== undefined) data.active = input.active;
    if (input.featured !== undefined) data.featured = input.featured;

    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true, name: true, slug: true, parentId: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  },

  /**
   * Soft-delete: deactivate a product.
   */
  async deactivate(id: string) {
    return prisma.product.update({ where: { id }, data: { active: false } });
  },
};
