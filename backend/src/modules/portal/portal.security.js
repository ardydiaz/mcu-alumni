import crypto from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const ISSUER = 'mcu-alumni-api';
const AUDIENCE = 'alumni-portal';
export const ALUMNI_TOKEN_TYPE = 'alumni';

// ---- Passwords: scrypt with a random salt, stored as "scrypt$<salt>$<hash>" ----
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// ---- Email verification tokens: the raw token goes in the email, only its hash is stored ----
export function createEmailToken(hours = 24) {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token), expiresAt: new Date(Date.now() + hours * 3600 * 1000) };
}

export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

// ---- Alumni session tokens ----
// A different `type` and `aud` from staff tokens: the staff auth middleware only accepts
// type "access", and the alumni middleware only accepts type "alumni", so neither can be
// used in place of the other.
export function signAlumniToken(account) {
  return jwt.sign({ sub: String(account.id), type: ALUMNI_TOKEN_TYPE }, env.jwt.accessSecret, {
    expiresIn: process.env.ALUMNI_TOKEN_EXPIRES_IN || '8h',
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export const verifyAlumniToken = (token) => jwt.verify(token, env.jwt.accessSecret, { issuer: ISSUER, audience: AUDIENCE });
