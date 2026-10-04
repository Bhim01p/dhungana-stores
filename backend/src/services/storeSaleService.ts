import { randomBytes } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { InventoryMovementType, StoreSaleKind, StoreSalePaymentType, StoreSaleStatus } from '@prisma/client';
import prisma from '../config/prisma';

type ItemInput = { productId: string; quantity: number };

function invalid(message: string, statusCode = 400): Error {
  return Object.assign(new Error(message), { statusCode });
}

function saleNumber() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `POS-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export const storeSaleService = {
  async searchProducts(search: string) {
    return prisma.product.findMany({
      where: { active: true, stockQuantity: { gt: 0 }, ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}) },
      select: { id: true, name: true, price: true, unit: true, stockQuantity: true, image: true, images: true, sku: true },
      orderBy: { name: 'asc' }, take: 40,
    });
  },

  async list(search = '', page = 1, limit = 20) {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const where = search ? { OR: [
      { saleNumber: { contains: search, mode: 'insensitive' as const } },
      { customerName: { contains: search, mode: 'insensitive' as const } },
      { customerPhone: { contains: search, mode: 'insensitive' as const } },
    ] } : {};
    const [data, total] = await Promise.all([
      prisma.storeSale.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, skip: (safePage - 1) * safeLimit, take: safeLimit }),
      prisma.storeSale.count({ where }),
    ]);
    return { data, meta: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) } };
  },

  async create(input: { items: ItemInput[]; saleKind?: StoreSaleKind; paymentType?: StoreSalePaymentType; tenderedAmount?: number; customerName?: string; customerPhone?: string }, cashierId: string, cashierName: string) {
    if (!input || typeof input !== 'object') throw invalid('Sale details are required.');
    if (input.customerName !== undefined && typeof input.customerName !== 'string') throw invalid('Customer name must be text.');
    if (input.customerPhone !== undefined && typeof input.customerPhone !== 'string') throw invalid('Customer phone must be text.');
    if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) throw invalid('Add at least one product to the sale.');
    const saleKind = input.saleKind ?? StoreSaleKind.SALE;
    if (!Object.values(StoreSaleKind).includes(saleKind)) throw invalid('Choose a valid transaction type.');
    if (saleKind === StoreSaleKind.SALE && !Object.values(StoreSalePaymentType).includes(input.paymentType as StoreSalePaymentType)) throw invalid('Choose Cash or QR payment.');
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      if (!item || typeof item.productId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) throw invalid('Each item needs a valid product and a whole quantity from 1 to 10,000.');
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }
    if ([...quantities.values()].some((qty) => qty > 10000)) throw invalid('Combined quantity cannot exceed 10,000 per product.');

    const number = saleNumber();
    return prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
      if (products.length !== quantities.size) throw invalid('One or more products are unavailable. Refresh the product list and try again.', 409);
      let total = 0;
      const items: Array<{ productId: string; productName: string; unit: typeof products[number]['unit']; quantity: number; unitPrice: Decimal; subtotal: Decimal }> = [];
      for (const [productId, quantity] of quantities) {
        const product = products.find((entry) => entry.id === productId)!;
        const reserved = await tx.product.updateMany({ where: { id: product.id, active: true, stockQuantity: { gte: quantity } }, data: { stockQuantity: { decrement: quantity } } });
        if (reserved.count !== 1) throw invalid(`Insufficient stock for ${product.name}.`, 409);
        const stockAfter = (await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { stockQuantity: true } })).stockQuantity;
        await tx.inventoryMovement.create({ data: {
          productId, productName: product.name, type: saleKind === StoreSaleKind.HOUSE_USE ? 'HOUSE_USE' : 'STORE_SALE',
          quantityChange: -quantity, stockAfter,
          reference: number, reason: saleKind === StoreSaleKind.HOUSE_USE ? 'Recorded as shop house use.' : 'Completed in-store sale.', actorId: cashierId,
        } });
        const unitPrice = Number(product.price);
        const subtotal = unitPrice * quantity;
        total += subtotal;
        if (!Number.isFinite(total) || total > 99_999_999.99) throw invalid('Sale total is above the supported limit.');
        items.push({ productId, productName: product.name, unit: product.unit, quantity, unitPrice: new Decimal(unitPrice), subtotal: new Decimal(subtotal) });
      }
      const tendered = saleKind === StoreSaleKind.SALE && input.paymentType === StoreSalePaymentType.CASH ? Number(input.tenderedAmount) : null;
      if (tendered !== null && (!Number.isFinite(tendered) || tendered < total)) throw invalid('Cash received must be at least the sale total.');
      const sale = await tx.storeSale.create({
        data: {
          saleNumber: number, cashierId, cashierName: cashierName.slice(0, 120),
          customerName: input.customerName?.trim().slice(0, 120) || null,
          customerPhone: input.customerPhone?.trim().slice(0, 30) || null,
          subtotal: new Decimal(total), total: new Decimal(saleKind === StoreSaleKind.SALE ? total : 0), saleKind,
          paymentType: saleKind === StoreSaleKind.SALE ? input.paymentType! : null,
          tenderedAmount: tendered === null ? null : new Decimal(tendered),
          changeAmount: tendered === null ? null : new Decimal(tendered - total),
          items: { create: items },
        }, include: { items: true },
      });
      await tx.adminAuditLog.create({ data: { actorId: cashierId, action: saleKind, entity: 'STORE_SALE', entityId: sale.id, summary: `${saleKind === StoreSaleKind.HOUSE_USE ? 'House-use record' : 'In-store sale'} ${sale.saleNumber} was created.`, metadata: { total: Number(sale.total), paymentType: sale.paymentType } } });
      return sale;
    });
  },

  async changeStatus(id: string, status: StoreSaleStatus, reason: string, changedBy: string, actorId?: string) {
    if (status !== StoreSaleStatus.VOIDED && status !== StoreSaleStatus.REFUNDED) throw invalid('Choose void or refunded status.');
    const cleanReason = reason.trim().slice(0, 500);
    if (cleanReason.length < 3) throw invalid('Add a short reason for the audit record.');
    return prisma.$transaction(async (tx) => {
      const sale = await tx.storeSale.findUnique({ where: { id }, include: { items: true } });
      if (!sale) throw invalid('Sale not found.', 404);
      if (sale.status !== StoreSaleStatus.COMPLETED) throw invalid('This sale has already been voided or refunded.', 409);
      if (sale.saleKind === StoreSaleKind.HOUSE_USE && status === StoreSaleStatus.REFUNDED) throw invalid('House-use records can be voided, not refunded.');
      const claimed = await tx.storeSale.updateMany({ where: { id, status: StoreSaleStatus.COMPLETED }, data: { status, statusReason: cleanReason, statusChangedBy: changedBy, statusChangedAt: new Date() } });
      if (claimed.count !== 1) throw invalid('This sale changed while you were updating it. Refresh and try again.', 409);
      for (const item of sale.items) {
        if (item.productId) {
          const restored = await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity } } });
          await tx.inventoryMovement.create({ data: {
            productId: item.productId, productName: item.productName, type: (status === StoreSaleStatus.REFUNDED ? 'STORE_REFUND' : 'STORE_VOID') as unknown as InventoryMovementType,
            quantityChange: item.quantity, stockAfter: restored.stockQuantity,
            reference: sale.saleNumber, reason: `Sale ${status.toLowerCase()}: ${cleanReason}`, actorId: actorId ?? null,
          } });
        }
      }
      await tx.adminAuditLog.create({ data: { actorId: actorId ?? null, action: status, entity: 'STORE_SALE', entityId: id, summary: `${sale.saleNumber} was marked ${status.toLowerCase()}.`, metadata: { reason: cleanReason } } });
      return tx.storeSale.findUniqueOrThrow({ where: { id }, include: { items: true } });
    });
  },
};
