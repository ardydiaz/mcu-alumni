import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/database.js';
import { authService } from './modules/auth/auth.service.js';
import { m365Service } from './modules/auth/auth.m365.service.js';
import { logger } from './utils/logger.js';

async function start() {
  try {
    await connectDatabase();
  } catch (err) {
    logger.error(`Could not connect to MySQL: ${err.message}`);
    logger.error('Check DB_HOST, DB_USER and DB_PASSWORD in backend/.env and that MySQL is running.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`MCU Alumni API running on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`);
  });

  // Clean up expired/revoked refresh tokens and used Microsoft 365 sign-in tickets every hour.
  const purge = () =>
    Promise.all([authService.purgeStaleTokens(), m365Service.purgeTickets()]).catch((err) => logger.warn(`Token purge failed: ${err.message}`));
  purge();
  const purgeTimer = setInterval(purge, 60 * 60 * 1000).unref();
  if (m365Service.enabled) logger.info('Microsoft 365 sign-in enabled');

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down...`);
    clearInterval(purgeTimer);
    server.close(async () => {
      await closeDatabase().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => logger.error('Unhandled promise rejection', reason));

start();
