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
      select: { id: true, username: true, role: true, active: true, updatedAt: true },
    });
    if (!admin || !admin.active) {
      res.status(401).json({ error: 'Admin account is inactive or no longer exists.' });
      return;
    }
    if (payload.iat && Math.floor(admin.updatedAt.getTime() / 1000) > payload.iat) {
      res.status(401).json({ error: 'Session ended because the account was changed. Sign in again.' });
      return;
    }
    req.admin = { ...payload, username: admin.username, role: admin.role };
    next();
  } catch (err) { next(err); }
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
