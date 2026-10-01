import { Request, Response, NextFunction } from 'express';
import { adminOrderService } from '../services/adminOrderService';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as OrderStatus | undefined;
    const paymentStatus = req.query.paymentStatus as PaymentStatus | undefined;
    const search = req.query.search as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await adminOrderService.getAll({ status, paymentStatus, search, page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await adminOrderService.getOne(String(req.params.id));
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderStatus } = req.body as { orderStatus?: string };
    const validStatuses = Object.values(OrderStatus);

    if (!orderStatus || !validStatuses.includes(orderStatus as OrderStatus)) {
      res.status(400).json({ error: `Invalid orderStatus. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    const staffStatuses: OrderStatus[] = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];
    if (req.admin?.role === 'STAFF' && !staffStatuses.includes(orderStatus as OrderStatus)) {
      res.status(403).json({ error: 'Staff can only move orders through the fulfilment steps.' });
      return;
    }

    const existing = await adminOrderService.getOne(String(req.params.id));
    if (!existing) { res.status(404).json({ error: 'Order not found.' }); return; }

    const order = await adminOrderService.updateStatus(String(req.params.id), orderStatus as OrderStatus);
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { paymentStatus } = req.body as { paymentStatus?: string };
    const validStatuses = Object.values(PaymentStatus);

    if (!paymentStatus || !validStatuses.includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({ error: `Invalid paymentStatus. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const existing = await adminOrderService.getOne(String(req.params.id));
    if (!existing) { res.status(404).json({ error: 'Order not found.' }); return; }

    const order = await adminOrderService.updatePaymentStatus(String(req.params.id), paymentStatus as PaymentStatus);
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
}
