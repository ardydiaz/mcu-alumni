import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { ImportBatch } from './import.model.js';
import { decodeFile, parseCsv, mapHeader, cleanRow } from './import.clean.js';
import { AlumniProfile, SectionModels, ProfileChange } from '../profiles/profile.model.js';
import { SECTION_KEYS } from '../profiles/profile.sections.js';
import { alumniNumberFor, profileService } from '../profiles/profile.service.js';
import { ApiError } from '../../utils/helpers.js';

// Step 5: Alumni Database Migration.
//   preview: read + clean the file and compare it with the database; nothing is saved.
//   commit:  the same analysis, then new graduates become verified profiles (with Alumni Numbers) in one transaction.
//   undo:    removes the profiles a file created (unless already claimed or edited) and reverts filled-in fields.
// When a graduate later registers on the Alumni Portal with the same Student No., verification links the
// account to the imported profile (profileService.createForAccount), so their information is already there.

export const MAX_ROWS = 20000;
const PH = 'Philippines';
const MCU = 'Manila Central University';

// Profile fields an import may set. In "fill" mode only empty fields of an existing record are filled in:
// an import never overwrites what EAO or the alumnus already entered.
const FIELDS = ['surname', 'firstName', 'middleName', 'suffix', 'maidenName', 'sex', 'civilStatus', 'nationality', 'birthDate', 'program', 'yearGraduated', 'email', 'phone', 'houseStreet'];
const empty = (v) => v === null || v === undefined || v === '';
const fold = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z]/g, '');
const fullName = (d) => [d.firstName, d.middleName, d.surname, d.suffix].filter(Boolean).join(' ');
const nameKey = (d) => `${fold(d.surname)}|${fold(d.firstName)}`;

function readFile(buffer, fileName = '') {
  if (/\.xlsx?$/i.test(fileName)) {
    throw ApiError.unprocessable('Save the Excel file as CSV first (File > Save As > "CSV UTF-8"), then upload the .csv file.', { file: 'Upload a .csv file' });
  }
  const table = parseCsv(decodeFile(buffer));
  const [header = [], ...body] = table;
  const { index, missing, unknown } = mapHeader(header);
  if (missing.length) {
    throw ApiError.unprocessable(`The file is missing these columns: ${missing.join(', ')}. Use the column names of the template.`, { file: `Missing columns: ${missing.join(', ')}` });
  }
  const rows = body.map((cells, i) => ({ cells, line: i + 2 })).filter((r) => r.cells.some((v) => v.trim()));
  if (!rows.length) throw ApiError.unprocessable('The file has no data rows.', { file: 'No data rows' });
  if (rows.length > MAX_ROWS) throw ApiError.unprocessable(`At most ${MAX_ROWS.toLocaleString()} rows per file; split the file and import each part.`, { file: 'Too many rows' });
  return { rows: rows.map((r) => cleanRow(r.cells, index, r.line)), unknownColumns: unknown };
}

// Compare the cleaned rows with each other and with the database; decide each row's status:
//   new | update (fill mode, empty fields to fill) | unchanged (already in the database) | skip (has errors)
async function analyze(rows, mode) {
  const numbers = [...new Set(rows.map((r) => r.data.studentNumber).filter(Boolean))];
  const existing = new Map();
  for (let i = 0; i < numbers.length; i += 1000) {
    const found = await AlumniProfile.findAll({ where: { studentNumber: numbers.slice(i, i + 1000) } });
    for (const p of found) existing.set(p.studentNumber, p);
  }
  // Same name under another student number: likely the same person, or a typo in the number.
  const surnames = [...new Set(rows.map((r) => r.data.surname).filter(Boolean))];
  const byName = new Map();
  for (let i = 0; i < surnames.length; i += 1000) {
    const found = await AlumniProfile.findAll({
      where: { surname: surnames.slice(i, i + 1000) },
      attributes: ['id', 'alumniNumber', 'studentNumber', 'surname', 'firstName', 'birthDate', 'program', 'yearGraduated'],
    });
    for (const p of found) byName.set(nameKey(p), [...(byName.get(nameKey(p)) || []), p]);
  }
  const currentWork = new Map();
  if (existing.size) {
    const ids = [...existing.values()].map((p) => p.id);
    const work = await SectionModels.work.findAll({ where: { profileId: ids }, attributes: ['profileId', 'company'] });
    for (const w of work) currentWork.set(w.profileId, [...(currentWork.get(w.profileId) || []), fold(w.company)]);
  }

  const seen = new Map(); // student number -> line
  const emails = new Map(); // email -> rows
  const phones = new Map();
  for (const r of rows) {
    if (r.errors.length) continue;
    if (r.data.email) emails.set(r.data.email, [...(emails.get(r.data.email) || []), r]);
    if (r.data.phone) phones.set(r.data.phone, [...(phones.get(r.data.phone) || []), r]);
  }
  const shared = (map, label) => {
    for (const group of map.values()) {
      if (group.length < 2) continue;
      for (const r of group) {
        const others = group.filter((o) => o !== r).map((o) => `row ${o.line} (${o.data.firstName} ${o.data.surname})`);
        r.warnings.push(`Same ${label} as ${others.join(', ')}; check that it really belongs to this graduate`);
      }
    }
  };
  shared(emails, 'email');
  shared(phones, 'contact number');

  for (const r of rows) {
    const d = r.data;
    if (!r.errors.length && seen.has(d.studentNumber)) r.errors.push(`Same Student No. as row ${seen.get(d.studentNumber)}; only the first one is imported`);
    if (!r.errors.length) seen.set(d.studentNumber, r.line);
    if (r.errors.length) {
      r.status = 'skip';
      continue;
    }

    const match = existing.get(d.studentNumber);
    if (match) {
      r.match = { id: match.id, alumniNumber: match.alumniNumber, name: fullName(match), linked: Boolean(match.alumniAccountId) };
      if (fold(match.surname) !== fold(d.surname) || fold(match.firstName) !== fold(d.firstName)) {
        r.warnings.push(`This Student No. belongs to ${fullName(match)} in the database; the name in the file (${fullName(d)}) was not used`);
      }
      if (mode === 'skip') {
        r.status = 'unchanged';
        continue;
      }
      r.fills = Object.fromEntries(FIELDS.filter((f) => empty(match[f]) && !empty(d[f])).map((f) => [f, d[f]]));
      r.addWork = Boolean(r.work && !(currentWork.get(match.id) || []).includes(fold(r.work.company)));
      r.status = Object.keys(r.fills).length || r.addWork ? 'update' : 'unchanged';
      continue;
    }

    const twin = (byName.get(nameKey(d)) || []).find((p) => (p.birthDate && d.birthDate ? String(p.birthDate).slice(0, 10) === d.birthDate : p.program === d.program));
    if (twin) {
      r.errors.push(`Looks like ${fullName(twin)} (Alumni No. ${twin.alumniNumber || '—'}, Student No. ${twin.studentNumber}) who is already in the database; check the Student No.`);
      r.match = { id: twin.id, alumniNumber: twin.alumniNumber, name: fullName(twin) };
      r.status = 'skip';
      continue;
    }
    r.status = 'new';
  }
  return rows;
}

const FIELD_LABELS = {
  surname: 'Surname', firstName: 'First name', middleName: 'Middle name', suffix: 'Suffix', maidenName: 'Maiden name', sex: 'Sex',
  civilStatus: 'Civil status', nationality: 'Nationality', birthDate: 'Date of birth', program: 'Program', yearGraduated: 'Year graduated',
  email: 'Email', phone: 'Mobile number', houseStreet: 'Address',
};

// What the admin sees for each row (and what is kept in the batch report).
const rowView = (r) => ({
  line: r.line,
  status: r.status,
  studentNumber: r.data.studentNumber || null,
  name: fullName(r.data) || null,
  program: r.data.program,
  yearGraduated: r.data.yearGraduated,
  email: r.data.email,
  phone: r.data.phone,
  errors: r.errors,
  warnings: r.warnings,
  match: r.match || null,
  fills: [...Object.keys(r.fills || {}).map((f) => FIELD_LABELS[f]), ...(r.addWork ? ['Work'] : [])],
});

function summarize(rows) {
  const count = (s) => rows.filter((r) => r.status === s).length;
  return {
    total: rows.length,
    new: count('new'),
    update: count('update'),
    unchanged: count('unchanged'),
    skipped: count('skip'),
    withWarnings: rows.filter((r) => r.status !== 'skip' && r.warnings.length).length,
  };
}

const MODES = ['fill', 'skip'];

export const importService = {
  async preview(file, mode = 'fill') {
    if (!MODES.includes(mode)) mode = 'fill';
    const { rows, unknownColumns } = readFile(file.buffer, file.originalname);
    await analyze(rows, mode);
    return { fileName: file.originalname, mode, summary: summarize(rows), unknownColumns, rows: rows.map(rowView) };
  },

  async commit(file, mode, actor) {
    if (!MODES.includes(mode)) mode = 'fill';
    const { rows } = readFile(file.buffer, file.originalname);
    await analyze(rows, mode);
    const summary = summarize(rows);
    if (!summary.new && !summary.update) throw ApiError.unprocessable('Nothing to import: every row is already in the database or has errors.');

    const now = new Date();
    const changeBase = { actorType: 'staff', actorId: actor.id, actorName: actor.name, section: 'profile', action: 'import' };
    const title = `from ${file.originalname}`;

    const batch = await sequelize.transaction(async (transaction) => {
      const batch = await ImportBatch.create({ fileName: file.originalname, mode, totalRows: rows.length, importedById: actor.id, importedByName: actor.name }, { transaction });

      // New graduates: verified profiles straight from the official records.
      const fresh = rows.filter((r) => r.status === 'new');
      for (let i = 0; i < fresh.length; i += 500) {
        const chunk = fresh.slice(i, i + 500);
        await AlumniProfile.bulkCreate(
          chunk.map((r) => ({
            ...r.data,
            country: !r.data.nationality || r.data.nationality === 'Filipino' ? PH : null,
            source: 'import',
            importBatchId: batch.id,
            verifiedAt: now,
          })),
          { transaction }
        );
      }
      const created = await AlumniProfile.findAll({ where: { importBatchId: batch.id }, attributes: ['id', 'studentNumber'], transaction });
      const idOf = new Map(created.map((p) => [p.studentNumber, p.id]));
      for (const p of created) await AlumniProfile.update({ alumniNumber: alumniNumberFor(p.id, now) }, { where: { id: p.id }, transaction });
      await SectionModels.education.bulkCreate(
        fresh.map((r) => ({ profileId: idOf.get(r.data.studentNumber), school: MCU, level: 'College', degree: r.data.program, yearFinished: r.data.yearGraduated })),
        { transaction }
      );
      await SectionModels.work.bulkCreate(
        fresh.filter((r) => r.work).map((r) => ({ ...r.work, profileId: idOf.get(r.data.studentNumber), source: 'import' })),
        { transaction }
      );
      await ProfileChange.bulkCreate(
        fresh.map((r) => {
          const id = idOf.get(r.data.studentNumber);
          return { ...changeBase, profileId: id, changes: { title, alumniNumber: [null, alumniNumberFor(id, now)] } };
        }),
        { transaction }
      );

      // Existing records ("fill" mode): fill in their empty fields and add the current job if it's new.
      const fills = [];
      for (const r of rows.filter((x) => x.status === 'update')) {
        const fields = r.fills;
        if (Object.keys(fields).length) await AlumniProfile.update(fields, { where: { id: r.match.id }, transaction });
        let workId = null;
        if (r.addWork) workId = (await SectionModels.work.create({ ...r.work, profileId: r.match.id, source: 'import' }, { transaction })).id;
        const changes = Object.fromEntries(Object.entries(fields).map(([f, v]) => [f, [null, v]]));
        await ProfileChange.create({ ...changeBase, profileId: r.match.id, changes: { title: r.addWork ? `${title} (added ${r.work.position} at ${r.work.company})` : title, ...changes } }, { transaction });
        fills.push({ profileId: r.match.id, fields, workId });
      }

      const report = rows.filter((r) => r.status === 'skip' || r.warnings.length || r.status === 'update').map(rowView);
      return batch.update(
        { createdCount: fresh.length, updatedCount: fills.length, skippedCount: summary.skipped, warningCount: summary.withWarnings, report: { rows: report, fills } },
        { transaction }
      );
    });
    return batch;
  },

  async list() {
    return ImportBatch.findAll({ attributes: { exclude: ['report'] }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 100 });
  },

  async get(id) {
    const batch = await ImportBatch.findByPk(id);
    if (!batch) throw ApiError.notFound('Import not found');
    return batch;
  },

  // Removes the profiles this file created, except those already claimed through the Alumni Portal or edited
  // since (those are kept so no one's work is lost), and empties the fields it filled in if they weren't changed.
  async undo(id, actor) {
    const batch = await this.get(id);
    if (batch.undoneAt) throw ApiError.conflict('This import was already undone.');
    const report = typeof batch.report === 'string' ? JSON.parse(batch.report) : batch.report || {};

    return sequelize.transaction(async (transaction) => {
      const profiles = await AlumniProfile.findAll({ where: { importBatchId: id }, attributes: ['id', 'alumniAccountId'], transaction });
      const edited = new Set(
        (await ProfileChange.findAll({ where: { profileId: profiles.map((p) => p.id), action: { [Op.ne]: 'import' } }, attributes: ['profileId'], transaction })).map((c) => c.profileId)
      );
      const keep = profiles.filter((p) => p.alumniAccountId || edited.has(p.id));
      const removeIds = profiles.filter((p) => !keep.includes(p)).map((p) => p.id);
      if (removeIds.length) {
        for (const k of SECTION_KEYS) await SectionModels[k].destroy({ where: { profileId: removeIds }, transaction });
        await ProfileChange.destroy({ where: { profileId: removeIds }, transaction });
        await AlumniProfile.destroy({ where: { id: removeIds }, transaction });
      }

      let reverted = 0;
      for (const { profileId, fields, workId } of report.fills || []) {
        const profile = await AlumniProfile.findByPk(profileId, { transaction });
        if (!profile) continue;
        const back = Object.fromEntries(Object.entries(fields).filter(([f, v]) => String(profile[f] ?? '').slice(0, 10) === String(v ?? '').slice(0, 10) || profile[f] === v).map(([f]) => [f, null]));
        if (Object.keys(back).length) await profile.update(back, { transaction });
        const removedWork = workId ? await SectionModels.work.destroy({ where: { id: workId, profileId }, transaction }) : 0;
        if (Object.keys(back).length || removedWork) {
          reverted += 1;
          await ProfileChange.create(
            { actorType: 'staff', actorId: actor.id, actorName: actor.name, section: 'profile', action: 'update', profileId, changes: { title: `Import of ${batch.fileName} undone`, ...Object.fromEntries(Object.keys(back).map((f) => [f, [fields[f], null]])) } },
            { transaction }
          );
        }
      }
      await batch.update({ undoneAt: new Date() }, { transaction });
      return { removed: removeIds.length, kept: keep.length, reverted };
    });
  },

  // All profiles as CSV in the template's layout (plus system columns), for Excel or another system.
  // Same filters as the Alumni profiles list, so EAO exports exactly what they searched for.
  async exportCsv(query = {}) {
    const profiles = await AlumniProfile.findAll({ where: profileService.where(query), order: [['yearGraduated', 'DESC'], ['surname', 'ASC'], ['firstName', 'ASC']] });
    const jobs = new Map();
    const ids = profiles.map((p) => p.id);
    for (let i = 0; i < ids.length; i += 1000) {
      const work = await SectionModels.work.findAll({ where: { profileId: ids.slice(i, i + 1000), isCurrent: true }, order: [['id', 'DESC']] });
      for (const w of work) if (!jobs.has(w.profileId)) jobs.set(w.profileId, w);
    }
    const mdy = (d) => (d ? `${String(d).slice(5, 7)}/${String(d).slice(8, 10)}/${String(d).slice(0, 4)}` : '');
    const header = ['Alumni No.', 'Student No.', 'Year', 'Course', 'Surname', 'Given Name', 'Middle Name', 'Suffix', 'Maiden Name', 'Contact No.', 'Email Address', 'Home Address', 'Barangay', 'City', 'Province', 'Region', 'Country', 'Birthdate', 'Gender', 'Civil Status', 'Nationality', 'Company Name', 'Position', 'Industry', 'Portal Account', 'Source', 'Last Updated by Alumnus'];
    const lines = profiles.map((p) => {
      const job = jobs.get(p.id);
      return [
        p.alumniNumber, p.studentNumber, p.yearGraduated, p.program, p.surname, p.firstName, p.middleName, p.suffix, p.maidenName, p.phone, p.email,
        p.houseStreet, p.barangay, p.city, p.province, p.region, p.country, mdy(p.birthDate), p.sex, p.civilStatus, p.nationality,
        job?.company, job?.position, job?.industry, p.alumniAccountId ? 'Yes' : 'No', p.source, p.alumniUpdatedAt ? mdy(new Date(p.alumniUpdatedAt).toISOString()) : '',
      ];
    });
    const cell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return `﻿${[header, ...lines].map((l) => l.map(cell).join(',')).join('\r\n')}\r\n`;
  },
};
