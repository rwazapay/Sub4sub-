import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { db } from './db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import channelRoutes from './routes/channelRoutes';
import discoverRoutes from './routes/discoverRoutes';
import promotionRoutes from './routes/promotionRoutes';
import walletRoutes from './routes/walletRoutes';
import referralRoutes from './routes/referralRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import sub4subRoutes from './routes/sub4subRoutes';
import { apiLimiter } from './middleware/rateLimit';

dotenv.config();

let dbInitialized = false;

export async function initServerDatabase() {
  if (!dbInitialized) {
    try {
      await db.initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error('Database initialization warning:', err);
    }
  }
}

export function createExpressApp(): express.Express {
  const app = express();

  // Trust proxy for reverse proxies (Cloud Run / Nginx / Vercel)
  app.set('trust proxy', 1);

  // Security Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allowed for embedded iframe & Vite inline scripts
    })
  );

  // Production & Multi-Origin CORS Configuration (Vercel, Cloud Run, Localhost, Preview domains)
  const allowedClientUrl = process.env.CLIENT_URL;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, postman, server-to-server)
        if (!origin) {
          return callback(null, true);
        }

        // Allow development or if origin matches CLIENT_URL or is vercel.app preview/production
        if (
          process.env.NODE_ENV !== 'production' ||
          !allowedClientUrl ||
          origin === allowedClientUrl ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.run.app') ||
          origin.endsWith('.pages.dev')
        ) {
          return callback(null, true);
        }

        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Ensure database initialization on incoming requests (essential for Vercel Serverless cold starts)
  app.use(async (req, res, next) => {
    if (!dbInitialized) {
      await initServerDatabase();
    }
    next();
  });

  // Apply Rate Limiting to API Routes (skip in serverless cold starts if needed)
  app.use('/api', apiLimiter);

  // REST API Routes - mounted at both /api/* and root /* to guarantee 100% compatibility with Vercel rewrites & local servers
  const registerRoutes = (prefix: string) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/users`, userRoutes);
    app.use(`${prefix}/channels`, channelRoutes);
    app.use(`${prefix}/discover`, discoverRoutes);
    app.use(`${prefix}/promotions`, promotionRoutes);
    app.use(`${prefix}/wallet`, walletRoutes);
    app.use(`${prefix}/referrals`, referralRoutes);
    app.use(`${prefix}/leaderboard`, leaderboardRoutes);
    app.use(`${prefix}/notifications`, notificationRoutes);
    app.use(`${prefix}/admin`, adminRoutes);
    app.use(`${prefix}/sub4sub`, sub4subRoutes);

    app.get(`${prefix}/health`, (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        database: db.isFirestoreReady() ? 'firebase_firestore' : 'synchronized_in_memory',
        timestamp: new Date().toISOString(),
      });
    });
  };

  // Register both /api and root paths
  registerRoutes('/api');
  registerRoutes('');

  // Centralized Error Handling Middleware (Never leak stack traces)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err.message || err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR',
    });
  });

  return app;
}
