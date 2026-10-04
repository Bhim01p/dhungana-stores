import { Request, Response } from 'express';
import { StoreSaleStatus } from '@prisma/client';
import { storeSaleService } from '../services/storeSaleService';

export async function searchSaleProducts(req: Request, res: Response) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  res.json(await storeSaleService.searchProducts(search));
}

export async function listStoreSales(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  res.json(await storeSaleService.list(search, Number.isFinite(page) ? page : 1, Number.isFinite(limit) ? limit : 20));
}

export async function createStoreSale(req: Request, res: Response) {
  const sale = await storeSaleService.create(req.body, req.admin!.sub, req.admin!.username);
  res.status(201).json(sale);
}

export async function updateStoreSaleStatus(req: Request, res: Response) {
  const { status, reason, restockRefundedItems } = req.body as { status?: string; reason?: string; restockRefundedItems?: boolean };
  if (!Object.values(StoreSaleStatus).includes(status as StoreSaleStatus) || typeof reason !== 'string') {
    res.status(400).json({ error: 'Provide a valid status and an audit reason.' });
    return;
  }
  const sale = await storeSaleService.changeStatus(String(req.params.id), status as StoreSaleStatus, reason, req.admin!.username, req.admin!.sub, restockRefundedItems);
  res.json(sale);
}
