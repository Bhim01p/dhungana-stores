import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { createHash, randomBytes } from 'crypto';

// ─── Constants ────────────────────────────────
const FREE_DELIVERY_THRESHOLD = 500;   // NPR
const DELIVERY_CHARGE = 50;            // NPR

// ─── Types ────────────────────────────────────
export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  landmark?: string;
  notes?: string;
  items: CartItemInput[];
  customerId?: string;
  paymentMethodId?: string;
}

// ─── Helpers ──────────────────────────────────
function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `BD-${date}-${randomBytes(8).toString('hex').toUpperCase()}`;
}

function hashLookupToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validateNepalPhone(phone: string): boolean {
  // Accept: 97xxxxxxxx or 98xxxxxxxx — exactly 10 digits, optional +977 prefix
  const cleaned = phone.replace(/\s/g, '').replace(/^\+977/, '');
  return /^(97|98)\d{8}$/.test(cleaned);
}

// ─── Service ──────────────────────────────────
export const orderService = {
  async create(input: CreateOrderInput) {
    // 1. Validate phone
    if (!validateNepalPhone(input.phone)) {
      throw Object.assign(
        new Error('Invalid phone number. Must start with 97 or 98 and be 10 digits.'),
        { statusCode: 400 }
      );
    }

    if (input.items.length > 100) {
      throw Object.assign(new Error('An order cannot contain more than 100 different items.'), { statusCode: 400 });
    }
    const quantities = new Map<string, number>();
    for (const item of input.items) {
      if (!item || typeof item.productId !== 'string' || !item.productId.trim() || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) {
        throw Object.assign(new Error('Each item must have a valid product and a whole-number quantity from 1 to 10,000.'), { statusCode: 400 });
      }
      const combinedQuantity = (quantities.get(item.productId) ?? 0) + item.quantity;
      if (!Number.isSafeInteger(combinedQuantity) || combinedQuantity > 10000) {
        throw Object.assign(new Error('Combined quantity for a product cannot exceed 10,000.'), { statusCode: 400 });
      }
      quantities.set(item.productId, combinedQuantity);
    }
    const orderItems = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));

    // 2. Generate unique human-readable order number
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
      if (++attempts > 10) throw new Error('Failed to generate unique order number');
    }

    const guestLookupToken = input.customerId ? undefined : randomBytes(32).toString('base64url');
    // Reserve stock and create the order atomically to prevent overselling.
    const created = await prisma.$transaction(async (tx) => {
      const paymentMethod = input.paymentMethodId
        ? await tx.paymentMethod.findFirst({ where: { id: input.paymentMethodId, active: true } })
        : null;
      if (input.paymentMethodId && !paymentMethod) {
        throw Object.assign(new Error('That payment method is no longer available. Choose another method and try again.'), { statusCode: 400 });
      }

      const products = await tx.product.findMany({
        where: { id: { in: orderItems.map((item) => item.productId) }, active: true },
      });
      if (products.length !== orderItems.length) {
        throw Object.assign(new Error('One or more products are unavailable.'), { statusCode: 400 });
      }
      let subtotal = 0;
      const orderItemsData = [] as Array<{
        productId: string; productName: string; unit: typeof products[number]['unit'];
        quantity: number; unitPrice: Decimal; subtotal: Decimal;
      }>;
      for (const item of orderItems) {
        const product = products.find((p) => p.id === item.productId)!;
        const reserved = await tx.product.updateMany({
          where: { id: product.id, active: true, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}.`), { statusCode: 409 });
        }
        const unitPrice = Number(product.price);
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;
        if (!Number.isFinite(subtotal) || subtotal > 99_999_999.99) {
          throw Object.assign(new Error('Order total is above the supported limit.'), { statusCode: 400 });
        }
        orderItemsData.push({ productId: product.id, productName: product.name, unit: product.unit,
          quantity: item.quantity, unitPrice: new Decimal(unitPrice), subtotal: new Decimal(itemSubtotal) });
      }
      const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
      const total = subtotal + deliveryCharge;
      return tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() || null,
          address: input.address.trim(),
          landmark: input.landmark?.trim() || null,
          notes: input.notes?.trim() || null,
          subtotal: new Decimal(subtotal),
          deliveryCharge: new Decimal(deliveryCharge),
          total: new Decimal(total),
          paymentMethodName: paymentMethod?.name ?? null,
          paymentMethodQrImageUrl: paymentMethod?.qrImageUrl ?? null,
          paymentMethodAccountInfo: paymentMethod?.accountInfo ?? null,
          customerId: input.customerId || null,
          guestLookupTokenHash: guestLookupToken ? hashLookupToken(guestLookupToken) : null,
          stockReserved: true,
          orderItems: { create: orderItemsData },
        },
        include: { orderItems: true },
      });
    });
    const { guestLookupTokenHash: _hash, ...safeOrder } = created;
    return { ...safeOrder, ...(guestLookupToken ? { guestLookupToken } : {}) };
  },

  async getOne(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { orderItems: true } });
  },

  async getByGuestLookupToken(token: string) {
    return prisma.order.findUnique({ where: { guestLookupTokenHash: hashLookupToken(token) }, include: { orderItems: true } });
  },
};
