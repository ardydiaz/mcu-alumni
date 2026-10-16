import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const list = (value = '') =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 6002,
  rootDir,

  corsOrigins: list(process.env.CORS_ORIGINS || 'http://localhost:5002'),

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'mcu_alumni',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    sync: process.env.DB_SYNC || 'safe',
    logging: process.env.DB_LOGGING === 'true',
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  upload: {
    dir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads'),
    maxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB) || 5,
  },

  // Where the React app is served; Microsoft sign-in redirects back here.
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5002').replace(/\/+$/, ''),
  // Signs short-lived cookies (Microsoft sign-in state). Falls back to a key derived from the JWT secret.
  cookieSecret: process.env.COOKIE_SECRET || crypto.createHash('sha256').update(`cookie:${required('JWT_ACCESS_SECRET')}`).digest('hex'),

  m365: {
    tenantId: process.env.M365_TENANT_ID || '',
    clientId: process.env.M365_CLIENT_ID || '',
    clientSecret: process.env.M365_CLIENT_SECRET || '',
    redirectUri: process.env.M365_REDIRECT_URI || 'http://localhost:5002/api/v1/auth/m365/callback',
    allowedDomains: list(process.env.M365_ALLOWED_DOMAINS || '').map((d) => d.toLowerCase()),
  },

  // Outgoing email through Microsoft Graph, using the same Entra app as Microsoft 365 sign-in.
  // The app needs the Microsoft Graph *application* permission Mail.Send (admin consent).
  mail: {
    from: (process.env.MAIL_FROM || '').trim(), // mailbox that sends, e.g. alumni@mcu.edu.ph
    fromName: process.env.MAIL_FROM_NAME || 'MCU Alumni Relations',
  },

  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@mcu.edu.ph',
    fullname: process.env.SEED_ADMIN_FULLNAME || 'MCU Administrator',
  },

  frontendDist: path.resolve(rootDir, '..', 'frontend', 'dist'),
};

env.mail.enabled = Boolean(env.mail.from && env.m365.tenantId && env.m365.clientId && env.m365.clientSecret);

env.m365.enabled =
  process.env.M365_ENABLED === 'true' && Boolean(env.m365.tenantId && env.m365.clientId && env.m365.clientSecret);
