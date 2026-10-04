import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminRole } from '@prisma/client';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export interface JwtPayload {
  sub: string;       // AdminUser id
  username: string;
  role: AdminRole;
  permissions?: string[];
  iat?: number;
}

// ── Password helpers ───────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT helpers ────────────────────────────────────────────
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
