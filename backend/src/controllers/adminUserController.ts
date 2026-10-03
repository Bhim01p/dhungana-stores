import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';
import prisma from '../config/prisma';
import { hashPassword } from '../services/authService';

const adminUserFields = {
  id: true,
  username: true,
  recoveryEmail: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

export async function listStaff(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await prisma.adminUser.findMany({
      where: { role: AdminRole.STAFF },
      select: adminUserFields,
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json(staff);
  } catch (err) { next(err); }
}

export async function createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password, recoveryEmail } = req.body as { username?: string; password?: string; recoveryEmail?: string };
    const cleanUsername = username?.trim();
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 40) {
      res.status(400).json({ error: 'Username must be between 3 and 40 characters.' });
      return;
    }
    if (!password || password.length < 12) {
      res.status(400).json({ error: 'Staff password must be at least 12 characters.' });
      return;
    }
    const cleanEmail = recoveryEmail?.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Enter a valid recovery email address for this staff account.' });
      return;
    }
    const staff = await prisma.adminUser.create({
      data: {
        username: cleanUsername,
        recoveryEmail: cleanEmail,
        password: await hashPassword(password),
        role: AdminRole.STAFF,
      },
      select: adminUserFields,
    });
    res.status(201).json(staff);
  } catch (err) { next(err); }
}

export async function setStaffActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const active = (req.body as { active?: unknown }).active;
    if (typeof active !== 'boolean') {
      res.status(400).json({ error: 'active must be true or false.' });
      return;
    }
    const staff = await prisma.adminUser.findUnique({ where: { id: String(req.params.id) } });
    if (!staff || staff.role !== AdminRole.STAFF) {
      res.status(404).json({ error: 'Staff account not found.' });
      return;
    }
    const updated = await prisma.adminUser.update({
      where: { id: staff.id },
      data: { active },
      select: adminUserFields,
    });
    res.status(200).json(updated);
  } catch (err) { next(err); }
}

export async function deleteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const staff = await prisma.adminUser.findUnique({ where: { id: String(req.params.id) } });
    if (!staff || staff.role !== AdminRole.STAFF) {
      res.status(404).json({ error: 'Staff account not found.' });
      return;
    }
    if (staff.active) {
      res.status(400).json({ error: 'Disable this staff account before deleting it.' });
      return;
    }

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { accountType: 'ADMIN', accountId: staff.id } }),
      prisma.adminUser.delete({ where: { id: staff.id } }),
    ]);
    res.status(200).json({ message: 'Staff account permanently deleted.' });
  } catch (err) { next(err); }
}
