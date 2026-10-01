import { Request, Response, NextFunction } from 'express';

/**
 * Validates that price and stock-related fields are not negative.
 * Used on product create/update routes.
 */
export function validateProductFields(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { price, stockQuantity, lowStockThreshold } = req.body as Record<string, unknown>;

  if (price !== undefined && Number(price) < 0) {
    res.status(400).json({ error: 'Price cannot be negative.' });
    return;
  }

  if (stockQuantity !== undefined && Number(stockQuantity) < 0) {
    res.status(400).json({ error: 'Stock quantity cannot be negative.' });
    return;
  }

  if (lowStockThreshold !== undefined && Number(lowStockThreshold) < 0) {
    res.status(400).json({ error: 'Low stock threshold cannot be negative.' });
    return;
  }

  next();
}

/**
 * Validates that order monetary fields and item quantities are not negative.
 */
export function validateOrderFields(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { subtotal, deliveryCharge, total } = req.body as Record<string, unknown>;

  if (subtotal !== undefined && Number(subtotal) < 0) {
    res.status(400).json({ error: 'Order subtotal cannot be negative.' });
    return;
  }

  if (deliveryCharge !== undefined && Number(deliveryCharge) < 0) {
    res.status(400).json({ error: 'Delivery charge cannot be negative.' });
    return;
  }

  if (total !== undefined && Number(total) < 0) {
    res.status(400).json({ error: 'Order total cannot be negative.' });
    return;
  }

  next();
}
