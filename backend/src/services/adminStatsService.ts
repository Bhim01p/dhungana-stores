import prisma from '../config/prisma';

export const adminStatsService = {
  async getDashboardStats() {
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.category.count({ where: { active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      // Products where stockQuantity <= lowStockThreshold
      prisma.product.count({
        where: {
          active: true,
          stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          orderStatus: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    };
  },

  async getLowStockProducts() {
    // Raw query to compare stockQuantity <= lowStockThreshold
    return prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        sku: string | null;
        stockQuantity: number;
        lowStockThreshold: number;
        unit: string;
      }>
    >`
      SELECT id, name, sku, "stockQuantity", "lowStockThreshold", unit::text
      FROM products
      WHERE active = true
        AND "stockQuantity" <= "lowStockThreshold"
      ORDER BY "stockQuantity" ASC
      LIMIT 20
    `;
  },
};
