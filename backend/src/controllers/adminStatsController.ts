import { Request, Response, NextFunction } from 'express';
import { adminStatsService, SalesPeriod } from '../services/adminStatsService';

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminStatsService.getDashboardStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function getLowStockProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await adminStatsService.getLowStockProducts();
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
}

export async function getSalesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowed: SalesPeriod[] = ['7d', '30d', '6m', '1y'];
    const requested = typeof req.query.period === 'string' ? req.query.period : '7d';
    if (!allowed.includes(requested as SalesPeriod)) {
      res.status(400).json({ error: `Invalid period. Choose one of: ${allowed.join(', ')}.` });
      return;
    }
    res.status(200).json(await adminStatsService.getSalesReport(requested as SalesPeriod));
  } catch (err) {
    next(err);
  }
}
