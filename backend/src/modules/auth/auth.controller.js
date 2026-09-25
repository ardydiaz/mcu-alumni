import { authService } from './auth.service.js';
import { m365Service, M365Error } from './auth.m365.service.js';
import { logService } from '../logs/log.service.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../utils/helpers.js';
import { sendSuccess } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';

const requestMeta = (req) => ({ userAgent: req.get('user-agent'), ip: req.ip });

// Short-lived, signed, httpOnly cookie holding state/nonce/PKCE verifier between
// the redirect to Microsoft and the callback. SameSite=Lax so it is sent on the
// top-level redirect back from login.microsoftonline.com.
const FLOW_COOKIE = 'mcu_m365_flow';
const flowCookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: env.isProduction,
  path: '/api/v1/auth/m365',
  maxAge: 10 * 60 * 1000,
};

const loginPageUrl = (error) => `${env.frontendUrl}/admin/login?error=${encodeURIComponent(error)}`;

const m365Controller = {
  // GET /auth/providers - which sign-in methods the login page should show.
  providers(req, res) {
    sendSuccess(res, { data: { microsoft: m365Service.enabled } });
  },

  // GET /auth/m365/login?returnTo=/admin/donations -> redirect to Microsoft
  m365Login: asyncHandler(async (req, res) => {
    if (!m365Service.enabled) return res.redirect(loginPageUrl('not_configured'));
    const { url, flow } = await m365Service.startLogin(req.query.returnTo);
    res.cookie(FLOW_COOKIE, JSON.stringify(flow), flowCookieOptions);
    res.redirect(url);
  }),

  // GET /auth/m365/callback?code=&state= (Microsoft redirects here)
  m365Callback: async (req, res) => {
    let flow = null;
    try {
      flow = req.signedCookies?.[FLOW_COOKIE] ? JSON.parse(req.signedCookies[FLOW_COOKIE]) : null;
    } catch {
      flow = null;
    }
    res.clearCookie(FLOW_COOKIE, { ...flowCookieOptions, maxAge: undefined });

    try {
      if (!m365Service.enabled) throw new M365Error('not_configured');
      const { user, returnTo } = await m365Service.completeLogin(req.query, flow);
      await logService.record(req, { action: 'login', entity: 'User', entityId: user.id, userId: user.id, description: `${user.email} signed in with Microsoft 365 (${user.roleName})` });

      const ticket = await m365Service.createTicket(user);
      // Ticket goes in the URL fragment: never sent to servers or leaked via Referer.
      res.redirect(`${env.frontendUrl}/admin/login/callback#ticket=${encodeURIComponent(ticket)}&next=${encodeURIComponent(returnTo)}`);
    } catch (err) {
      const code = err instanceof M365Error ? err.code : 'sign_in_failed';
      if (!(err instanceof M365Error)) logger.error('Microsoft 365 callback failed', err);
      if (err.created) {
        await logService.record(req, { action: 'create', entity: 'User', description: `Access request: ${err.message}` });
      } else {
        await logService.record(req, { action: 'login_failed', entity: 'User', description: `Microsoft 365 sign-in failed (${code}): ${err.message}` });
      }
      res.redirect(loginPageUrl(code));
    }
  },

  // POST /auth/m365/exchange { ticket } -> our access + refresh tokens
  m365Exchange: asyncHandler(async (req, res) => {
    const user = await m365Service.redeemTicket(req.body.ticket);
    const data = await authService.createSession(user, requestMeta(req));
    sendSuccess(res, { data, message: 'Signed in with Microsoft 365' });
  }),
};

export const authController = {
  ...m365Controller,

  refresh: asyncHandler(async (req, res) => {
    const data = await authService.refresh(req.body.refreshToken, requestMeta(req));
    sendSuccess(res, { data, message: 'Token refreshed' });
  }),

  logout: asyncHandler(async (req, res) => {
    const userId = await authService.logout(req.body.refreshToken);
    if (userId) await logService.record(req, { action: 'logout', entity: 'User', entityId: userId, userId, description: 'Logged out' });
    sendSuccess(res, { message: 'Logged out successfully' });
  }),

  logoutAll: asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);
    await logService.record(req, { action: 'logout', entity: 'User', entityId: req.user.id, description: 'Logged out from all devices' });
    sendSuccess(res, { message: 'Logged out from all devices' });
  }),

  // GET /auth/profile - only reached by admin dashboard roles (see auth.routes.js).
  profile: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: req.user });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user, req.body);
    await logService.record(req, { action: 'update', entity: 'User', entityId: user.id, description: 'Updated own profile' });
    sendSuccess(res, { data: user, message: 'Profile updated successfully' });
  }),
};
