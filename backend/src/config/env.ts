import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT ?? '5000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'changeme-use-a-strong-secret-in-production',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  STAFF_URL: process.env.STAFF_URL ?? '',
  OWNER_ADMIN_EMAIL: process.env.OWNER_ADMIN_EMAIL?.trim().toLowerCase() || 'nishandhungana939@gmail.com',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? '587', 10),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? '',
  TRUST_PROXY_HOPS: parseInt(process.env.TRUST_PROXY_HOPS ?? '0', 10),
} as const;

export const allowedOrigins = [...new Set([
  ...env.FRONTEND_URL.split(',').map((value) => value.trim()).filter(Boolean),
  ...(env.STAFF_URL.trim() ? [env.STAFF_URL.trim()] : []),
])];

if (env.NODE_ENV === 'production') {
  if (!Number.isInteger(env.PORT) || env.PORT < 1 || env.PORT > 65535) throw new Error('PORT must be a valid TCP port.');
  if (!Number.isInteger(env.TRUST_PROXY_HOPS) || env.TRUST_PROXY_HOPS < 0) throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
  if (!env.DATABASE_URL || env.DATABASE_URL.includes('YOUR_PASSWORD')) {
    throw new Error('DATABASE_URL must be configured before starting in production.');
  }
  try {
    const databaseUrl = new URL(env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) throw new Error();
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (env.JWT_SECRET.length < 32 || env.JWT_SECRET === 'changeme-use-a-strong-secret-in-production' || env.JWT_SECRET === 'bishnu-dhungana-stores-dev-secret-2024') {
    throw new Error('JWT_SECRET must be a unique random secret with at least 32 characters in production.');
  }
  if (allowedOrigins.some((origin) => {
    try { return new URL(origin).protocol !== 'https:'; } catch { return true; }
  })) {
    throw new Error('FRONTEND_URL and STAFF_URL must contain HTTPS origins in production.');
  }
  if (![env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD, env.SMTP_FROM].every((value) => value.trim())) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM must be configured in production so password recovery works.');
  }
  if (!Number.isInteger(env.SMTP_PORT) || env.SMTP_PORT < 1 || env.SMTP_PORT > 65535) throw new Error('SMTP_PORT must be a valid TCP port.');
}

// Warn clearly if DATABASE_URL is missing or still a placeholder
if (!env.DATABASE_URL || env.DATABASE_URL.includes('YOUR_PASSWORD')) {
  console.warn(
    '⚠️  WARNING: DATABASE_URL is not configured. ' +
      'Edit backend/.env and replace YOUR_PASSWORD with your real PostgreSQL password.'
  );
}
