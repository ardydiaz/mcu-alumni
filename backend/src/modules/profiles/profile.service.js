import { Op } from 'sequelize';
import { AlumniProfile, SectionModels, ProfileChange } from './profile.model.js';
import { SECTIONS, SECTION_KEYS } from './profile.sections.js';
import { psgc } from '../psgc/psgc.service.js';
import { ApiError, deleteUploadedFile } from '../../utils/helpers.js';
import { canonicalStudentNumber } from '../../utils/studentNumber.js';
import { inviteWhere } from '../portal/portal.invite.js';
import { AlumniAccount } from '../portal/alumniAccount.model.js';
import { getPagination, buildMeta, getSort } from '../../utils/pagination.js';

const PH = 'Philippines';
const MCU = 'Manila Central University';

// Actors recorded in the change history.
export const alumniActor = (account) => ({ type: 'alumni', id: account.id, name: account.fullName });
export const staffActor = (user) => ({ type: 'staff', id: user.id, name: user.fullname || user.email });
const systemActor = (name) => ({ type: 'system', id: null, name });

// MCU-A-{year verified}-{profile id, 6 digits}: unique, never reused.
export const alumniNumberFor = (id, verifiedAt) => `MCU-A-${new Date(verifiedAt || Date.now()).getFullYear()}-${String(id).padStart(6, '0')}`;

const ADDRESS_FIELDS = ['houseStreet', 'barangay', 'city', 'province', 'region', 'zipCode', 'country'];
// "123 Rizal St., Barangay 1, City of Caloocan, Metro Manila" (+ country when abroad)
export const oneLineAddress = (p) =>
  [p.houseStreet, p.barangay, p.city, p.province, p.country && p.country !== PH ? p.country : null, p.zipCode].filter(Boolean).join(', ');

const blankToNull = (data) => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === '' ? null : v]));
const plain = (v) => (v instanceof Date ? v.toISOString() : v ?? null);
const sameValue = (a, b) => String(plain(a) ?? '') === String(plain(b) ?? '');

// "Diaz, Ardy P." -> { surname, firstName, middleName }
export function splitName(fullName = '') {
  const [surname = '', given = ''] = fullName.split(',').map((s) => s.trim());
  const words = given.split(/\s+/).filter(Boolean);
  const middle = words.length > 1 && /^[A-Za-z]\.?$/.test(words[words.length - 1]) ? words.pop() : '';
  return { surname, firstName: words.join(' ') || surname, middleName: middle || null };
}

async function log(profileId, actor, section, action, changes, options = {}) {
  await ProfileChange.create({ profileId, actorType: actor.type, actorId: actor.id, actorName: actor.name, section, action, changes }, options);
}

function diff(before, after, fields) {
  const changes = {};
  for (const f of fields) if (!sameValue(before[f], after[f])) changes[f] = [plain(before[f]), plain(after[f])];
  return changes;
}

// Philippine addresses come from the PSGC dropdowns: names are filled from the codes (never trusted from the form).
// Outside the Philippines the address is typed in and the codes are cleared.
function normalizeAddress(data, current = {}) {
  const country = (data.country ?? current.country) || PH;
  const out = { ...data };
  const codeKeys = ['regionCode', 'provinceCode', 'cityCode', 'barangayCode'];
  if (country !== PH) {
    if ('country' in data) for (const k of codeKeys) out[k] = null;
    return out;
  }
  for (const k of ['region', 'province', 'city', 'barangay']) delete out[k]; // derived from codes below
  if (!codeKeys.some((k) => k in data)) return out;
  const codes = Object.fromEntries(codeKeys.map((k) => [k, k in data ? data[k] : current[k]]));
  if (!codes.regionCode && !codes.provinceCode && !codes.cityCode) {
    return { ...out, region: null, province: null, city: null, barangay: null, barangayCode: null };
  }
  const names = psgc.resolve(codes);
  if (!names) throw ApiError.unprocessable('Please choose the region, province, city and barangay from the lists.', { cityCode: 'Choose the city or municipality from the list' });
  return { ...out, ...codes, ...names };
}

// What makes a profile "complete"; shown to alumni as a progress bar with the missing items.
const CHECKS = [
  ['Sex', (p) => p.sex],
  ['Date of birth', (p) => p.birthDate],
  ['Place of birth', (p) => p.birthPlace],
  ['Nationality', (p) => p.nationality],
  ['Mobile number', (p) => p.phone],
  ['Complete address', (p) => p.houseStreet && p.city],
  ['Profile photo', (p) => p.photo],
  ['Emergency contact (Family)', (p) => p.family.some((f) => f.isEmergencyContact)],
  ['Education', (p) => p.education.length > 0],
  ['Work', (p) => p.work.length > 0],
  ['Skills', (p) => p.skills.length > 0],
];
function completeness(p) {
  const missing = CHECKS.filter(([, ok]) => !ok(p)).map(([label]) => label);
  return { percent: Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100), missing };
}

const ORDER = {
  family: [['isEmergencyContact', 'DESC'], ['id', 'ASC']],
  education: [['yearFinished', 'DESC'], ['id', 'DESC']],
  skills: [['id', 'ASC']],
  trainings: [['date', 'DESC'], ['id', 'DESC']],
  work: [['isCurrent', 'DESC'], ['startDate', 'DESC'], ['id', 'DESC']],
  references: [['id', 'ASC']],
};

export const profileService = {
  // Profile + all sections + completeness.
  async full(profileOrId) {
    const id = typeof profileOrId === 'object' ? profileOrId.id : profileOrId;
    const profile = await AlumniProfile.findByPk(id);
    if (!profile) throw ApiError.notFound('Alumni profile not found');
    const sections = Object.fromEntries(
      await Promise.all(SECTION_KEYS.map(async (k) => [k, (await SectionModels[k].findAll({ where: { profileId: id }, order: ORDER[k] })).map((r) => r.toJSON())]))
    );
    const data = { ...profile.toJSON(), ...sections };
    return { ...data, completeness: completeness(data) };
  },

  async forAccount(accountId) {
    return AlumniProfile.findOne({ where: { alumniAccountId: accountId } });
  },

  async getById(id) {
    const profile = await AlumniProfile.findByPk(id);
    if (!profile) throw ApiError.notFound('Alumni profile not found');
    return profile;
  },

  async list(query = {}) {
    const { page, limit, offset } = getPagination(query);
    const where = {};
    if (query.yearGraduated) where.yearGraduated = query.yearGraduated;
    if (query.linked !== undefined) where.alumniAccountId = query.linked ? { [Op.ne]: null } : null;
    if (query.source) where.source = query.source;
    if (query.importBatchId) where.importBatchId = query.importBatchId;
    if (query.invite) Object.assign(where, inviteWhere(query.invite));
    if (query.search) {
      const like = { [Op.like]: `%${query.search}%` };
      where[Op.or] = ['surname', 'firstName', 'studentNumber', 'alumniNumber', 'email', 'program'].map((f) => ({ [f]: like }));
    }
    const { rows, count } = await AlumniProfile.findAndCountAll({
      where,
      order: getSort(query, ['surname', 'yearGraduated', 'alumniNumber', 'createdAt', 'updatedAt'], [['surname', 'ASC'], ['firstName', 'ASC']]),
      limit,
      offset,
    });
    return { rows, meta: buildMeta({ page, limit }, count) };
  },

  async assignAlumniNumber(profile, options = {}) {
    if (profile.alumniNumber) return profile;
    return profile.update({ alumniNumber: alumniNumberFor(profile.id, profile.verifiedAt) }, options);
  },

  async addMcuEducation(profile, options = {}) {
    await SectionModels.education.create(
      { profileId: profile.id, school: MCU, level: 'College', degree: profile.program, yearFinished: profile.yearGraduated },
      options
    );
  },

  // EAO data entry (walk-ins, paper forms): verified immediately, gets an Alumni Number.
  async createByStaff(data, actor) {
    const clean = normalizeAddress(blankToNull(data));
    if (await AlumniProfile.count({ where: { studentNumber: clean.studentNumber } })) {
      throw ApiError.conflict('A profile with this student number already exists.', { studentNumber: 'Already has a profile' });
    }
    const profile = await AlumniProfile.create({ nationality: 'Filipino', country: PH, ...clean, source: 'eao', verifiedAt: new Date() });
    await this.assignAlumniNumber(profile);
    await this.addMcuEducation(profile);
    await log(profile.id, actor, 'profile', 'create', { alumniNumber: [null, profile.alumniNumber] });
    return profile;
  },

  // A record EAO encoded or imported (Step 5) that a portal account with this student number would claim.
  async unclaimedFor(studentNumber) {
    return AlumniProfile.findOne({ where: { studentNumber: canonicalStudentNumber(studentNumber), alumniAccountId: null } });
  },

  // When the Alumni Office verifies a portal account: link an existing profile (same student number) or create one.
  async createForAccount(account, actor) {
    let profile = await AlumniProfile.findOne({ where: { alumniAccountId: account.id } });
    if (profile) return profile;
    profile = await this.unclaimedFor(account.studentNumber);
    if (profile) {
      // Registered on their own: any invitation link still in their inbox stops working.
      await profile.update({ alumniAccountId: account.id, email: profile.email || account.email, phone: profile.phone || account.phone, verifiedAt: profile.verifiedAt || new Date(), inviteTokenHash: null, inviteExpiresAt: null });
      await this.assignAlumniNumber(profile);
      await log(profile.id, actor, 'profile', 'verify', { alumniAccountId: [null, account.id] });
      return profile;
    }
    const name = splitName(account.fullName);
    profile = await AlumniProfile.create({
      alumniAccountId: account.id,
      studentNumber: canonicalStudentNumber(account.studentNumber),
      ...name,
      sex: account.sex || null,
      nationality: 'Filipino',
      program: account.program,
      yearGraduated: account.yearGraduated,
      email: account.email,
      phone: account.phone,
      houseStreet: account.address || null,
      country: PH,
      source: 'portal',
      verifiedAt: new Date(),
    });
    await this.assignAlumniNumber(profile);
    await this.addMcuEducation(profile);
    await log(profile.id, actor, 'profile', 'verify', { alumniNumber: [null, profile.alumniNumber] });
    return profile;
  },

  async update(profile, data, actor) {
    const clean = normalizeAddress(blankToNull(data), profile);
    if (clean.studentNumber && clean.studentNumber !== profile.studentNumber && (await AlumniProfile.count({ where: { studentNumber: clean.studentNumber } }))) {
      throw ApiError.conflict('Another profile already uses this student number.', { studentNumber: 'Already used by another profile' });
    }
    const before = profile.toJSON();
    const oldPhoto = profile.photo;
    await profile.update(clean);
    const changes = diff(before, profile.toJSON(), Object.keys(clean));
    if (Object.keys(changes).length) await log(profile.id, actor, 'profile', 'update', changes);
    if (changes.photo && oldPhoto) await deleteUploadedFile(oldPhoto);
    // The portal account keeps a one-line copy of the address and the latest phone (shown on the dashboard and
    // pre-filled in the Graduate Tracer): keep it in step with the profile.
    if (profile.alumniAccountId && ADDRESS_FIELDS.concat('phone').some((f) => f in changes)) {
      const mirror = {};
      if (ADDRESS_FIELDS.some((f) => f in changes)) mirror.address = oneLineAddress(profile) || null;
      if ('phone' in changes && profile.phone) mirror.phone = profile.phone;
      await AlumniAccount.update(mirror, { where: { id: profile.alumniAccountId } });
    }
    return this.full(profile);
  },

  async remove(id) {
    const profile = await this.getById(id);
    await Promise.all(SECTION_KEYS.map((k) => SectionModels[k].destroy({ where: { profileId: id } })));
    await ProfileChange.destroy({ where: { profileId: id } });
    await profile.destroy();
    if (profile.photo) await deleteUploadedFile(profile.photo);
    return profile;
  },

  // ---- C. Sections ----
  async addItem(profile, section, data, actor) {
    const item = await SectionModels[section].create({ ...blankToNull(data), profileId: profile.id, ...(section === 'work' && { source: actor.type === 'staff' ? 'staff' : 'portal' }) });
    await log(profile.id, actor, section, 'add', { title: SECTIONS[section].title(item) });
    return item;
  },

  async editItem(profile, section, itemId, data, actor) {
    const item = await SectionModels[section].findOne({ where: { id: itemId, profileId: profile.id } });
    if (!item) throw ApiError.notFound(`${SECTIONS[section].label} entry not found`);
    const clean = blankToNull(data);
    const before = item.toJSON();
    await item.update(clean);
    const changes = diff(before, item.toJSON(), Object.keys(clean));
    if (Object.keys(changes).length) await log(profile.id, actor, section, 'edit', { title: SECTIONS[section].title(item), ...changes });
    return item;
  },

  async removeItem(profile, section, itemId, actor) {
    const item = await SectionModels[section].findOne({ where: { id: itemId, profileId: profile.id } });
    if (!item) throw ApiError.notFound(`${SECTIONS[section].label} entry not found`);
    await item.destroy();
    await log(profile.id, actor, section, 'remove', { title: SECTIONS[section].title(item) });
  },

  async changes(profileId) {
    return ProfileChange.findAll({ where: { profileId }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 200 });
  },

  // Graduate Tracer submitted from the portal: keep the profile's sex, phone and current job up to date,
  // so nothing is entered twice. Runs inside the tracer's transaction.
  async syncFromTracer(accountId, data, transaction) {
    const profile = await AlumniProfile.findOne({ where: { alumniAccountId: accountId }, transaction });
    if (!profile) return;
    const actor = systemActor('Graduate Tracer');

    const personal = blankToNull({ sex: data.sex, phone: data.phone });
    const before = profile.toJSON();
    await profile.update(personal, { transaction });
    const changes = diff(before, profile.toJSON(), Object.keys(personal));
    if (Object.keys(changes).length) await log(profile.id, actor, 'profile', 'update', changes, { transaction });

    if (data.isEmployed !== 'Yes' || !data.employer) return;
    const Work = SectionModels.work;
    const job = {
      company: data.employer,
      position: data.position,
      jobCategory: (data.jobCategories || []).map((c) => (c === 'Other' && data.jobCategoryOther ? `Other: ${data.jobCategoryOther}` : c)).join(', ') || null,
      relatedToDegree: data.relatedToDegree === 'Yes',
      isCurrent: true,
    };
    const current = await Work.findAll({ where: { profileId: profile.id, isCurrent: true }, transaction });
    const same = current.find((w) => w.company.trim().toLowerCase() === job.company.trim().toLowerCase());
    if (same) {
      const prev = same.toJSON();
      await same.update(job, { transaction });
      const workChanges = diff(prev, same.toJSON(), ['position', 'jobCategory', 'relatedToDegree']);
      if (Object.keys(workChanges).length) await log(profile.id, actor, 'work', 'edit', { title: SECTIONS.work.title(same), ...workChanges }, { transaction });
      return;
    }
    // New employer: earlier current jobs end today, the new one becomes current.
    const today = new Date().toISOString().slice(0, 10);
    for (const w of current) await w.update({ isCurrent: false, endDate: w.endDate || today }, { transaction });
    const added = await Work.create({ ...job, profileId: profile.id, startDate: today, source: 'tracer' }, { transaction });
    await log(profile.id, actor, 'work', 'add', { title: SECTIONS.work.title(added) }, { transaction });
  },
};
