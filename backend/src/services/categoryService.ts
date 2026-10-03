import prisma from '../config/prisma';
import { slugify } from '../utils/slugify';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CreateCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  parentId?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
  parentId?: string | null;
}

export interface CategoryFilters {
  active?: boolean;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export const categoryService = {
  /**
   * List all categories with optional active filter + pagination.
   */
  async getAll(filters: CategoryFilters = {}) {
    const { active, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where = active === true
      ? { active: true, OR: [{ parentId: null }, { parent: { active: true } }] }
      : active === false ? { active: false } : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          parent: { select: { id: true, name: true, slug: true, parentId: true, active: true } },
          children: {
            where: { active: true },
            select: {
              id: true, name: true, slug: true, description: true, imageUrl: true, active: true, parentId: true,
              createdAt: true, updatedAt: true,
              _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
          },
          _count: { select: { products: true, children: true } },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get a single category by id or slug.
   */
  async getOne(idOrSlug: string) {
    return prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        parent: { select: { id: true, name: true, slug: true, parentId: true, active: true } },
        _count: { select: { products: true, children: true } },
      },
    });
  },

  /**
   * Create a new category. Auto-generates slug from name.
   */
  async create(input: CreateCategoryInput) {
    const slug = slugify(input.name);
    if (input.parentId) await assertParent(input.parentId);

    return prisma.category.create({
      data: {
        name: input.name.trim(),
        slug,
        description: input.description?.trim(),
        imageUrl: input.imageUrl?.trim() || null,
        active: input.active ?? true,
        parentId: input.parentId || null,
      },
    });
  },

  /**
   * Update an existing category by id.
   */
  async update(id: string, input: UpdateCategoryInput) {
    const data: Record<string, unknown> = {};

    if (input.active === false) {
      const activeChildren = await prisma.category.count({ where: { parentId: id, active: true } });
      if (activeChildren > 0) {
        throw Object.assign(new Error('Deactivate the subcategories before deactivating their parent category.'), { statusCode: 400 });
      }
    }

    if (input.name !== undefined) {
      data.name = input.name.trim();
      data.slug = slugify(input.name);
    }
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl.trim() || null;
    if (input.active !== undefined) data.active = input.active;
    if (input.parentId !== undefined) {
      if (input.parentId) {
        await assertParent(input.parentId, id);
        const childCount = await prisma.category.count({ where: { parentId: id } });
        if (childCount > 0) {
          throw Object.assign(new Error('A category with subcategories cannot become a subcategory.'), { statusCode: 400 });
        }
      }
      data.parentId = input.parentId || null;
    }

    return prisma.category.update({ where: { id }, data });
  },

  /**
   * Soft-delete: deactivate a category instead of destroying it.
   */
  async deactivate(id: string) {
    return prisma.category.update({ where: { id }, data: { active: false } });
  },

  /** Permanently remove a category after the controller has checked it is unused and inactive. */
  async delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};

async function assertParent(parentId: string, categoryId?: string) {
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true, active: true },
  });
  if (!parent || !parent.active || parent.parentId || parent.id === categoryId) {
    throw Object.assign(new Error('Choose an active top-level category as the parent.'), { statusCode: 400 });
  }
}
