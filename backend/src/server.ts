import './config/env'; // Must be first â€” loads and validates environment variables
import express, { Application } from 'express';
import cors from 'cors';
import { allowedOrigins, env } from './config/env';
import apiRoutes from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimit } from './middleware/rateLimit';

const app: Application = express();
if (env.NODE_ENV === 'production' && env.TRUST_PROXY_HOPS > 0) app.set('trust proxy', env.TRUST_PROXY_HOPS);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MIDDLEWARE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// CORS â€” allow localhost origins in development
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? allowedOrigins
        : (origin: string | undefined, cb: (e: Error | null, allow?: boolean) => void) => {
            // Allow requests from localhost, local network IPs (192.168.x.x, 10.x.x.x, 172.x.x.x)
            // and requests with no origin (same-origin / mobile apps)
            if (!origin) return cb(null, true);
            if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
              return cb(null, true);
            }
            return cb(new Error('CORS not allowed for this origin'));
          },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Basic security headers for API responses.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Bound request size to reduce accidental or abusive oversized payloads.
app.use(express.json({ limit: '100kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Slow down credential guessing, reset-email abuse, and order spam.
app.use('/api/auth/login', rateLimit(10, 15 * 60 * 1000));
app.use('/api/auth/verify-login-code', rateLimit(20, 15 * 60 * 1000));
app.use('/api/auth/forgot-password', rateLimit(5, 60 * 60 * 1000));
app.use('/api/customers/login', rateLimit(10, 15 * 60 * 1000));
app.use('/api/customers/signup', rateLimit(10, 60 * 60 * 1000));
app.use('/api/customers/forgot-password', rateLimit(5, 60 * 60 * 1000));
app.use('/api/contact', rateLimit(5, 15 * 60 * 1000));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ROUTES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.use('/api', apiRoutes);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ERROR HANDLING (must come after all routes)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.use(notFoundHandler);
app.use(errorHandler);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// START SERVER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`\nðŸš€ Bishnu and Dhungana Stores API`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Server      : http://localhost:${env.PORT}`);
  console.log(`   Health      : http://localhost:${env.PORT}/api/health`);
  console.log(`   DB Health   : http://localhost:${env.PORT}/api/health/db\n`);
});

export default app;
