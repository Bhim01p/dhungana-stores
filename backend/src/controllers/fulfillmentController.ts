import { Request, Response } from 'express';
import { fulfillmentService } from '../services/fulfillmentService';

export async function getFulfillmentOptions(_req: Request, res: Response) { res.json(await fulfillmentService.options()); }
export async function getAdminFulfillmentOptions(_req: Request, res: Response) { res.json(await fulfillmentService.adminOptions()); }
export async function createDeliveryArea(req: Request, res: Response) { res.status(201).json(await fulfillmentService.createArea(req.body)); }
export async function updateDeliveryArea(req: Request, res: Response) { res.json(await fulfillmentService.updateArea(String(req.params.id), req.body)); }
export async function createDeliverySlot(req: Request, res: Response) { res.status(201).json(await fulfillmentService.createSlot(req.body)); }
export async function updateDeliverySlot(req: Request, res: Response) { res.json(await fulfillmentService.updateSlot(String(req.params.id), req.body)); }
