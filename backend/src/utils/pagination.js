export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Reads ?page=&limit= and returns Sequelize-ready limit/offset.
export function getPagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT));
  return { page, limit, offset: (page - 1) * limit };
}

export function buildMeta({ page, limit }, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
}

// Reads ?sort=field&order=asc|desc, only allowing whitelisted fields.
export function getSort(query = {}, allowedFields = [], defaultOrder = [['createdAt', 'DESC']]) {
  if (!query.sort || !allowedFields.includes(query.sort)) return defaultOrder;
  const direction = String(query.order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return [[query.sort, direction]];
}
