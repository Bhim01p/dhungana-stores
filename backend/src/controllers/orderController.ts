import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/orderService";
import { customerService } from "../services/customerService";

// POST /api/orders
export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { customerName, phone, email, address, landmark, notes, items, paymentMethodId } = req.body as {
      customerName?: string;
      phone?: string;
      email?: string;
      address?: string;
      landmark?: string;
      notes?: string;
      items?: Array<{ productId: string; quantity: number }>;
      paymentMethodId?: string;
    };

    let resolvedName = customerName;
    let resolvedPhone = phone;
    let resolvedEmail = email;
    let customerId: string | undefined;

    if (req.customer) {
      const profile = await customerService.getProfile(req.customer.sub);
      if (!profile) { res.status(401).json({ error: "Customer not found." }); return; }
      customerId = profile.id;
      resolvedName = profile.name;
      resolvedPhone = profile.phone;
      resolvedEmail = email?.trim() || profile.email;
    }

    if (!resolvedName?.trim()) { res.status(400).json({ error: "Customer name is required." }); return; }
    if (!resolvedPhone?.trim()) { res.status(400).json({ error: "Phone number is required." }); return; }
    if (!address?.trim()) { res.status(400).json({ error: "Delivery address is required." }); return; }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "At least one item is required." }); return;
    }
    if (paymentMethodId !== undefined && (typeof paymentMethodId !== 'string' || !paymentMethodId.trim())) {
      res.status(400).json({ error: "Choose a valid payment method." }); return;
    }

    const order = await orderService.create({
      customerName: resolvedName,
      phone: resolvedPhone,
      email: resolvedEmail,
      address,
      landmark,
      notes,
      items,
      customerId,
      paymentMethodId,
    });
    res.status(201).json(order);
  } catch (err) { next(err); }
}

// POST /api/orders/guest-lookup (secure guest tracking credential)
export async function getGuestOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lookupToken = String((req.body as { lookupToken?: string }).lookupToken ?? '');
    if (!/^[A-Za-z0-9_-]{40,60}$/.test(lookupToken)) { res.status(404).json({ error: "Order not found." }); return; }
    const order = await orderService.getByGuestLookupToken(lookupToken);
    if (!order) { res.status(404).json({ error: "Order not found." }); return; }
    // Return limited info to the public (no internal IDs of other customers)
    res.status(200).json({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethodName: order.paymentMethodName,
      paymentMethodQrImageUrl: order.paymentMethodQrImageUrl,
      paymentMethodAccountInfo: order.paymentMethodAccountInfo,
      address: order.address,
      landmark: order.landmark,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      total: order.total,
      createdAt: order.createdAt,
      orderItems: order.orderItems,
    });
  } catch (err) { next(err); }
}
