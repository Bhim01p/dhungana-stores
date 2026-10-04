import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { verifyPassword, signToken, hashPassword } from '../services/authService';
import { completePasswordReset, requestPasswordReset } from '../services/passwordResetService';
import { consumeAdminLoginCode, sendAdminLoginCode } from '../services/adminLoginCodeService';
import { env } from '../config/env';

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { username } });

    if (!admin || !admin.active) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const valid = await verifyPassword(password, admin.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const destination = admin.role === 'ADMIN' ? env.OWNER_ADMIN_EMAIL : admin.recoveryEmail;
    if (!destination) {
      res.status(503).json({ error: 'This staff account has no sign-in email. Ask the store owner to update the account.' });
      return;
    }
    const challenge = await sendAdminLoginCode(admin.id, destination);
    res.status(200).json({ requiresCode: true, ...challenge });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-login-code
export async function verifyLoginCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { challengeId, code } = req.body as { challengeId?: string; code?: string };
    if (!challengeId || !/^[0-9]{6}$/.test(code ?? '')) {
      res.status(400).json({ error: 'Enter the 6-digit code from your email.' });
      return;
    }
    const adminId = await consumeAdminLoginCode(challengeId, code!);
    const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin || !admin.active) {
      res.status(401).json({ error: 'This account is inactive. Ask the store owner for access.' });
      return;
    }
    const token = signToken({ sub: admin.id, username: admin.username, role: admin.role });
    res.status(200).json({ token, admin: { id: admin.id, username: admin.username, role: admin.role, permissions: admin.permissions, imageUrl: admin.imageUrl } });
  } catch (err) { next(err); }
}

// GET /api/auth/me
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin!.sub },
      select: { id: true, username: true, recoveryEmail: true, imageUrl: true, role: true, permissions: true, active: true, createdAt: true },
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin user not found.' });
      return;
    }

    res.status(200).json(admin);
  } catch (err) {
    next(err);
  }
}

export async function updateProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const imageUrl = (req.body as { imageUrl?: string | null }).imageUrl;
    if (imageUrl !== null && typeof imageUrl !== 'string') {
      res.status(400).json({ error: 'A profile photo URL is required.' });
      return;
    }
    if (imageUrl) {
      let parsed: URL;
      try { parsed = new URL(imageUrl); } catch { res.status(400).json({ error: 'Profile photo URL is invalid.' }); return; }
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') {
        res.status(400).json({ error: 'Profile photos must be uploaded through the account photo uploader.' });
        return;
      }
    }
    const admin = await prisma.adminUser.update({
      where: { id: req.admin!.sub },
      data: { imageUrl },
      select: { id: true, username: true, recoveryEmail: true, imageUrl: true, role: true },
    });
    await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: 'PROFILE_PHOTO_CHANGED', entity: 'ADMIN_USER', entityId: admin.id, summary: `Profile photo updated for ${admin.username}.` } });
    const token = signToken({ sub: admin.id, username: admin.username, role: admin.role });
    res.status(200).json({ ...admin, token });
  } catch (err) { next(err); }
}

// PATCH /api/auth/password
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }
    if (newPassword.length < 12) {
      res.status(400).json({ error: 'New password must be at least 12 characters.' });
      return;
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.sub } });
    if (!admin || !admin.active) {
      res.status(401).json({ error: 'Admin account is inactive or no longer exists.' });
      return;
    }
    if (admin.role !== 'ADMIN') {
      res.status(403).json({ error: 'Staff passwords can only be changed by the main admin.' });
      return;
    }
    if (!(await verifyPassword(currentPassword, admin.password))) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { password: await hashPassword(newPassword) },
    });
    await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: 'PASSWORD_CHANGED', entity: 'ADMIN_USER', entityId: admin.id, summary: `Password changed for ${admin.username}.` } });
    res.status(200).json({ message: 'Password updated. Sign in again with your new password.' });
  } catch (err) { next(err); }
}

export async function updateRecoveryEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = (req.body as { email?: string }).email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Enter a valid recovery email address.' });
      return;
    }
    if (req.admin!.role === 'ADMIN' && email !== env.OWNER_ADMIN_EMAIL) {
      res.status(400).json({ error: `The main admin email is fixed to ${env.OWNER_ADMIN_EMAIL}.` });
      return;
    }
    const admin = await prisma.adminUser.update({ where: { id: req.admin!.sub }, data: { recoveryEmail: email }, select: { id: true, username: true, recoveryEmail: true, role: true } });
    await prisma.adminAuditLog.create({ data: { actorId: admin.id, action: 'RECOVERY_EMAIL_CHANGED', entity: 'ADMIN_USER', entityId: admin.id, summary: `Recovery email updated for ${admin.username}.` } });
    res.status(200).json(admin);
  } catch (err) { next(err); }
}

export async function forgotAdminPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = (req.body as { email?: string }).email ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    await requestPasswordReset('ADMIN', email);
    res.status(200).json({ message: 'If an active account uses that recovery email, a reset link will be sent shortly.' });
  } catch (err) { next(err); }
}

export async function resetAdminPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) { res.status(400).json({ error: 'Reset link and new password are required.' }); return; }
    await completePasswordReset('ADMIN', token, password);
    res.status(200).json({ message: 'Password reset. Sign in with your new password.' });
  } catch (err) { next(err); }
}
