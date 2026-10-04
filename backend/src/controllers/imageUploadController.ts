import { Request, Response } from 'express';
import { createImageUploadSignature } from '../services/imageUploadService';

export async function createAdminImageSignature(req: Request, res: Response): Promise<void> {
  const assetType = (req.body as { assetType?: string }).assetType;
  if (assetType !== 'product' && assetType !== 'category' && assetType !== 'paymentMethod' && assetType !== 'profile') {
    res.status(400).json({ error: 'Choose a supported image type.' });
    return;
  }
  const folder = assetType === 'product'
    ? 'store/products'
    : assetType === 'category'
      ? 'store/categories'
      : assetType === 'paymentMethod' ? 'store/payment-methods' : 'store/profiles';
  res.status(200).json(createImageUploadSignature(folder));
}

export async function createCustomerImageSignature(req: Request, res: Response): Promise<void> {
  res.status(200).json(createImageUploadSignature(`store/customers/${req.customer!.sub}`));
}

export async function createAdminProfileImageSignature(req: Request, res: Response): Promise<void> {
  res.status(200).json(createImageUploadSignature(`store/admins/${req.admin!.sub}`));
}
