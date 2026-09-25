import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { corsMiddleware } from './config/cors.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // correct client IPs for rate limiting behind a reverse proxy
  app.disable('x-powered-by');

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser(env.cookieSecret));
  app.use(requestLogger);

  // Uploaded images and PDFs
  app.use('/uploads', express.static(env.upload.dir, { maxAge: '7d', fallthrough: false }));

  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  // In production, serve the built React app from frontend/dist.
  if (fs.existsSync(env.frontendDist)) {
    app.use(express.static(env.frontendDist));
    app.get('*', (req, res) => res.sendFile(path.join(env.frontendDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
