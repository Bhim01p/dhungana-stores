import { Request, Response, NextFunction } from "express";
import { paymentMethodService } from "../services/paymentMethodService";

// GET /api/payment-methods  (public — customers see active methods)
export async function getPaymentMethods(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const methods = await paymentMethodService.getAll(true);
    res.status(200).json(methods);
  } catch (err) { next(err); }
}

// GET /api/admin/payment-methods  (admin — see all including inactive)
export async function getAllPaymentMethods(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const methods = await paymentMethodService.getAll(false);
    res.status(200).json(methods);
  } catch (err) { next(err); }
}

// POST /api/admin/payment-methods
export async function createPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, qrImageUrl, accountInfo, active, sortOrder } = req.body as {
      name?: string; qrImageUrl?: string; accountInfo?: string;
      active?: boolean; sortOrder?: number;
    };
    if (!name?.trim()) { res.status(400).json({ error: "Name is required." }); return; }
    if (!qrImageUrl?.trim()) { res.status(400).json({ error: "QR image URL is required." }); return; }

    const method = await paymentMethodService.create({
      name: name.trim(),
      qrImageUrl: qrImageUrl.trim(),
      accountInfo: accountInfo?.trim(),
      active: active ?? true,
      sortOrder: sortOrder ?? 0,
    });
    res.status(201).json(method);
  } catch (err) { next(err); }
}

// PATCH /api/admin/payment-methods/:id
export async function updatePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await paymentMethodService.getOne(String(req.params.id));
    if (!existing) { res.status(404).json({ error: "Payment method not found." }); return; }
    const { name, qrImageUrl, accountInfo, active, sortOrder } = req.body as {
      name?: string; qrImageUrl?: string; accountInfo?: string;
      active?: boolean; sortOrder?: number;
    };
    const method = await paymentMethodService.update(String(req.params.id), {
      name: name?.trim(), qrImageUrl: qrImageUrl?.trim(),
      accountInfo: accountInfo?.trim(), active, sortOrder,
    });
    res.status(200).json(method);
  } catch (err) { next(err); }
}

// DELETE /api/admin/payment-methods/:id
export async function deletePaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await paymentMethodService.getOne(String(req.params.id));
    if (!existing) { res.status(404).json({ error: "Payment method not found." }); return; }
    await paymentMethodService.delete(String(req.params.id));
    res.status(200).json({ message: "Payment method deleted." });
  } catch (err) { next(err); }
}