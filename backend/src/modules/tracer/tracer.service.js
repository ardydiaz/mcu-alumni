import { fn, col } from 'sequelize';
import { TracerResponse } from './tracer.model.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(TracerResponse, {
  label: 'Tracer response',
  searchFields: ['firstName', 'lastName', 'email', 'employer'],
  filterFields: ['course', 'yearGraduated', 'employmentStatus'],
  sortFields: ['lastName', 'course', 'yearGraduated', 'employmentStatus', 'createdAt'],
});

// Counts responses per value of `field`, e.g. { Employed: 40, Unemployed: 3 }.
async function countBy(field, where) {
  const rows = await TracerResponse.findAll({
    where,
    attributes: [field, [fn('COUNT', col('id')), 'count']],
    group: [field],
    raw: true,
  });
  return Object.fromEntries(rows.map((r) => [r[field] ?? 'Not answered', Number(r.count)]));
}

export const tracerService = {
  ...crud,

  async create({ consent, relatedToCourse, ...data }) {
    const clean = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
    const response = await TracerResponse.create({
      ...clean,
      relatedToCourse: relatedToCourse ? relatedToCourse === 'Yes' : null,
      consentAt: new Date(),
    });
    return { id: response.id };
  },

  // Aggregates for tracer studies / accreditation reports.
  async summary(filters = {}) {
    const where = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined));
    const [total, employmentStatus, timeToFirstJob, monthlyIncome, relatedToCourse] = await Promise.all([
      TracerResponse.count({ where }),
      countBy('employmentStatus', where),
      countBy('timeToFirstJob', where),
      countBy('monthlyIncome', where),
      countBy('relatedToCourse', where),
    ]);
    const employed = (employmentStatus.Employed || 0) + (employmentStatus['Self-employed'] || 0);
    return {
      total,
      employmentRate: total ? Math.round((employed / total) * 1000) / 10 : 0,
      employmentStatus,
      timeToFirstJob,
      monthlyIncome,
      relatedToCourse: { Yes: relatedToCourse[1] || relatedToCourse.true || 0, No: relatedToCourse[0] || relatedToCourse.false || 0 },
    };
  },
};
