import { InventoryMovementType, Prisma } from '@prisma/client';
import prisma from '../config/prisma';

function invalid(message: string, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

export const inventoryService = {
  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryLimit = new Date(today);
    expiryLimit.setDate(expiryLimit.getDate() + 30);
    const [products, movements] = await Promise.all([
      prisma.product.findMany({
        where: { active: true, OR: [
          { stockQuantity: { lte: prisma.product.fields.lowStockThreshold } },
          { expiresAt: { lte: expiryLimit } },
        ] },
        select: { id: true, name: true, sku: true, stockQuantity: true, lowStockThreshold: true, unit: true, supplierName: true, expiresAt: true },
        orderBy: [{ expiresAt: 'asc' }, { stockQuantity: 'asc' }],
      }),
      prisma.inventoryMovement.findMany({ take: 100, orderBy: { createdAt: 'desc' }, include: { actor: { select: { username: true } } } }),
    ]);
    return { products, movements };
  },

  async adjust(input: { productId: string; kind: 'RECEIVE' | 'CORRECTION' | 'EXPIRED'; quantity: number; reason: string; unitCost?: number }, actorId: string) {
    const { productId, kind, quantity, reason } = input;
    if (!productId || !Number.isSafeInteger(quantity) || quantity === 0 || Math.abs(quantity) > 100000 || (kind !== 'CORRECTION' && quantity < 1)) throw invalid('Choose a product and enter a valid whole quantity. Stock corrections may use a positive or negative change.');
    const cleanReason = reason?.trim().slice(0, 500);
    if (!cleanReason || cleanReason.length < 3) throw invalid('Enter a short reason for the stock record.');
    if (!['RECEIVE', 'CORRECTION', 'EXPIRED'].includes(kind)) throw invalid('Choose a valid stock action.');
    if (input.unitCost !== undefined && (!Number.isFinite(input.unitCost) || input.unitCost < 0)) throw invalid('Unit cost must be zero or more.');
    const delta = kind === 'EXPIRED' ? -quantity : quantity;
    const movementType: InventoryMovementType = kind === 'RECEIVE' ? 'RESTOCK' : kind === 'EXPIRED' ? 'EXPIRED' : 'ADJUSTMENT';
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw invalid('Product not found.', 404);
      const updated = await tx.product.updateMany({ where: { id: productId, ...(delta < 0 ? { stockQuantity: { gte: quantity } } : {}) }, data: { stockQuantity: { increment: delta } } });
      if (updated.count !== 1) throw invalid('There is not enough stock for that adjustment.', 409);
      const stockAfter = (await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { stockQuantity: true } })).stockQuantity;
      const movement = await tx.inventoryMovement.create({ data: {
        productId, productName: product.name, type: movementType, quantityChange: delta,
        stockAfter, reason: cleanReason, actorId,
        ...(kind === 'RECEIVE' && input.unitCost !== undefined ? { unitCost: new Prisma.Decimal(input.unitCost) } : {}),
      }, include: { actor: { select: { username: true } } } });
      await tx.adminAuditLog.create({ data: {
        actorId, action: kind, entity: 'INVENTORY', entityId: productId,
        summary: `${kind === 'RECEIVE' ? 'Received' : kind === 'EXPIRED' ? 'Removed expired' : 'Adjusted'} ${quantity} ${product.unit} of ${product.name}.`,
        metadata: { reason: cleanReason, stockAfter },
      } });
      return movement;
    });
  },

  async listActivity(limit = 100) {
    return prisma.adminAuditLog.findMany({ take: Math.min(200, Math.max(1, limit)), orderBy: { createdAt: 'desc' }, include: { actor: { select: { username: true } } } });
  },
};
