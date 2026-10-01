import { Request, Response, NextFunction } from "express";
import { verifyCustomerToken, CustomerJwtPayload } from "../services/customerService";
import prisma from "../config/prisma";

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerJwtPayload;
    }
  }
}

export async function requireCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyCustomerToken(token);
    if (payload.type !== "customer") {
      res.status(401).json({ error: "Invalid token type." });
      return;
    }
    const customer = await prisma.customer.findUnique({ where: { id: payload.sub }, select: { active: true, passwordChangedAt: true } });
    if (!customer?.active || (payload.iat && customer.passwordChangedAt && Math.floor(customer.passwordChangedAt.getTime() / 1000) > payload.iat)) {
      res.status(401).json({ error: "This session is no longer active. Sign in again." });
      return;
    }
    req.customer = payload;
    next();
  } catch (err) {
    if (err instanceof Error && err.name !== "JsonWebTokenError" && err.name !== "TokenExpiredError" && err.name !== "NotBeforeError") {
      next(err);
      return;
    }
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Optional auth — attaches customer if token present, but does not block
export function optionalCustomer(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = verifyCustomerToken(header.slice(7));
      if (payload.type === "customer") req.customer = payload;
    } catch { /* ignore */ }
  }
  next();
}
