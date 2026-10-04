import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventoryService';

export async function getInventoryOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await inventoryService.getOverview()); }
  catch (err) { next(err); }
}

export async function adjustInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { productId?: string; kind?: 'RECEIVE' | 'CORRECTION' | 'EXPIRED'; quantity?: number; reason?: string; unitCost?: number };
    if (!['RECEIVE', 'CORRECTION', 'EXPIRED'].includes(body.kind ?? '')) {
      res.status(400).json({ error: 'Choose receive stock, correct stock, or remove expired stock.' });
      return;
    }
    const movement = await inventoryService.adjust({
      productId: String(body.productId ?? ''), kind: body.kind!, quantity: Number(body.quantity),
      reason: String(body.reason ?? ''), ...(body.unitCost === undefined ? {} : { unitCost: Number(body.unitCost) }),
    }, req.admin!.sub);
    res.status(201).json(movement);
  } catch (err) { next(err); }
}

export async function getActivity(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.status(200).json(await inventoryService.listActivity()); }
  catch (err) { next(err); }
}
