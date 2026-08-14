import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { db } from './src/server/db';
import authRoutes from './src/server/routes/authRoutes';
import userRoutes from './src/server/routes/userRoutes';
import channelRoutes from './src/server/routes/channelRoutes';
import discoverRoutes from './src/server/routes/discoverRoutes';
import promotionRoutes from './src/server/routes/promotionRoutes';
import walletRoutes from './src/server/routes/walletRoutes';
import referralRoutes from './src/server/routes/referralRoutes';
import leaderboardRoutes from './src/server/routes/leaderboardRoutes';
import notificationRoutes from './src/server/routes/notificationRoutes';
import adminRoutes from './src/server/routes/adminRoutes';
import sub4subRoutes from './src/server/routes/sub4subRoutes';
import { apiLimiter } from './src/server/middleware/rateLimit';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database Connection (Firebase Firestore & Auth)
  await db.initDatabase();

  // Trust proxy for reverse proxies (Cloud Run / Nginx)
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

        // Default allow any valid web client origin with credentials for maximum hosting compatibility
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Apply Rate Limiting to API Routes
  app.use('/api', apiLimiter);

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/channels', channelRoutes);
  app.use('/api/discover', discoverRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/referrals', referralRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/sub4sub', sub4subRoutes);

  // Production Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      database: db.isFirestoreReady() ? 'firebase_firestore' : 'synchronized_in_memory',
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handling Middleware (Never leak stack traces)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err.message || err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR',
    });
  });

  // Vite Middleware for Development or Static Serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SubLoop Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
