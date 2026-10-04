import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';
import prisma from '../config/prisma';
import { verifyToken, JwtPayload } from '../services/authService';

// Extend Express Request so downstream handlers get typed user
declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const token = header.slice(7);

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true, permissions: true, active: true, updatedAt: true },
    });
    if (!admin || !admin.active) {
      res.status(401).json({ error: 'Admin account is inactive or no longer exists.' });
      return;
    }
    if (payload.iat && Math.floor(admin.updatedAt.getTime() / 1000) > payload.iat) {
      res.status(401).json({ error: 'Session ended because the account was changed. Sign in again.' });
      return;
    }
    req.admin = { ...payload, username: admin.username, role: admin.role, permissions: admin.permissions };
    next();
  } catch (err) { next(err); }
}

export const staffFeatures = [
  'DASHBOARD', 'PRODUCTS', 'INVENTORY', 'CATEGORIES', 'ORDERS', 'STORE_SALES',
  'CASH_DRAWER', 'FULFILLMENT', 'MESSAGES', 'PAYMENT_METHODS', 'EXPORTS', 'ACTIVITY',
] as const;
export type StaffFeature = typeof staffFeatures[number];

export function requireFeature(feature: StaffFeature) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.admin?.role === AdminRole.ADMIN || req.admin?.permissions?.includes(feature)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Your account does not have access to this area. Ask the main admin for access.' });
  };
}

/** Authorize image signatures according to the area the uploaded image belongs to. */
export function requireImageUploadFeature(req: Request, res: Response, next: NextFunction): void {
  const assetType = (req.body as { assetType?: string } | undefined)?.assetType;
  const requiredFeature: Partial<Record<string, StaffFeature>> = {
    product: 'PRODUCTS',
    category: 'CATEGORIES',
    paymentMethod: 'PAYMENT_METHODS',
  };
  const feature = requiredFeature[assetType ?? ''];

  // Staff profiles are managed by the main admin; staff update their own
  // profile photo through the authenticated account endpoint instead.
  if (assetType === 'profile') {
    if (req.admin?.role === AdminRole.ADMIN) { next(); return; }
    res.status(403).json({ error: 'Only the main admin can upload staff profile photos.' });
    return;
  }
  if (!feature) {
    res.status(400).json({ error: 'Choose a supported image type.' });
    return;
  }
  if (req.admin?.role === AdminRole.ADMIN || req.admin?.permissions?.includes(feature)) {
    next();
    return;
  }
  res.status(403).json({ error: 'Your account does not have access to upload this type of image.' });
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin || !roles.includes(req.admin.role as AdminRole)) {
      res.status(403).json({ error: 'You do not have permission to do that.' });
      return;
    }
    next();
  };
}
