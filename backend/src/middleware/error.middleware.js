import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError, DatabaseError } from 'sequelize';
import { env } from '../config/env.js';
import { ApiError } from '../utils/helpers.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

const fieldErrors = (err) =>
  Object.fromEntries((err.errors || []).map((e) => [e.path, e.message]));

// Translates known errors to API responses; anything else becomes a 500.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return sendError(res, { statusCode: err.statusCode, message: err.message, errors: err.errors });
  }
  if (err.type === 'entity.parse.failed') {
    return sendError(res, { statusCode: 400, message: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, { statusCode: 413, message: 'Request body is too large' });
  }
  if (err instanceof UniqueConstraintError) {
    return sendError(res, { statusCode: 409, message: 'A record with this value already exists', errors: fieldErrors(err) });
  }
  if (err instanceof ForeignKeyConstraintError) {
    return sendError(res, { statusCode: 409, message: 'This record is linked to other records' });
  }
  if (err instanceof ValidationError) {
    return sendError(res, { statusCode: 422, message: 'Please check the highlighted fields.', errors: fieldErrors(err) });
  }
  // Client errors raised by Express/static middleware (e.g. missing upload file).
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    return sendError(res, { statusCode: status, message: status === 404 ? 'File not found' : err.message });
  }

  logger.error(`${req.method} ${req.originalUrl} failed`, err instanceof DatabaseError ? err.message : err);
  return sendError(res, {
    statusCode: 500,
    message: env.isProduction ? 'Something went wrong. Please try again later.' : err.message,
  });
}
