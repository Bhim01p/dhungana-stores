import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import { env } from '../config/env';

const CODE_LIFETIME_MS = 5 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function codeDigest(challengeId: string, code: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(`${challengeId}:${code}`).digest('hex');
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.length < 3 ? `${local[0] ?? ''}…` : `${local.slice(0, 2)}…`;
  return `${visible}@${domain}`;
}

function mailTransport() {
  if (![env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD, env.SMTP_FROM].every(value => value.trim())) {
    throw Object.assign(new Error('Email sign-in codes are not configured. Ask the store owner to check the email settings.'), { statusCode: 503 });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  });
}

export async function sendAdminLoginCode(adminUserId: string, email: string): Promise<{ challengeId: string; emailHint: string; expiresInSeconds: number }> {
  const transport = mailTransport();
  const challengeId = randomBytes(32).toString('base64url');
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS);

  await prisma.adminLoginChallenge.deleteMany({ where: { adminUserId } });
  await prisma.adminLoginChallenge.create({
    data: { id: challengeId, adminUserId, codeHash: codeDigest(challengeId, code), expiresAt },
  });

  try {
    await transport.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: 'Your Bishnu & Dhungana Stores staff sign-in code',
      text: `Your sign-in code is ${code}. It expires in 5 minutes and can only be used once. If you did not try to sign in, you can ignore this email.`,
    });
  } catch {
    await prisma.adminLoginChallenge.deleteMany({ where: { id: challengeId } });
    console.error('Admin sign-in code email delivery failed.');
    throw Object.assign(new Error('Could not send a sign-in code. Check the account email and store email settings.'), { statusCode: 503 });
  }

  return { challengeId, emailHint: maskEmail(email), expiresInSeconds: CODE_LIFETIME_MS / 1000 };
}

export async function consumeAdminLoginCode(challengeId: string, submittedCode: string): Promise<string> {
  const record = await prisma.adminLoginChallenge.findUnique({ where: { id: challengeId } });
  if (!record || record.expiresAt <= new Date() || record.attempts >= MAX_CODE_ATTEMPTS) {
    if (record) await prisma.adminLoginChallenge.deleteMany({ where: { id: challengeId } });
    throw Object.assign(new Error('That sign-in code is invalid or expired. Sign in again to request a new one.'), { statusCode: 401 });
  }

  const expected = Buffer.from(record.codeHash, 'hex');
  const actual = Buffer.from(codeDigest(challengeId, submittedCode), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    const updated = await prisma.adminLoginChallenge.updateMany({
      where: { id: challengeId, attempts: { lt: MAX_CODE_ATTEMPTS }, expiresAt: { gt: new Date() } },
      data: { attempts: { increment: 1 } },
    });
    if (updated.count === 0) throw Object.assign(new Error('That sign-in code is invalid or expired. Sign in again to request a new one.'), { statusCode: 401 });
    throw Object.assign(new Error('That sign-in code is incorrect.'), { statusCode: 401 });
  }

  const claimed = await prisma.adminLoginChallenge.deleteMany({
    where: { id: challengeId, expiresAt: { gt: new Date() }, attempts: { lt: MAX_CODE_ATTEMPTS } },
  });
  if (claimed.count !== 1) throw Object.assign(new Error('That sign-in code is invalid or expired. Sign in again to request a new one.'), { statusCode: 401 });
  return record.adminUserId;
}
