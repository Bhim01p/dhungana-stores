import { Request, Response } from 'express';
import { cashDrawerService } from '../services/cashDrawerService';

export async function getCashDrawer(req: Request, res: Response) {
  const date = typeof req.query.date === 'string' ? req.query.date : '';
  res.json(await cashDrawerService.get(date));
}

export async function closeCashDrawer(req: Request, res: Response) {
  const closing = await cashDrawerService.close(req.body, req.admin!.sub);
  res.status(201).json(closing);
}
