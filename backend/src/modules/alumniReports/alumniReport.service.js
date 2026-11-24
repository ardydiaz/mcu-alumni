import { Op, fn, col } from 'sequelize';
import { AlumniProfile, SectionModels } from '../profiles/profile.model.js';
import { profileService, oneLineAddress, UPDATED_WITHIN_DAYS } from '../profiles/profile.service.js';
import { TracerResponse } from '../tracer/tracer.model.js';
import { Event, EventRegistration } from '../events/event.model.js';
import { eventRegistrations } from '../events/event.registration.js';
import { psgc } from '../psgc/psgc.service.js';
import { JOB_CATEGORIES, TIME_AFTER_GRADUATION, FURTHER_STUDIES_TIMING } from '../content/content.data.js';
import { ApiError } from '../../utils/helpers.js';

// Step 13: Report Generation. Each report reads the live database with the chosen filters and returns
// { title, subtitle, columns, rows, total, notes } (or `sections` for summaries), so the admin page can show,
// print and export every report the same way.

const MAX_ROWS = 20000;
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null); // one decimal, null when there is nothing to divide by
const byLabel = (a, b) => String(a.label).localeCompare(String(b.label));

// ---- Filters ----------------------------------------------------------------

const yearWhere = ({ yearFrom, yearTo }) => (yearFrom || yearTo ? { [Op.between]: [yearFrom || 1904, yearTo || 2100] } : undefined);

// "BS Nursing · Batch 2020–2025 · National Capital Region"
function describe(q) {
  const parts = [];
  parts.push(q.program || 'All programs');
  if (q.yearFrom && q.yearTo && q.yearFrom === q.yearTo) parts.push(`Batch ${q.yearFrom}`);
  else if (q.yearFrom || q.yearTo) parts.push(`Batch ${q.yearFrom || 'earliest'}–${q.yearTo || 'latest'}`);
  else parts.push('All batches');
  if (q.regionCode) parts.push(psgc.regions().find((r) => r.code === q.regionCode)?.name || 'Selected region');
  if (q.location) parts.push(`Location: "${q.location}"`);
  if (q.sex) parts.push(q.sex);
  if (q.employment) parts.push(q.employment === 'employed' ? 'Employed' : 'No current job on record');
  if (q.industry) parts.push(`Industry: ${q.industry}`);
  if (q.jobLevel) parts.push(`Job level: ${q.jobLevel}`);
  return parts.join(' · ');
}

// Profiles for the graduate-based reports (same filters as the Alumni profiles list).
const profileWhere = (q) => {
  const where = profileService.where({ program: q.program, regionCode: q.regionCode, location: q.location, sex: q.sex, employment: q.employment, industry: q.industry, jobLevel: q.jobLevel });
  const year = yearWhere(q);
  return year ? { [Op.and]: [where, { yearGraduated: year }] } : where;
};

// Latest Graduate Tracer answer of each graduate: portal answers by account, public-form answers by email.
async function latestTracer(q) {
  const where = {};
  if (q.program) where.degree = q.program;
  const year = yearWhere(q);
  if (year) where.yearGraduated = year;
  const rows = await TracerResponse.findAll({ where, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
  const seen = new Set();
  return rows.filter((r) => {
    const key = r.alumniAccountId ? `a${r.alumniAccountId}` : `e${String(r.email).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
const categoriesOf = (r) => (Array.isArray(r.jobCategories) ? r.jobCategories : typeof r.jobCategories === 'string' && r.jobCategories ? JSON.parse(r.jobCategories) : []);

// ---- Reports ----------------------------------------------------------------

// Column choices for the graduate list.
export const GRADUATE_COLUMNS = {
  studentNumber: 'Student No.',
  alumniNumber: 'Alumni No.',
  name: 'Name',
  program: 'Program',
  yearGraduated: 'Year',
  sex: 'Sex',
  email: 'Email',
  phone: 'Contact No.',
  address: 'Address',
  employer: 'Current employer',
  position: 'Position',
  industry: 'Industry',
  portal: 'Portal account',
};
const DEFAULT_GRADUATE_COLUMNS = ['studentNumber', 'name', 'program', 'yearGraduated', 'email', 'phone'];

const REPORTS = {
  // Example 1: accreditation — list of graduates of a program / year.
  graduates: {
    title: 'List of Graduates',
    personal: true,
    async run(q) {
      const keys = (q.columns ? q.columns.split(',') : DEFAULT_GRADUATE_COLUMNS).filter((k) => GRADUATE_COLUMNS[k]);
      const profiles = await AlumniProfile.findAll({ where: profileWhere(q), order: [['program', 'ASC'], ['yearGraduated', 'ASC'], ['surname', 'ASC'], ['firstName', 'ASC']], limit: MAX_ROWS + 1 });
      if (profiles.length > MAX_ROWS) throw ApiError.unprocessable(`More than ${MAX_ROWS.toLocaleString()} graduates match; narrow the filters.`);
      const jobs = new Map();
      if (keys.includes('employer') || keys.includes('position') || keys.includes('industry')) {
        const ids = profiles.map((p) => p.id);
        for (let i = 0; i < ids.length; i += 1000) {
          const work = await SectionModels.work.findAll({ where: { profileId: ids.slice(i, i + 1000), isCurrent: true }, order: [['updatedAt', 'DESC']] });
          for (const w of work) if (!jobs.has(w.profileId)) jobs.set(w.profileId, w);
        }
      }
      const value = (p, k) => {
        if (k === 'name') return `${p.surname}${p.suffix ? ` ${p.suffix}` : ''}, ${p.firstName}${p.middleName ? ` ${p.middleName}` : ''}`;
        if (k === 'address') return oneLineAddress(p);
        if (k === 'employer') return jobs.get(p.id)?.company || '';
        if (k === 'position') return jobs.get(p.id)?.position || '';
        if (k === 'industry') return jobs.get(p.id)?.industry || '';
        if (k === 'portal') return p.alumniAccountId ? 'Yes' : 'No';
        return p[k] ?? '';
      };
      const perProgram = {};
      for (const p of profiles) perProgram[p.program] = (perProgram[p.program] || 0) + 1;
      return {
        columns: [{ key: 'no', label: 'No.', type: 'number' }, ...keys.map((k) => ({ key: k, label: GRADUATE_COLUMNS[k], type: k === 'yearGraduated' ? 'number' : 'text' }))],
        rows: profiles.map((p, i) => ({ no: i + 1, ...Object.fromEntries(keys.map((k) => [k, value(p, k)])) })),
        total: null,
        summary: `${profiles.length.toLocaleString()} graduate${profiles.length === 1 ? '' : 's'}`,
        notes: Object.keys(perProgram).length > 1 ? Object.entries(perProgram).map(([prog, n]) => `${prog}: ${n.toLocaleString()}`) : [],
      };
    },
  },

  // Example 2: tracer study — employment status of graduates by program.
  employment: {
    title: 'Employment Status of Graduates by Program',
    async run(q) {
      const [answers, grads] = await Promise.all([
        latestTracer(q),
        AlumniProfile.findAll({ where: profileWhere({ ...q, regionCode: undefined, location: undefined }), attributes: ['program', [fn('COUNT', col('id')), 'count']], group: ['program'], raw: true }),
      ]);
      const rows = new Map();
      const row = (program) => {
        if (!rows.has(program)) rows.set(program, { program, graduates: 0, responses: 0, employed: 0, notEmployed: 0, related: 0, relatedAnswered: 0, within6: 0, timeAnswered: 0 });
        return rows.get(program);
      };
      for (const g of grads) row(g.program).graduates = Number(g.count);
      for (const a of answers) {
        const r = row(a.degree);
        r.responses += 1;
        if (a.isEmployed) {
          r.employed += 1;
          if (a.relatedToDegree !== null) { r.relatedAnswered += 1; if (a.relatedToDegree) r.related += 1; }
          if (a.timeToFirstJob) { r.timeAnswered += 1; if (a.timeToFirstJob === 'Within 6 months') r.within6 += 1; }
        } else r.notEmployed += 1;
      }
      const finish = (r) => ({
        program: r.program,
        graduates: r.graduates,
        responses: r.responses,
        responseRate: pct(r.responses, r.graduates),
        employed: r.employed,
        notEmployed: r.notEmployed,
        employmentRate: pct(r.employed, r.responses),
        relatedRate: pct(r.related, r.relatedAnswered),
        within6Rate: pct(r.within6, r.timeAnswered),
      });
      const list = [...rows.values()].sort((a, b) => a.program.localeCompare(b.program));
      const sum = (k) => list.reduce((s, r) => s + r[k], 0);
      const total = finish({ program: 'Total', ...Object.fromEntries(['graduates', 'responses', 'employed', 'notEmployed', 'related', 'relatedAnswered', 'within6', 'timeAnswered'].map((k) => [k, sum(k)])) });
      return {
        columns: [
          { key: 'program', label: 'Program', type: 'text' },
          { key: 'graduates', label: 'Graduates', type: 'number' },
          { key: 'responses', label: 'Tracer responses', type: 'number' },
          { key: 'responseRate', label: 'Response rate', type: 'percent' },
          { key: 'employed', label: 'Employed', type: 'number' },
          { key: 'notEmployed', label: 'Not employed', type: 'number' },
          { key: 'employmentRate', label: 'Employment rate', type: 'percent' },
          { key: 'relatedRate', label: 'Job related to degree', type: 'percent' },
          { key: 'within6Rate', label: 'Employed within 6 months', type: 'percent' },
        ],
        rows: list.map(finish),
        total,
        summary: `Based on ${total.responses.toLocaleString()} tracer response${total.responses === 1 ? '' : 's'} from ${total.graduates.toLocaleString()} graduates on record`,
        chart: { label: 'Employment rate', key: 'employmentRate', by: 'program' },
        notes: [
          'Each graduate is counted once, using their latest Graduate Tracer answer.',
          'Employment rate = employed ÷ tracer responses. Job related to degree and employed within 6 months are shares of employed respondents who answered those questions.',
          'Graduates = records in the alumni database for the program and batch.',
        ],
      };
    },
  },

  // Tracer study results in counts and percentages.
  tracer: {
    title: 'Graduate Tracer Study Results',
    async run(q) {
      const answers = await latestTracer(q);
      const n = answers.length;
      const employed = answers.filter((a) => a.isEmployed);
      const tally = (items, options, pick, base) => options.map((label) => {
        const count = items.filter((a) => pick(a, label)).length;
        return { label, count, percent: pct(count, base) };
      });
      const sections = [
        { title: 'Employment status', base: n, rows: tally(answers, ['Employed', 'Not employed'], (a, l) => (l === 'Employed' ? a.isEmployed : !a.isEmployed), n) },
        { title: 'Time to first job (employed)', base: employed.length, rows: tally(employed, TIME_AFTER_GRADUATION, (a, l) => a.timeToFirstJob === l, employed.length) },
        { title: 'Job level (employed; more than one may apply)', base: employed.length, rows: tally(employed, JOB_CATEGORIES, (a, l) => categoriesOf(a).includes(l), employed.length) },
        { title: 'Job related to degree (employed)', base: employed.length, rows: tally(employed, ['Yes', 'No'], (a, l) => (l === 'Yes' ? a.relatedToDegree === true : a.relatedToDegree === false), employed.length) },
        { title: 'Pursued further studies', base: n, rows: tally(answers, ['Yes', 'No'], (a, l) => (l === 'Yes' ? a.furtherStudies : !a.furtherStudies), n) },
        { title: 'When further studies started', base: answers.filter((a) => a.furtherStudies).length, rows: tally(answers.filter((a) => a.furtherStudies), FURTHER_STUDIES_TIMING.filter((t) => t !== 'N/A'), (a, l) => a.furtherStudiesTiming === l, answers.filter((a) => a.furtherStudies).length) },
      ];
      return { sections, summary: `${n.toLocaleString()} graduate${n === 1 ? '' : 's'} answered the Graduate Tracer`, notes: ['Each graduate is counted once, using their latest answer. Percentages are of the group named in each title.'] };
    },
  },

  // Portal activation and profile updates per program (or batch).
  engagement: {
    title: 'Alumni Engagement',
    async run(q) {
      const groupBy = q.groupBy === 'year' ? 'yearGraduated' : 'program';
      const profiles = await AlumniProfile.findAll({ where: profileWhere(q), attributes: ['program', 'yearGraduated', 'alumniAccountId', 'email', 'alumniUpdatedAt', 'invitedAt'], raw: true });
      const yearAgo = Date.now() - UPDATED_WITHIN_DAYS * 86400000;
      const groups = new Map();
      for (const p of profiles) {
        const k = p[groupBy];
        if (!groups.has(k)) groups.set(k, { label: k, records: 0, activated: 0, invited: 0, updated: 0, notUpdated: 0, noEmail: 0 });
        const g = groups.get(k);
        g.records += 1;
        if (p.alumniAccountId) g.activated += 1;
        else if (p.invitedAt) g.invited += 1;
        if (p.alumniUpdatedAt && new Date(p.alumniUpdatedAt).getTime() >= yearAgo) g.updated += 1;
        else g.notUpdated += 1;
        if (!p.email) g.noEmail += 1;
      }
      const finish = (g) => ({ ...g, activatedRate: pct(g.activated, g.records), updatedRate: pct(g.updated, g.records) });
      const list = [...groups.values()].sort(groupBy === 'yearGraduated' ? (a, b) => b.label - a.label : byLabel);
      const sum = (k) => list.reduce((s, r) => s + r[k], 0);
      return {
        columns: [
          { key: 'label', label: groupBy === 'yearGraduated' ? 'Batch' : 'Program', type: groupBy === 'yearGraduated' ? 'number' : 'text' },
          { key: 'records', label: 'Records', type: 'number' },
          { key: 'activated', label: 'Using the portal', type: 'number' },
          { key: 'activatedRate', label: 'Portal rate', type: 'percent' },
          { key: 'invited', label: 'Invited, not yet active', type: 'number' },
          { key: 'updated', label: 'Updated (12 months)', type: 'number' },
          { key: 'updatedRate', label: 'Updated rate', type: 'percent' },
          { key: 'notUpdated', label: 'Not updated', type: 'number' },
          { key: 'noEmail', label: 'No email on record', type: 'number' },
        ],
        rows: list.map(finish),
        total: finish({ label: 'Total', ...Object.fromEntries(['records', 'activated', 'invited', 'updated', 'notUpdated', 'noEmail'].map((k) => [k, sum(k)])) }),
        summary: `${profiles.length.toLocaleString()} alumni records`,
        chart: { label: 'Portal rate', key: 'activatedRate', by: 'label' },
        notes: [`"Updated" = the alumnus updated My Profile or answered the Graduate Tracer in the last ${UPDATED_WITHIN_DAYS} days.`],
      };
    },
  },

  // Registered vs attended per event, or the attendee list of one event.
  attendance: {
    title: 'Event Registration and Attendance',
    personalWhen: (q) => Boolean(q.eventId),
    async run(q) {
      if (q.eventId) {
        const event = await Event.findByPk(q.eventId);
        if (!event) throw ApiError.notFound('Event not found');
        const { rows } = await eventRegistrations.list(event.id, { status: q.status });
        const counts = { registered: 0, attended: 0, cancelled: 0 };
        for (const r of rows) counts[r.status] += 1;
        return {
          title: `Attendance: ${event.title}`,
          subtitle: new Date(event.startAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric' }) + (event.venue ? ` · ${event.venue}` : ''),
          columns: [
            { key: 'no', label: 'No.', type: 'number' },
            { key: 'fullName', label: 'Name', type: 'text' },
            { key: 'alumniNumber', label: 'Alumni No.', type: 'text' },
            { key: 'program', label: 'Program', type: 'text' },
            { key: 'yearGraduated', label: 'Batch', type: 'number' },
            { key: 'email', label: 'Email', type: 'text' },
            { key: 'status', label: 'Status', type: 'text' },
          ],
          rows: rows.map((r, i) => ({ no: i + 1, ...r, status: r.status[0].toUpperCase() + r.status.slice(1) })),
          total: null,
          summary: `${counts.registered + counts.attended} registered · ${counts.attended} attended · ${counts.cancelled} cancelled`,
          notes: [],
        };
      }
      const where = { portalRegistration: true };
      if (q.dateFrom || q.dateTo) where.startAt = { [Op.between]: [q.dateFrom || '1900-01-01', q.dateTo ? `${q.dateTo}T23:59:59` : '2999-12-31'] };
      const events = await Event.findAll({ where, order: [['startAt', 'DESC']] });
      const counts = await EventRegistration.findAll({ where: { eventId: events.map((e) => e.id) }, attributes: ['eventId', 'status', [fn('COUNT', col('id')), 'count']], group: ['eventId', 'status'], raw: true });
      const c = (id, s) => Number(counts.find((x) => x.eventId === id && x.status === s)?.count || 0);
      const rows = events.map((e) => {
        const attended = c(e.id, 'attended');
        const registered = c(e.id, 'registered') + attended;
        return {
          event: e.title,
          date: new Date(e.startAt).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric' }),
          capacity: e.capacity || null,
          registered,
          attended,
          cancelled: c(e.id, 'cancelled'),
          attendanceRate: pct(attended, registered),
          fillRate: e.capacity ? pct(registered, e.capacity) : null,
        };
      });
      const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);
      return {
        columns: [
          { key: 'event', label: 'Event', type: 'text' },
          { key: 'date', label: 'Date', type: 'text' },
          { key: 'capacity', label: 'Slots', type: 'number' },
          { key: 'registered', label: 'Registered', type: 'number' },
          { key: 'fillRate', label: 'Slots filled', type: 'percent' },
          { key: 'attended', label: 'Attended', type: 'number' },
          { key: 'attendanceRate', label: 'Attendance rate', type: 'percent' },
          { key: 'cancelled', label: 'Cancelled', type: 'number' },
        ],
        rows,
        total: { event: 'Total', date: '', capacity: null, registered: sum('registered'), attended: sum('attended'), cancelled: sum('cancelled'), attendanceRate: pct(sum('attended'), sum('registered')), fillRate: null },
        summary: `${rows.length} event${rows.length === 1 ? '' : 's'} with registration through the Alumni Portal`,
        notes: ['Attendance rate = attended ÷ registered (cancelled registrations not included).'],
      };
    },
  },

  // Where graduates live, by region (or province / city).
  location: {
    title: 'Graduates by Location',
    async run(q) {
      const level = ['province', 'city'].includes(q.groupBy) ? q.groupBy : 'region';
      const profiles = await AlumniProfile.findAll({ where: profileWhere(q), attributes: ['region', 'province', 'city', 'country', 'houseStreet'], raw: true });
      const groups = new Map();
      for (const p of profiles) {
        const label = p.country && p.country !== 'Philippines' ? `Abroad: ${p.country}` : p[level] || (p.houseStreet ? 'Address not yet chosen from the list' : 'No address on record');
        groups.set(label, (groups.get(label) || 0) + 1);
      }
      const rows = [...groups.entries()].map(([label, count]) => ({ label, count, percent: pct(count, profiles.length) })).sort((a, b) => b.count - a.count || byLabel(a, b));
      return {
        columns: [
          { key: 'label', label: level === 'region' ? 'Region' : level === 'province' ? 'Province' : 'City / municipality', type: 'text' },
          { key: 'count', label: 'Graduates', type: 'number' },
          { key: 'percent', label: 'Share', type: 'percent' },
        ],
        rows,
        total: { label: 'Total', count: profiles.length, percent: profiles.length ? 100 : null },
        summary: `${profiles.length.toLocaleString()} graduates`,
        chart: { label: 'Graduates', key: 'count', by: 'label' },
        notes: ['Imported records keep the address as typed until the alumnus picks their region and city in My Profile; they are counted under "Address not yet chosen from the list".'],
      };
    },
  },
};

export const REPORT_TYPES = Object.keys(REPORTS);

export const alumniReportService = {
  async run(type, query, user) {
    const def = REPORTS[type];
    if (!def) throw ApiError.notFound('Unknown report');
    const out = await def.run(query);
    return {
      type,
      title: out.title || def.title,
      subtitle: out.subtitle || (type === 'attendance' ? (query.dateFrom || query.dateTo ? `Events from ${query.dateFrom || 'the start'} to ${query.dateTo || 'today'}` : 'All events') : describe(query)),
      generatedAt: new Date().toISOString(),
      generatedBy: user?.fullname || user?.email || 'Staff',
      personal: Boolean(def.personal || def.personalWhen?.(query)), // lists names and contact details
      ...out,
    };
  },

  // The same report as CSV for Excel: title lines, the table, totals and notes.
  toCsv(report) {
    const cell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const fmt = (v, type) => (v === null || v === undefined ? '' : type === 'percent' ? `${v}%` : v);
    const lines = [['Manila Central University · Alumni Relations Office'], [report.title], [report.subtitle], [`Generated ${new Date(report.generatedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} by ${report.generatedBy}`], [report.summary || ''], []];
    if (report.sections) {
      for (const s of report.sections) {
        lines.push([s.title], ['Answer', 'Count', 'Percent'], ...s.rows.map((r) => [r.label, r.count, fmt(r.percent, 'percent')]), [`Base: ${s.base}`], []);
      }
    } else {
      lines.push(report.columns.map((c) => c.label));
      for (const r of report.rows) lines.push(report.columns.map((c) => fmt(r[c.key], c.type)));
      if (report.total) lines.push(report.columns.map((c) => fmt(report.total[c.key], c.type)));
      lines.push([]);
    }
    for (const n of report.notes || []) lines.push([n]);
    return `﻿${lines.map((l) => l.map(cell).join(',')).join('\r\n')}\r\n`;
  },
};
