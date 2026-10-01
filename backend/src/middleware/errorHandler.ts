import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Centralised error handling middleware.
 * Must be registered LAST (after all routes).
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? 'Internal server error';

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with that value already exists (unique constraint).';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found.';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed.';
        break;
      default:
        statusCode = 400;
        message = 'Database request error.';
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided.';
  }

  const body: Record<string, unknown> = { error: message };

  // Include stack trace in development only — never in production
  if (env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

/**
 * 404 handler for unknown routes.
 * Register before errorHandler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
