import { Op } from 'sequelize';
import { ActivityLog } from './log.model.js';
import { User } from '../users/user.model.js';
import { getPagination, buildMeta, getSort } from '../../utils/pagination.js';
import { logger } from '../../utils/logger.js';

export const logService = {
  // Records an audit entry. Never throws: a failed log must not fail the request.
  async record(req, { action, entity, entityId, description, userId }) {
    try {
      await ActivityLog.create({
        userId: userId ?? req.user?.id ?? null,
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        description: description?.slice(0, 500),
        ipAddress: req.ip,
        userAgent: req.get('user-agent')?.slice(0, 255),
      });
    } catch (err) {
      logger.warn(`Could not write activity log: ${err.message}`);
    }
  },

  async list(query = {}) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    for (const field of ['action', 'entity', 'userId']) if (query[field]) where[field] = query[field];
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt[Op.gte] = query.from;
      if (query.to) where.createdAt[Op.lte] = query.to;
    }
    if (query.search) where.description = { [Op.like]: `%${query.search}%` };

    const { rows, count } = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'fullname', 'email'] }],
      order: getSort(query, ['createdAt', 'action', 'entity'], [['createdAt', 'DESC']]),
      limit,
      offset,
    });
    return { rows, meta: buildMeta({ page, limit }, count) };
  },
};
