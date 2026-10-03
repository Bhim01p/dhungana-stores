import prisma from '../config/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const adminOrderService = {
  async getAll(filters: OrderFilters = {}) {
    const { status, paymentStatus, search, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          orderItems: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              unit: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  },

  async getOne(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });
  },

  async updateStatus(id: string, orderStatus: OrderStatus) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { orderItems: true } });
      if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
      if (order.orderStatus === OrderStatus.CANCELLED && orderStatus !== OrderStatus.CANCELLED) {
        throw Object.assign(new Error('Cancelled orders cannot be reopened. Create a new order instead.'), { statusCode: 400 });
      }
      if (order.orderStatus === orderStatus) return order;
      const progress: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];
      if (orderStatus !== OrderStatus.CANCELLED && progress.indexOf(orderStatus) < progress.indexOf(order.orderStatus)) {
        throw Object.assign(new Error('Order status cannot move backwards.'), { statusCode: 400 });
      }
      if (orderStatus === OrderStatus.CANCELLED && order.orderStatus !== OrderStatus.CANCELLED) {
        if (order.orderStatus === OrderStatus.DELIVERED) throw Object.assign(new Error('Delivered orders cannot be cancelled.'), { statusCode: 400 });
        if (order.paymentStatus === PaymentStatus.CONFIRMED) {
          throw Object.assign(new Error('This order is marked paid. Process the refund and mark payment as Refunded before cancelling it.'), { statusCode: 400 });
        }
        if (order.stockReserved) {
          for (const item of order.orderItems) {
            if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
          }
        }
        return tx.order.update({ where: { id }, data: { orderStatus, stockReserved: false } });
      }
      return tx.order.update({ where: { id }, data: { orderStatus } });
    });
  },

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
      if (order.paymentStatus === paymentStatus) return order;
      const allowed: Record<PaymentStatus, PaymentStatus[]> = {
        [PaymentStatus.PENDING]: [PaymentStatus.CONFIRMED, PaymentStatus.NOT_REQUIRED],
        [PaymentStatus.CONFIRMED]: [PaymentStatus.REFUNDED],
        [PaymentStatus.NOT_REQUIRED]: [],
        [PaymentStatus.REFUNDED]: [],
      };
      if (!allowed[order.paymentStatus].includes(paymentStatus)) {
        throw Object.assign(new Error(`Payment status cannot change from ${order.paymentStatus} to ${paymentStatus}.`), { statusCode: 400 });
      }
      return tx.order.update({ where: { id }, data: { paymentStatus } });
    });
  },
};
