import { Request, Response, NextFunction } from 'express';
import { AdminRole, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { hashPassword } from '../services/authService';
import { staffFeatures } from '../middleware/requireAuth';

const adminUserFields = {
  id: true,
  username: true,
  recoveryEmail: true,
  imageUrl: true,
  role: true,
  permissions: true,
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
    const { username, password, recoveryEmail, imageUrl, permissions } = req.body as { username?: string; password?: string; recoveryEmail?: string; imageUrl?: string; permissions?: unknown };
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
    let photo: URL;
    try { photo = new URL(imageUrl ?? ''); } catch { res.status(400).json({ error: 'Upload a staff profile photo before creating the account.' }); return; }
    if (photo.protocol !== 'https:' || photo.hostname !== 'res.cloudinary.com') {
      res.status(400).json({ error: 'Staff profile photos must be uploaded through the photo uploader.' });
      return;
    }
    if (permissions !== undefined && (!Array.isArray(permissions) || permissions.some(item => typeof item !== 'string' || !staffFeatures.includes(item as typeof staffFeatures[number])))) {
      res.status(400).json({ error: 'One or more staff permissions are invalid.' });
      return;
    }
    const existingAccount = await prisma.adminUser.findFirst({
      where: { OR: [{ username: cleanUsername }, { recoveryEmail: cleanEmail }] },
      select: { username: true, recoveryEmail: true },
    });
    if (existingAccount) {
      const duplicateFields = [
        existingAccount.username === cleanUsername ? 'username' : null,
        existingAccount.recoveryEmail === cleanEmail ? 'recovery email' : null,
      ].filter(Boolean);
      res.status(409).json({ error: `A staff account with this ${duplicateFields.join(' and ')} already exists. Use a different ${duplicateFields.length > 1 ? 'username and recovery email' : duplicateFields[0]}.` });
      return;
    }
    const staff = await prisma.adminUser.create({
      data: {
        username: cleanUsername,
        recoveryEmail: cleanEmail,
        imageUrl: photo.toString(),
        password: await hashPassword(password),
        role: AdminRole.STAFF,
        permissions: (permissions as string[] | undefined) ?? ['ORDERS', 'STORE_SALES', 'CASH_DRAWER'],
      },
      select: adminUserFields,
    });
    await prisma.adminAuditLog.create({ data: { actorId: req.admin!.sub, action: 'STAFF_CREATED', entity: 'STAFF', entityId: staff.id, summary: `Staff account ${staff.username} was created.` } });
    res.status(201).json(staff);
  } catch (err) {
    // The pre-check gives a friendly message in normal cases. Keep this guard
    // for the small race where another request creates the same value at once.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.status(409).json({ error: 'A staff account with this username or recovery email already exists. Use a different one.' });
      return;
    }
    next(err);
  }
}

export async function updateStaffPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const permissions = (req.body as { permissions?: unknown }).permissions;
    if (!Array.isArray(permissions) || permissions.some(item => typeof item !== 'string' || !staffFeatures.includes(item as typeof staffFeatures[number]))) {
      res.status(400).json({ error: 'Provide a list of valid staff permissions.' });
      return;
    }
    const staff = await prisma.adminUser.findUnique({ where: { id: String(req.params.id) } });
    if (!staff || staff.role !== AdminRole.STAFF) { res.status(404).json({ error: 'Staff account not found.' }); return; }
    const normalized = [...new Set(permissions as string[])];
    const updated = await prisma.adminUser.update({ where: { id: staff.id }, data: { permissions: normalized }, select: adminUserFields });
    await prisma.adminAuditLog.create({ data: { actorId: req.admin!.sub, action: 'STAFF_PERMISSIONS_UPDATED', entity: 'STAFF', entityId: staff.id, summary: `Access areas changed for staff account ${staff.username}.` } });
    res.status(200).json(updated);
  } catch (err) { next(err); }
}

export async function resetStaffPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const password = (req.body as { password?: unknown }).password;
    if (typeof password !== 'string' || password.length < 12 || password.length > 200) {
      res.status(400).json({ error: 'Staff password must be between 12 and 200 characters.' });
      return;
    }
    const staff = await prisma.adminUser.findUnique({ where: { id: String(req.params.id) } });
    if (!staff || staff.role !== AdminRole.STAFF) { res.status(404).json({ error: 'Staff account not found.' }); return; }
    await prisma.adminUser.update({ where: { id: staff.id }, data: { password: await hashPassword(password) } });
    await prisma.passwordResetToken.deleteMany({ where: { accountType: 'ADMIN', accountId: staff.id } });
    await prisma.adminAuditLog.create({ data: { actorId: req.admin!.sub, action: 'STAFF_PASSWORD_RESET', entity: 'STAFF', entityId: staff.id, summary: `Password reset by main admin for ${staff.username}.` } });
    res.status(200).json({ message: 'Staff password changed. Share the new password privately.' });
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
    await prisma.adminAuditLog.create({ data: { actorId: req.admin!.sub, action: active ? 'STAFF_ENABLED' : 'STAFF_DISABLED', entity: 'STAFF', entityId: staff.id, summary: `Staff account ${staff.username} access was ${active ? 'enabled' : 'disabled'}.` } });
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
      prisma.adminAuditLog.create({ data: { actorId: req.admin!.sub, action: 'STAFF_DELETED', entity: 'STAFF', entityId: staff.id, summary: `Disabled staff account ${staff.username} was permanently deleted.` } }),
    ]);
    res.status(200).json({ message: 'Staff account permanently deleted.' });
  } catch (err) { next(err); }
}
