import { Op } from 'sequelize';
import { Event } from './event.model.js';
import { ApiError, createCrudService, isStaff } from '../../utils/helpers.js';
import { getPagination, buildMeta, getSort } from '../../utils/pagination.js';

const PUBLIC_STATUS = ['published', 'cancelled']; // drafts are staff-only
const NULLABLE = ['summary', 'description', 'endAt', 'venue', 'onlineUrl', 'image', 'registrationDeadline', 'capacity', 'registrationUrl', 'networkId'];
const include = [{ association: 'network', attributes: ['id', 'name'] }];

const crud = createCrudService(Event, { label: 'Event', include, fileFields: ['image'] });

// '' from forms -> NULL
const clean = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, NULLABLE.includes(k) && v === '' ? null : v]));

const slugify = (text) =>
  text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200) || 'event';

// "grand-homecoming-2027", then "-2", "-3"... if taken. The slug never changes afterwards, so shared links keep working.
async function uniqueSlug(title) {
  const base = slugify(title);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    if (!(await Event.count({ where: { slug } }))) return slug;
  }
}

export const eventService = {
  ...crud,

  // Calendar and lists. Public visitors see published and cancelled events; staff also see drafts.
  async list(query = {}, { user } = {}) {
    const staff = isStaff(user);
    const { page, limit, offset } = getPagination(query);
    const and = [];

    if (staff && query.status) and.push({ status: query.status });
    if (!staff) and.push({ status: { [Op.in]: PUBLIC_STATUS } });
    if (query.category) and.push({ category: query.category });
    if (query.networkId) and.push({ networkId: query.networkId });
    if (query.search) and.push({ [Op.or]: ['title', 'summary', 'venue'].map((f) => ({ [f]: { [Op.like]: `%${query.search}%` } })) });

    // Overlaps the window: starts before `to` and ends (or starts, if no end) after `from`.
    const endsAfter = (date) => ({ [Op.or]: [{ endAt: { [Op.gte]: date } }, { endAt: null, startAt: { [Op.gte]: date } }] });
    if (query.to) and.push({ startAt: { [Op.lte]: query.to } });
    if (query.from) and.push(endsAfter(query.from));
    if (query.upcoming) and.push(endsAfter(new Date()));

    const { rows, count } = await Event.findAndCountAll({
      where: { [Op.and]: and },
      include,
      order: getSort(query, ['startAt', 'title', 'createdAt', 'status'], [['startAt', staff && !query.upcoming && !query.from ? 'DESC' : 'ASC']]),
      limit,
      offset, // the include is belongsTo (one network per event), so rows are never duplicated
    });
    return { rows, meta: buildMeta({ page, limit }, count) };
  },

  // Public detail by slug (or id for the admin panel).
  async getByKey(key, { user } = {}) {
    const where = /^\d+$/.test(key) ? { id: key } : { slug: key };
    const event = await Event.findOne({ where, include });
    if (!event || (!isStaff(user) && !PUBLIC_STATUS.includes(event.status))) throw ApiError.notFound('Event not found');
    return event;
  },

  async create(data) {
    const event = await Event.create({ ...clean(data), slug: await uniqueSlug(data.title) });
    return crud.getById(event.id, { internal: true });
  },

  async update(id, data) {
    const { slug, ...rest } = clean(data); // slug is fixed once created
    await crud.update(id, rest);
    return crud.getById(id, { internal: true });
  },
};
