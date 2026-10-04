import { createHash, randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { env } from '../config/env';

export type ResetAccountType = 'CUSTOMER' | 'ADMIN';
const lastResetRequests = new Map<string, number>();

function digest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function assertMailConfiguration(): void {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw Object.assign(new Error('Password recovery email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in backend/.env, then restart the backend.'), { statusCode: 503 });
  }
}

export async function requestPasswordReset(type: ResetAccountType, email: string): Promise<void> {
  assertMailConfiguration();
  const normalizedEmail = email.trim().toLowerCase();
  const requestKey = createHash('sha256').update(`${type}:${normalizedEmail}`).digest('hex');
  const currentTime = Date.now();
  if ((lastResetRequests.get(requestKey) ?? 0) > currentTime - 60_000) return;
  lastResetRequests.set(requestKey, currentTime);
  if (lastResetRequests.size > 10_000) {
    for (const [key, requestedAt] of lastResetRequests) if (requestedAt <= currentTime - 60_000) lastResetRequests.delete(key);
  }
  const account = type === 'CUSTOMER'
    ? await prisma.customer.findUnique({ where: { email: normalizedEmail }, select: { id: true, active: true, email: true } })
    : normalizedEmail === env.OWNER_ADMIN_EMAIL.trim().toLowerCase()
      ? await prisma.adminUser.findFirst({ where: { role: 'ADMIN', recoveryEmail: { equals: normalizedEmail, mode: 'insensitive' } }, select: { id: true, active: true, recoveryEmail: true, role: true } })
      : null;

  if (!account || !account.active) return;
  const destination = type === 'CUSTOMER'
    ? (account as { email: string }).email
    : (account as { recoveryEmail: string | null; role: string }).role === 'ADMIN'
      ? env.OWNER_ADMIN_EMAIL
      : (account as { recoveryEmail: string | null }).recoveryEmail;
  if (!destination) return;

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = digest(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.passwordResetToken.deleteMany({ where: { accountType: type, accountId: account.id } });
  await prisma.passwordResetToken.create({ data: { tokenHash, accountType: type, accountId: account.id, expiresAt } });

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
  const publicSiteUrl = env.FRONTEND_URL.split(',')[0].trim();
  const resetSiteUrl = type === 'ADMIN' ? (env.STAFF_URL.trim() || publicSiteUrl) : publicSiteUrl;
  const resetUrl = new URL(`/reset-password?type=${type.toLowerCase()}&token=${encodeURIComponent(rawToken)}`, resetSiteUrl).toString();
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: destination,
      subject: 'Reset your Bishnu & Dhungana Stores password',
      text: `Use this link to reset your password. It expires in 30 minutes and can only be used once:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    });
  } catch {
    await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
    console.error('Password reset email delivery failed.');
  }
}

export async function completePasswordReset(type: ResetAccountType, rawToken: string, newPassword: string): Promise<void> {
  if (newPassword.length < 12) {
    throw Object.assign(new Error('Password must be at least 12 characters.'), { statusCode: 400 });
  }
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(rawToken)) {
    throw Object.assign(new Error('This reset link is invalid or has expired.'), { statusCode: 400 });
  }

  const tokenHash = digest(rawToken);
  const now = new Date();
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, accountType: type, expiresAt: { gt: now } },
  });
  if (!record) throw Object.assign(new Error('This reset link is invalid or has expired.'), { statusCode: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction(async tx => {
    const claimed = await tx.passwordResetToken.deleteMany({ where: { id: record.id, expiresAt: { gt: now } } });
    if (claimed.count !== 1) throw Object.assign(new Error('This reset link is invalid or has expired.'), { statusCode: 400 });
    if (type === 'CUSTOMER') {
      const result = await tx.customer.updateMany({ where: { id: record.accountId, active: true }, data: { password: passwordHash, passwordChangedAt: new Date() } });
      if (result.count !== 1) throw Object.assign(new Error('This reset link is invalid or has expired.'), { statusCode: 400 });
    } else {
      const result = await tx.adminUser.updateMany({ where: { id: record.accountId, active: true, role: 'ADMIN', recoveryEmail: { equals: env.OWNER_ADMIN_EMAIL.trim().toLowerCase(), mode: 'insensitive' } }, data: { password: passwordHash } });
      if (result.count !== 1) throw Object.assign(new Error('This reset link is invalid or has expired.'), { statusCode: 400 });
    }
    await tx.passwordResetToken.deleteMany({ where: { accountType: type, accountId: record.accountId } });
  });
}
