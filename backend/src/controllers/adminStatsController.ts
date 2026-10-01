import { Request, Response, NextFunction } from 'express';
import { adminStatsService } from '../services/adminStatsService';

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
