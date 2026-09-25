// Microsoft 365 (Entra ID) sign-in: OAuth 2.0 authorization code flow with PKCE.
//
//   1. startLogin     -> Microsoft authorize URL + flow data (state, nonce, PKCE verifier) kept in a signed cookie
//   2. completeLogin  -> verifies state, exchanges the code, checks nonce / tenant / domain, then finds the user + role in the database
//   3. createTicket   -> one-time ticket for the React app (redirect), redeemed once via redeemTicket for our JWTs
import crypto from 'node:crypto';
import { Op, UniqueConstraintError } from 'sequelize';
import { ROLE_IDS } from '../../middleware/role.middleware.js';
import { CryptoProvider } from '@azure/msal-node';
import { getMsalClient, m365Config } from '../../config/m365.js';
import { User } from '../users/user.model.js';
import { LoginTicket } from './auth.model.js';
import { ApiError } from '../../utils/helpers.js';

const FLOW_TTL_MS = 10 * 60 * 1000;
const TICKET_TTL_MS = 60 * 1000;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cryptoProvider = new CryptoProvider();
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Error codes are passed to the React login page, which shows a friendly message for each.
export class M365Error extends Error {
  constructor(code, detail) {
    super(detail || code);
    this.code = code;
  }
}

// Only allow returning to admin pages, never to another site.
export const safeReturnPath = (value) => (typeof value === 'string' && /^\/admin(\/[\w-]+)*\/?$/.test(value) ? value : '/admin');

// Someone signing in for the first time is saved as a pending access request with
// the lowest role; a Super Admin approves (and sets the real role) on the Users page.
const REQUEST_ROLE_ID = ROLE_IDS.Student;

async function createAccessRequest(claims, email, oid) {
  try {
    await User.create({
      email,
      microsoftId: oid,
      fullname: String(claims.name || email.split('@')[0]).trim().slice(0, 150),
      roleId: REQUEST_ROLE_ID,
      status: 'pending',
    });
  } catch (err) {
    // Two sign-ins at the same moment: the other one already saved the request.
    if (!(err instanceof UniqueConstraintError)) throw err;
  }
  const error = new M365Error('pending_approval', `${email} requested access (pending approval)`);
  error.created = true;
  throw error;
}

/**
 * Looks up the verified Microsoft account in the users table:
 *   SELECT * FROM users WHERE microsoft_id = :oid   (after the first sign-in)
 *   SELECT * FROM users WHERE email = :email        (first sign-in; links microsoft_id)
 * The role comes from users.role_id -> roles.name.
 *   - not in the table  -> saved as a pending access request (status 'pending')
 *   - pending           -> still waiting for approval
 *   - inactive          -> rejected
 */
export async function resolveUser(claims) {
  const oid = claims.oid;
  const email = String(claims.email || claims.preferred_username || claims.upn || '').toLowerCase().trim();
  if (!oid || !email.includes('@')) throw new M365Error('sign_in_failed', 'Token is missing the oid or email claim');

  const domain = email.split('@')[1];
  if (m365Config.allowedDomains.length && !m365Config.allowedDomains.includes(domain)) {
    throw new M365Error('domain_not_allowed', `${email} is not in an allowed domain`);
  }

  let user = await User.findOne({ where: { microsoftId: oid } });
  if (!user) {
    user = await User.findOne({ where: { email } });
    if (user?.microsoftId && user.microsoftId !== oid) {
      throw new M365Error('account_mismatch', `${email} is linked to a different Microsoft account`);
    }
  }
  if (!user) return createAccessRequest(claims, email, oid);

  if (!user.microsoftId) await user.update({ microsoftId: oid });
  if (user.status === 'pending') throw new M365Error('pending_approval', `${email} is still waiting for approval`);
  if (user.status !== 'active') throw new M365Error('account_disabled', `${email} is inactive`);
  return { user };
}

export const m365Service = {
  get enabled() {
    return m365Config.enabled;
  },

  async startLogin(returnTo) {
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
    const flow = { state: randomToken(), nonce: randomToken(), verifier, returnTo: safeReturnPath(returnTo), createdAt: Date.now() };
    const url = await getMsalClient().getAuthCodeUrl({
      scopes: m365Config.scopes,
      redirectUri: m365Config.redirectUri,
      state: flow.state,
      nonce: flow.nonce,
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      responseMode: 'query',
      prompt: 'select_account',
    });
    return { url, flow };
  },

  async completeLogin(query, flow) {
    if (query.error) {
      throw new M365Error(query.error === 'access_denied' ? 'access_denied' : 'sign_in_failed', `${query.error}: ${query.error_description || ''}`.trim());
    }
    if (!flow || !query.state || !safeEqual(flow.state, query.state) || Date.now() - flow.createdAt > FLOW_TTL_MS) {
      throw new M365Error('invalid_state', 'Sign-in state is missing, does not match or has expired');
    }
    if (!query.code) throw new M365Error('sign_in_failed', 'No authorization code returned');

    let result;
    try {
      result = await getMsalClient().acquireTokenByCode({
        code: String(query.code),
        scopes: m365Config.scopes,
        redirectUri: m365Config.redirectUri,
        codeVerifier: flow.verifier,
        nonce: flow.nonce,
        state: flow.state,
      });
    } catch (err) {
      throw new M365Error('sign_in_failed', err.errorCode ? `${err.errorCode}: ${err.errorMessage || err.message}` : err.message);
    }

    const claims = result.idTokenClaims || {};
    if (!claims.nonce || !safeEqual(claims.nonce, flow.nonce)) throw new M365Error('invalid_state', 'ID token nonce does not match');
    // The single-tenant authority already restricts sign-in; double-check when the tenant is configured as a GUID.
    if (GUID.test(m365Config.tenantId) && claims.tid?.toLowerCase() !== m365Config.tenantId.toLowerCase()) {
      throw new M365Error('wrong_tenant', `Token issued for tenant ${claims.tid}`);
    }

    return { ...(await resolveUser(claims)), returnTo: flow.returnTo };
  },

  async createTicket(user) {
    const ticket = randomToken();
    await LoginTicket.create({ userId: user.id, ticketHash: sha256(ticket), expiresAt: new Date(Date.now() + TICKET_TTL_MS) });
    return ticket;
  },

  // Single use: the conditional update guarantees two concurrent requests can't both redeem it.
  async redeemTicket(ticket) {
    const expired = ApiError.unauthorized('This sign-in has expired. Please sign in with Microsoft 365 again.');
    const record = await LoginTicket.findOne({ where: { ticketHash: sha256(ticket), usedAt: null, expiresAt: { [Op.gt]: new Date() } } });
    if (!record) throw expired;
    const [claimed] = await LoginTicket.update({ usedAt: new Date() }, { where: { id: record.id, usedAt: null } });
    if (!claimed) throw expired;

    const user = await User.findByPk(record.userId);
    if (user?.status !== 'active') throw ApiError.forbidden('Your account has been disabled. Please contact an administrator.');
    return user;
  },

  async purgeTickets() {
    return LoginTicket.destroy({ where: { [Op.or]: [{ expiresAt: { [Op.lt]: new Date() } }, { usedAt: { [Op.ne]: null } }] } });
  },
};
