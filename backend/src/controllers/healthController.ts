import { Request, Response } from 'express';
import prisma from '../config/prisma';

/**
 * GET /api/health
 * Basic server health check — no database required.
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'unknown',
  });
}

/**
 * GET /api/health/db
 * Verifies that Prisma can actually communicate with PostgreSQL.
 * Runs a lightweight raw query — does NOT fake a result.
 */
export async function dbHealthCheck(_req: Request, res: Response): Promise<void> {
  try {
    // Execute a minimal query to confirm DB connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';

    res.status(503).json({
      status: 'error',
      database: 'unreachable',
      message:
        process.env.NODE_ENV === 'development'
          ? message
          : 'Database connection failed. Check your DATABASE_URL.',
      timestamp: new Date().toISOString(),
    });
  }
}
