import crypto from 'node:crypto';
import { Op } from 'sequelize';
import { RefreshToken } from './auth.model.js';
import { User } from '../users/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/helpers.js';

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function issueTokens(user, meta = {}) {
  const refresh = signRefreshToken(user);
  await RefreshToken.create({
    userId: user.id,
    jti: refresh.jti,
    tokenHash: hash(refresh.token),
    expiresAt: refresh.expiresAt,
    userAgent: meta.userAgent?.slice(0, 255),
    ipAddress: meta.ip,
  });
  return {
    accessToken: signAccessToken(user),
    refreshToken: refresh.token,
    tokenType: 'Bearer',
    expiresIn: env.jwt.accessExpiresIn,
  };
}

export const authService = {
  // Starts a session for a user verified by Microsoft 365. Any role gets a JWT;
  // what they may access is decided per route (e.g. /auth/profile for the dashboard).
  async createSession(user, meta) {
    await user.update({ lastLoginAt: new Date() });
    return { user, ...(await issueTokens(user, meta)) };
  },

  // Exchanges a refresh token for a new pair; the old one is revoked (rotation).
  async refresh(refreshToken, meta) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const stored = await RefreshToken.findOne({ where: { jti: payload.jti } });
    if (!stored || stored.tokenHash !== hash(refreshToken)) throw ApiError.unauthorized('Invalid or expired refresh token');

    // A revoked token being reused suggests it was stolen: revoke every session for the user.
    if (stored.revokedAt) {
      await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: stored.userId, revokedAt: null } });
      throw ApiError.unauthorized('Session is no longer valid. Please sign in again.');
    }

    const user = await User.findByPk(stored.userId); // current role + status
    if (!stored.isValid || user?.status !== 'active') throw ApiError.unauthorized('Invalid or expired refresh token');

    await stored.update({ revokedAt: new Date() });
    return { user, ...(await issueTokens(user, meta)) };
  },

  // Returns the user id the token belonged to, or null for an invalid token (a no-op).
  async logout(refreshToken) {
    try {
      const { jti, sub } = verifyRefreshToken(refreshToken);
      const [revoked] = await RefreshToken.update({ revokedAt: new Date() }, { where: { jti, revokedAt: null } });
      return revoked ? Number(sub) : null;
    } catch {
      return null;
    }
  },

  async logoutAll(userId) {
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null } });
  },

  async updateProfile(user, data) {
    return user.update(data);
  },

  // Housekeeping: drop tokens that expired or were revoked more than a day ago.
  async purgeStaleTokens() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return RefreshToken.destroy({ where: { [Op.or]: [{ expiresAt: { [Op.lt]: new Date() } }, { revokedAt: { [Op.lt]: cutoff } }] } });
  },
};
