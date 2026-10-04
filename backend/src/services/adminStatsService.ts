import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';

export type SalesPeriod = '7d' | '30d' | '6m' | '1y';

function dateKey(date: Date, monthly: boolean) {
  return monthly ? date.toISOString().slice(0, 7) : date.toISOString().slice(0, 10);
}

function periodBounds(period: SalesPeriod) {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const start = new Date(end);
  if (period === '7d') start.setUTCDate(start.getUTCDate() - 7);
  else if (period === '30d') start.setUTCDate(start.getUTCDate() - 30);
  else if (period === '6m') start.setUTCMonth(start.getUTCMonth() - 5, 1);
  else start.setUTCMonth(start.getUTCMonth() - 11, 1);
  if (period === '6m' || period === '1y') start.setUTCDate(1);
  return { start, end, monthly: period === '6m' || period === '1y' };
}

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

  async getSalesReport(period: SalesPeriod) {
    const { start, end, monthly } = periodBounds(period);
    const grain = monthly ? 'month' : 'day';
    const format = monthly ? 'YYYY-MM' : 'YYYY-MM-DD';
    const rows = await prisma.$queryRaw<Array<{ bucket: string; revenue: string; cash: string; qr: string; transactions: string }>>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC(${grain}, "created_at"), ${format}) AS bucket,
        COALESCE(SUM("total"), 0)::text AS revenue,
        COALESCE(SUM("total") FILTER (WHERE "payment_type"::text = 'CASH'), 0)::text AS cash,
        COALESCE(SUM("total") FILTER (WHERE "payment_type"::text = 'QR'), 0)::text AS qr,
        COUNT(*)::text AS transactions
      FROM "store_sales"
      WHERE "created_at" >= ${start}
        AND "created_at" < ${end}
        AND "status"::text = 'COMPLETED'
        AND "sale_kind"::text = 'SALE'
      GROUP BY bucket
      ORDER BY bucket ASC
    `);
    const [{ _sum, _count }, onlineOrders] = await Promise.all([
      prisma.storeSale.aggregate({
        where: { createdAt: { gte: start, lt: end }, status: 'COMPLETED', saleKind: 'HOUSE_USE' },
        _sum: { subtotal: true }, _count: { _all: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: start, lt: end }, paymentStatus: 'CONFIRMED', orderStatus: { not: 'CANCELLED' } },
        select: { total: true, createdAt: true },
      }),
    ]);
    const buckets = new Map(rows.map(row => [row.bucket, {
      revenue: Number(row.revenue), cash: Number(row.cash), qr: Number(row.qr), transactions: Number(row.transactions),
    }]));
    const onlineByBucket = new Map<string, { revenue: number; transactions: number }>();
    for (const order of onlineOrders) {
      const key = dateKey(order.createdAt, monthly);
      const current = onlineByBucket.get(key) ?? { revenue: 0, transactions: 0 };
      current.revenue += Number(order.total);
      current.transactions += 1;
      onlineByBucket.set(key, current);
    }
    const filled = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const key = dateKey(cursor, monthly);
      const store = buckets.get(key) ?? { revenue: 0, cash: 0, qr: 0, transactions: 0 };
      const online = onlineByBucket.get(key) ?? { revenue: 0, transactions: 0 };
      filled.push({ bucket: key, storeRevenue: store.revenue, onlineRevenue: online.revenue, revenue: store.revenue + online.revenue, cash: store.cash, qr: store.qr, transactions: store.transactions + online.transactions });
      if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
      else cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return {
      period,
      granularity: monthly ? 'month' : 'day',
      totals: {
        revenue: filled.reduce((sum, row) => sum + row.revenue, 0),
        storeRevenue: filled.reduce((sum, row) => sum + row.storeRevenue, 0),
        onlineRevenue: filled.reduce((sum, row) => sum + row.onlineRevenue, 0),
        cash: filled.reduce((sum, row) => sum + row.cash, 0),
        qr: filled.reduce((sum, row) => sum + row.qr, 0),
        transactions: filled.reduce((sum, row) => sum + row.transactions, 0),
        houseUseValue: Number(_sum.subtotal ?? 0),
        houseUseCount: _count._all,
      },
      buckets: filled,
    };
  },
};
