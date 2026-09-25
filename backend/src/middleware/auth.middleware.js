import { verifyAccessToken } from '../config/jwt.js';
import { User } from '../modules/users/user.model.js';
import { ApiError, asyncHandler } from '../utils/helpers.js';

function readBearerToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

async function loadUser(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token');
  }
  if (payload.type !== 'access') throw ApiError.unauthorized('Invalid token');

  const user = await User.findByPk(payload.sub); // includes the role (default scope)
  if (!user || user.status !== 'active') throw ApiError.unauthorized('Account not found or disabled');
  return user;
}

// Requires a valid access token; sets req.user.
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) throw ApiError.unauthorized();
  req.user = await loadUser(token);
  next();
});

// Sets req.user when a valid token is sent, but lets anonymous visitors through.
// Used on public endpoints where staff get extra data (e.g. inactive records).
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req);
  if (token) req.user = await loadUser(token);
  next();
});
