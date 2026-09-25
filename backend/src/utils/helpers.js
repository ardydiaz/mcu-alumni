import fs from 'node:fs/promises';
import path from 'node:path';
import { Op } from 'sequelize';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { getPagination, buildMeta, getSort } from './pagination.js';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from './response.js';
import { logService } from '../modules/logs/log.service.js';
import { canAccessAdminPanel } from '../middleware/role.middleware.js';

// An error with an HTTP status that the error middleware turns into a response.
export class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static badRequest(message = 'Bad request', errors) { return new ApiError(400, message, errors); }
  static unauthorized(message = 'Authentication required') { return new ApiError(401, message); }
  static forbidden(message = 'You do not have permission to do this') { return new ApiError(403, message); }
  static notFound(message = 'Resource not found') { return new ApiError(404, message); }
  static conflict(message = 'Resource already exists', errors) { return new ApiError(409, message, errors); }
  static unprocessable(message = 'Please check the highlighted fields.', errors) { return new ApiError(422, message, errors); }
}

// Forwards rejected promises from async route handlers to the error middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Admin dashboard users (Super Admin, Administrator) also see hidden/unpublished records.
export const isStaff = (user) => canAccessAdminPanel(user);

// `redirectTo` is for browser-navigation endpoints: send the user to a page instead of a JSON error.
export function createRateLimiter({ windowMinutes = 15, max = 20, message = 'Too many requests. Please try again later.', redirectTo } = {}) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
    ...(redirectTo && { handler: (req, res) => res.redirect(redirectTo) }),
  });
}

// Deletes a file previously saved by the upload middleware. External URLs are ignored.
export async function deleteUploadedFile(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const filePath = path.join(env.upload.dir, fileUrl.replace(/^\/uploads\//, ''));
  if (!filePath.startsWith(env.upload.dir)) return;
  await fs.unlink(filePath).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });
}

/**
 * Standard list/get/create/update/remove service for a Sequelize model.
 *
 * - searchFields: columns matched by ?search= (LIKE %term%)
 * - filterFields: columns matched exactly by ?field=value
 * - sortFields:   columns allowed in ?sort=
 * - publicWhere:  extra conditions applied when the requester is not staff (e.g. only active rows)
 * - fileFields:   columns holding uploaded file URLs, cleaned up on update/delete
 */
export function createCrudService(Model, options = {}) {
  const {
    searchFields = [],
    filterFields = [],
    sortFields = [],
    defaultOrder = [['createdAt', 'DESC']],
    publicWhere = null,
    include,
    fileFields = [],
    label = Model.name,
  } = options;

  const service = {
    async list(query = {}, { user } = {}) {
      const { page, limit, offset } = getPagination(query);
      const where = {};

      for (const field of filterFields) {
        if (query[field] !== undefined && query[field] !== '') where[field] = query[field];
      }
      if (query.search && searchFields.length) {
        where[Op.or] = searchFields.map((field) => ({ [field]: { [Op.like]: `%${query.search}%` } }));
      }
      if (publicWhere && !isStaff(user)) Object.assign(where, publicWhere);

      const { rows, count } = await Model.findAndCountAll({
        where,
        include,
        order: getSort(query, sortFields, defaultOrder),
        limit,
        offset,
        distinct: true,
        // Qualify the counted column: joins from default scopes (e.g. User -> Role) make a bare `id` ambiguous.
        col: `${Model.name}.${Model.primaryKeyField}`,
      });
      return { rows, meta: buildMeta({ page, limit }, count) };
    },

    // `internal: true` skips the public visibility filter (for service-level lookups).
    async getById(id, { user, internal = false } = {}) {
      const item = await Model.findByPk(id, { include });
      const hidden = item && publicWhere && !internal && !isStaff(user) && Object.entries(publicWhere).some(([k, v]) => item[k] !== v);
      if (!item || hidden) throw ApiError.notFound(`${label} not found`);
      return item;
    },

    async create(data) {
      return Model.create(data);
    },

    async update(id, data) {
      const item = await service.getById(id, { internal: true });
      const replacedFiles = fileFields.filter((f) => data[f] !== undefined && data[f] !== item[f]).map((f) => item[f]);
      await item.update(data);
      await Promise.all(replacedFiles.map(deleteUploadedFile));
      return item;
    },

    async remove(id) {
      const item = await service.getById(id, { internal: true });
      await item.destroy();
      await Promise.all(fileFields.map((f) => deleteUploadedFile(item[f])));
    },
  };

  return service;
}

// Human-readable name for a record in activity logs.
export const displayName = (item) =>
  item?.title || item?.name || item?.fullname || (item?.firstName && `${item.firstName} ${item.lastName || ''}`.trim()) || item?.email || `#${item?.id}`;

// Controller handlers matching createCrudService. Staff changes are written to the activity log.
export function createCrudController(service, { label = 'Record' } = {}) {
  const audit = (req, action, item, id = item?.id) =>
    req.user && logService.record(req, { action, entity: label, entityId: id, description: `${action === 'delete' ? 'Deleted' : action === 'create' ? 'Created' : 'Updated'} ${label.toLowerCase()} ${displayName(item ?? { id })}` });

  return {
    list: asyncHandler(async (req, res) => {
      sendPaginated(res, await service.list(req.query, { user: req.user }));
    }),
    getById: asyncHandler(async (req, res) => {
      sendSuccess(res, { data: await service.getById(req.params.id, { user: req.user }) });
    }),
    create: asyncHandler(async (req, res) => {
      const item = await service.create(req.body);
      await audit(req, 'create', item);
      sendCreated(res, item, `${label} created successfully`);
    }),
    update: asyncHandler(async (req, res) => {
      const item = await service.update(req.params.id, req.body);
      await audit(req, 'update', item);
      sendSuccess(res, { data: item, message: `${label} updated successfully` });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await service.getById(req.params.id, { user: req.user }).catch(() => null);
      await service.remove(req.params.id);
      await audit(req, 'delete', item, req.params.id);
      sendNoContent(res);
    }),
  };
}
