import { Router } from 'express';
import { alumniReportService, REPORT_TYPES, GRADUATE_COLUMNS } from './alumniReport.service.js';
import { logService } from '../logs/log.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, Joi, year } from '../../middleware/validation.middleware.js';
import { asyncHandler } from '../../utils/helpers.js';
import { SEXES, INDUSTRIES, JOB_CATEGORIES } from '../content/content.data.js';
import { sendSuccess } from '../../utils/response.js';

// Staff (EAO): /api/v1/alumni-reports — Step 13: Report Generation.
//   GET /:type          report as JSON (preview / print)
//   GET /:type/export   the same report as CSV for Excel
// Every report generated or exported is written to the activity log (who, which report, which filters).

const typeSchema = Joi.object({ type: Joi.string().valid(...REPORT_TYPES).required() });
const querySchema = Joi.object({
  program: Joi.string().trim().max(150).allow(''),
  yearFrom: year(),
  yearTo: year(),
  regionCode: Joi.string().trim().pattern(/^R?\d{9,10}$/).allow(''),
  location: Joi.string().trim().max(100).allow(''),
  // Step 14: e.g. Program = Medicine + Batch 2015 + Employment status = Employed
  employment: Joi.string().valid('employed', 'none').allow(''),
  sex: Joi.string().valid(...SEXES).allow(''),
  industry: Joi.string().valid(...INDUSTRIES).allow(''),
  jobLevel: Joi.string().valid(...JOB_CATEGORIES).allow(''),
  groupBy: Joi.string().valid('program', 'year', 'region', 'province', 'city'),
  columns: Joi.string().trim().max(300).pattern(new RegExp(`^(${Object.keys(GRADUATE_COLUMNS).join('|')})(,(${Object.keys(GRADUATE_COLUMNS).join('|')}))*$`)),
  eventId: Joi.number().integer().min(1),
  status: Joi.string().valid('registered', 'attended', 'cancelled'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
}).custom((v, h) => (v.yearFrom && v.yearTo && v.yearFrom > v.yearTo ? h.message({ custom: 'The "from" year must be before the "to" year' }) : v));

// '' filters -> not set
const clean = (q) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));
const dateOnly = (q) => ({ ...q, ...(q.dateFrom && { dateFrom: new Date(q.dateFrom).toISOString().slice(0, 10) }), ...(q.dateTo && { dateTo: new Date(q.dateTo).toISOString().slice(0, 10) }) });

const audit = (req, report, how) =>
  logService.record(req, { action: 'export', entity: 'Alumni report', description: `${how} "${report.title}" (${report.subtitle})${report.rows ? `: ${report.rows.length} rows` : ''}`.slice(0, 500) });

const router = Router();
router.use(authenticate, adminPanelOnly);

router.get('/:type', validate(typeSchema, 'params'), validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const report = await alumniReportService.run(req.params.type, dateOnly(clean(req.query)), req.user);
  await audit(req, report, 'Generated');
  sendSuccess(res, { data: report });
}));

router.get('/:type/export', validate(typeSchema, 'params'), validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const report = await alumniReportService.run(req.params.type, dateOnly(clean(req.query)), req.user);
  await audit(req, report, 'Exported to Excel');
  const name = `${report.title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${report.generatedAt.slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.send(alumniReportService.toCsv(report));
}));

export default router;
