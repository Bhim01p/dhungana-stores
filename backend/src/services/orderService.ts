import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { createHash, randomBytes } from 'crypto';
import { OrderFulfillmentType } from '@prisma/client';

// ─── Constants ────────────────────────────────
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
  fulfillmentType?: OrderFulfillmentType;
  deliveryAreaId?: string;
  deliveryDate?: string;
  deliverySlotId?: string;
}

// ─── Helpers ──────────────────────────────────
function generateOrderNumber(): string {
  const now = new Date(Date.now() + 345 * 60 * 1000);
  const date = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
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
    const fulfillmentType = input.fulfillmentType ?? OrderFulfillmentType.DELIVERY;
    const dateText = input.deliveryDate ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText) || !input.deliverySlotId) {
      throw Object.assign(new Error('Choose a date and time slot.'), { statusCode: 400 });
    }
    const chosenDate = new Date(`${dateText}T00:00:00.000Z`);
    if (Number.isNaN(chosenDate.getTime()) || chosenDate.toISOString().slice(0, 10) !== dateText) {
      throw Object.assign(new Error('Choose a valid delivery date.'), { statusCode: 400 });
    }
    const nepaliToday = new Date(Date.now() + 345 * 60 * 1000);
    const todayText = `${nepaliToday.getUTCFullYear()}-${String(nepaliToday.getUTCMonth() + 1).padStart(2, '0')}-${String(nepaliToday.getUTCDate()).padStart(2, '0')}`;
    const todayDate = new Date(`${todayText}T00:00:00.000Z`);
    const dayOffset = Math.round((chosenDate.getTime() - todayDate.getTime()) / 86_400_000);
    if (Number.isNaN(chosenDate.getTime()) || dayOffset < 0 || dayOffset > 7) throw Object.assign(new Error('Choose a date from today through the next seven days.'), { statusCode: 400 });
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
      const slot = await tx.deliverySlot.findFirst({ where: { id: input.deliverySlotId, active: true } });
      if (!slot || (slot.weekdays.length > 0 && !slot.weekdays.includes(chosenDate.getUTCDay()))) {
        throw Object.assign(new Error('That time slot is not available for the selected date. Choose another slot.'), { statusCode: 400 });
      }
      const area = fulfillmentType === OrderFulfillmentType.DELIVERY
        ? await tx.deliveryArea.findFirst({ where: { id: input.deliveryAreaId, active: true } })
        : null;
      if (fulfillmentType === OrderFulfillmentType.DELIVERY && !area) {
        throw Object.assign(new Error('Choose an active delivery area.'), { statusCode: 400 });
      }

      const products = await tx.product.findMany({
        where: { id: { in: orderItems.map((item) => item.productId) }, active: true },
      });
      if (products.length !== orderItems.length) {
        throw Object.assign(new Error('One or more products are unavailable.'), { statusCode: 400 });
      }
      let subtotalCents = 0;
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
        const stockAfter = (await tx.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQuantity: true } })).stockQuantity;
        await tx.inventoryMovement.create({ data: {
          productId: product.id, productName: product.name, type: 'ONLINE_ORDER',
          quantityChange: -item.quantity, stockAfter,
          reference: orderNumber, reason: 'Stock reserved for an online order.',
        } });
        const unitPriceCents = Math.round(Number(product.price) * 100);
        const itemSubtotalCents = unitPriceCents * item.quantity;
        subtotalCents += itemSubtotalCents;
        if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 9_999_999_999) {
          throw Object.assign(new Error('Order total is above the supported limit.'), { statusCode: 400 });
        }
        orderItemsData.push({ productId: product.id, productName: product.name, unit: product.unit,
          quantity: item.quantity, unitPrice: new Decimal(unitPriceCents).div(100), subtotal: new Decimal(itemSubtotalCents).div(100) });
      }
      const subtotal = subtotalCents / 100;
      const deliveryCharge = fulfillmentType === OrderFulfillmentType.PICKUP ? 0
        : subtotal >= Number(area!.freeDeliveryThreshold) ? 0 : Number(area!.deliveryCharge ?? DELIVERY_CHARGE);
      const deliveryChargeCents = Math.round(deliveryCharge * 100);
      const totalCents = subtotalCents + deliveryChargeCents;
      if (!Number.isSafeInteger(deliveryChargeCents) || !Number.isSafeInteger(totalCents) || totalCents > 9_999_999_999) {
        throw Object.assign(new Error('Order total is above the supported limit.'), { statusCode: 400 });
      }
      return tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName.trim(),
          phone: input.phone.trim(),
          email: input.email?.trim() || null,
          address: fulfillmentType === OrderFulfillmentType.PICKUP ? 'Store pickup' : input.address.trim(),
          fulfillmentType,
          deliveryAreaId: area?.id ?? null,
          deliveryDate: chosenDate,
          deliverySlotId: slot.id,
          landmark: input.landmark?.trim() || null,
          notes: input.notes?.trim() || null,
          subtotal: new Decimal(subtotalCents).div(100),
          deliveryCharge: new Decimal(deliveryChargeCents).div(100),
          total: new Decimal(totalCents).div(100),
          paymentMethodName: paymentMethod?.name ?? null,
          paymentMethodQrImageUrl: paymentMethod?.qrImageUrl ?? null,
          paymentMethodAccountInfo: paymentMethod?.accountInfo ?? null,
          customerId: input.customerId || null,
          guestLookupTokenHash: guestLookupToken ? hashLookupToken(guestLookupToken) : null,
          stockReserved: true,
          orderItems: { create: orderItemsData },
        },
        include: { orderItems: true, deliveryArea: { select: { name: true } }, deliverySlot: { select: { label: true } } },
      });
    });
    const { guestLookupTokenHash: _hash, ...safeOrder } = created;
    return { ...safeOrder, ...(guestLookupToken ? { guestLookupToken } : {}) };
  },

  async getOne(id: string) {
    return prisma.order.findUnique({ where: { id }, include: { orderItems: true, deliveryArea: { select: { name: true } }, deliverySlot: { select: { label: true } } } });
  },

  async getByGuestLookupToken(token: string) {
    return prisma.order.findUnique({
      where: { guestLookupTokenHash: hashLookupToken(token) },
      include: {
        orderItems: true,
        deliveryArea: { select: { name: true } },
        deliverySlot: { select: { label: true } },
      },
    });
  },
};
