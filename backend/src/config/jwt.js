import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from './env.js';

const ISSUER = 'mcu-alumni-api';

// Payload: { id, email, role } (role name from the `roles` table, e.g. "Super Admin").
// Authorization still re-reads the user from the database on every request, so a
// role change or deactivation takes effect immediately.
export function signAccessToken(user) {
  const payload = { sub: String(user.id), id: user.id, email: user.email, role: user.roleName, type: 'access' };
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: ISSUER,
  });
}

// Each refresh token carries a unique id (jti) so it can be stored and revoked.
export function signRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: String(user.id), type: 'refresh', jti }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: ISSUER,
  });
  const { exp } = jwt.decode(token);
  return { token, jti, expiresAt: new Date(exp * 1000) };
}

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret, { issuer: ISSUER });

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret, { issuer: ISSUER });
