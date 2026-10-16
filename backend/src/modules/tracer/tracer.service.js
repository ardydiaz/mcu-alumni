import { fn, col } from 'sequelize';
import { TracerResponse } from './tracer.model.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(TracerResponse, {
  label: 'Tracer response',
  searchFields: ['fullName', 'email', 'employer', 'degree'],
  filterFields: ['degree', 'yearGraduated', 'isEmployed'],
  sortFields: ['fullName', 'degree', 'yearGraduated', 'isEmployed', 'createdAt'],
});

// Counts responses per value of `field`, e.g. { 'Within 6 months': 40, '1 to 2 years': 3 }.
async function countBy(field, where) {
  const rows = await TracerResponse.findAll({
    where,
    attributes: [field, [fn('COUNT', col('id')), 'count']],
    group: [field],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r[field] ?? 'Not answered', Number(r.count)]));
}

// Boolean columns come back as 1/0 (MySQL) or true/false (SQLite).
const yesNoCounts = (counts) => ({ Yes: counts[1] || counts.true || 0, No: counts[0] || counts.false || 0 });

// Job categories are multi-select (a JSON array), so they are tallied here.
async function countJobCategories(where) {
  const rows = await TracerResponse.findAll({ where: { ...where, isEmployed: true }, attributes: ['jobCategories'], raw: true });
  const counts = {};
  for (const { jobCategories } of rows) {
    const list = typeof jobCategories === 'string' ? JSON.parse(jobCategories) : jobCategories || [];
    for (const c of list) counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

const toBool = (v) => v === 'Yes';

export const tracerService = {
  ...crud,

  // `options` is passed to Sequelize (e.g. { transaction } when the portal also updates the account).
  async create({ consent, isEmployed, relatedToDegree, furtherStudies, jobCategories, ...data }, options = {}) {
    const employed = toBool(isEmployed);
    const response = await TracerResponse.create(
      {
        ...data,
        isEmployed: employed,
        jobCategories: employed ? jobCategories : null,
        relatedToDegree: employed ? toBool(relatedToDegree) : null,
        furtherStudies: toBool(furtherStudies),
        consentAt: new Date(),
      },
      options
    );
    return { id: response.id };
  },

  // Aggregates for tracer studies / accreditation reports.
  async summary(filters = {}) {
    const where = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
    const [total, employed, relatedToDegree, timeToFirstJob, furtherStudies, jobCategories] = await Promise.all([
      TracerResponse.count({ where }),
      countBy('isEmployed', where),
      countBy('relatedToDegree', { ...where, isEmployed: true }),
      countBy('timeToFirstJob', { ...where, isEmployed: true }),
      countBy('furtherStudies', where),
      countJobCategories(where),
    ]);
    const { Yes: employedCount, No: notEmployed } = yesNoCounts(employed);
    return {
      total,
      employmentRate: total ? Math.round((employedCount / total) * 1000) / 10 : 0,
      employment: { Employed: employedCount, 'Not employed': notEmployed },
      relatedToDegree: yesNoCounts(relatedToDegree),
      timeToFirstJob,
      furtherStudies: yesNoCounts(furtherStudies),
      jobCategories,
    };
  },
};
