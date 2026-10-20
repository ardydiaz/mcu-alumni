import { AlumniAccount } from './alumniAccount.model.js';
import { ALUMNI_TOKEN_TYPE, verifyAlumniToken } from './portal.security.js';
import { ApiError, asyncHandler } from '../../utils/helpers.js';
import { portalPassword } from './portal.password.js';

// Requires an Alumni Portal session; sets req.alumni. Staff tokens are rejected (different type and audience).
export const authenticateAlumni = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyAlumniToken(token);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid session');
  }
  if (payload.type !== ALUMNI_TOKEN_TYPE) throw ApiError.unauthorized('Invalid session');

  // Re-read on every request so a rejection takes effect immediately.
  const account = await AlumniAccount.findByPk(payload.sub);
  if (!account || !['pending', 'verified'].includes(account.status)) throw ApiError.unauthorized('Account not found or not active');
  // Password changed since this session started (e.g. reset after "Forgot password"): sign this device out.
  if (portalPassword.sessionRevoked(account, payload)) {
    throw ApiError.unauthorized('Your password was changed. Please log in again.');
  }
  req.alumni = account;
  next();
});
