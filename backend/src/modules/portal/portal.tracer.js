import { sequelize } from '../../config/database.js';
import { TracerResponse } from '../tracer/tracer.model.js';
import { tracerService } from '../tracer/tracer.service.js';
import { profileService, oneLineAddress } from '../profiles/profile.service.js';
import { SectionModels } from '../profiles/profile.model.js';
import { JOB_CATEGORIES } from '../content/content.data.js';

// Graduate Tracer from the Alumni Portal:
//   alumni profile + latest answers + account -> pre-filled form -> alumnus changes only what is different
//   -> submit -> a new tracer row linked to the account (history kept) + account and profile updated.

// Verified by the Alumni Office: always taken from the account, never from the form.
const LOCKED = (account) => ({
  fullName: account.fullName,
  email: account.email,
  yearGraduated: account.yearGraduated,
  degree: account.program,
});

// Personal details that the tracer keeps current on the account.
const PROFILE_FIELDS = ['phone', 'sex', 'address'];

const yesNo = (v) => (v === true || v === 1 ? 'Yes' : v === false || v === 0 ? 'No' : '');
const text = (v) => (v == null ? '' : String(v));
const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? JSON.parse(v) : []);

// Work entry "Entry Level / Associate, Other: Researcher" -> tracer checkboxes. Matched against the known
// categories (some contain commas, e.g. "Senior Executive (e.g., CEO, VP, President)").
function jobCategoriesFrom(value) {
  const other = /Other: (.+)$/.exec(value)?.[1]?.trim() || '';
  const known = JOB_CATEGORIES.filter((c) => c !== 'Other' && value.includes(c));
  const picked = [...known, ...(other || /(^|, )Other$/.test(value) ? ['Other'] : [])];
  return picked.length ? { list: picked, other } : null;
}

export const portalTracer = {
  latest(accountId) {
    return TracerResponse.findOne({ where: { alumniAccountId: accountId }, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
  },

  // The alumni profile (master record, Step 4/5): personal details and the current job from the Work section.
  // It is filled by the Registrar import, the alumnus (My Profile) and earlier tracers, so it is the freshest source.
  async fromProfile(accountId) {
    const profile = await profileService.forAccount(accountId);
    if (!profile) return {};
    // Several current jobs: the one the alumnus told us about most recently.
    const job = await SectionModels.work.findOne({ where: { profileId: profile.id, isCurrent: true }, order: [['updatedAt', 'DESC'], ['id', 'DESC']] });
    return { profile, job, address: oneLineAddress(profile) };
  },

  // Everything the form needs to start pre-filled, in the form's own format.
  // Personal details and job: profile first, then the account / last tracer. Tracer-only questions: last tracer.
  async prefill(account) {
    const [last, count, { profile, job, address }] = await Promise.all([
      this.latest(account.id),
      TracerResponse.count({ where: { alumniAccountId: account.id } }),
      this.fromProfile(account.id),
    ]);
    const locked = LOCKED(account);
    const categories = job?.jobCategory ? jobCategoriesFrom(job.jobCategory) : null;
    return {
      values: {
        ...Object.fromEntries(Object.entries(locked).map(([k, v]) => [k, text(v)])),
        phone: text(profile?.phone || account.phone),
        sex: text(profile?.sex || account.sex || last?.sex),
        // The account's copy is the latest (updated by My Profile and by earlier tracers); the profile fills a blank one.
        address: text(account.address || address || last?.address),
        isEmployed: job ? 'Yes' : yesNo(last?.isEmployed),
        employer: text(job?.company || last?.employer),
        jobCategories: categories?.list || list(last?.jobCategories),
        jobCategoryOther: text(categories ? categories.other : last?.jobCategoryOther),
        position: text(job?.position || last?.position),
        relatedToDegree: job && job.relatedToDegree !== null ? yesNo(job.relatedToDegree) : yesNo(last?.relatedToDegree),
        timeToFirstJob: text(last?.timeToFirstJob),
        furtherStudies: yesNo(last?.furtherStudies),
        furtherStudiesTiming: text(last?.furtherStudiesTiming),
      },
      locked: Object.keys(locked),
      lastSubmittedAt: last?.createdAt || null,
      submissions: count,
    };
  },

  // Validated body (identity fields already replaced by lockIdentity). One transaction: both saves or neither.
  async submit(account, data) {
    return sequelize.transaction(async (transaction) => {
      const { id } = await tracerService.create({ ...data, alumniAccountId: account.id }, { transaction });
      const changes = Object.fromEntries(PROFILE_FIELDS.filter((k) => data[k] && data[k] !== account[k]).map((k) => [k, data[k]]));
      if (Object.keys(changes).length) await account.update(changes, { transaction });
      // Alumni profile: sex, phone and the current job (Work section) follow the tracer answers.
      await profileService.syncFromTracer(account.id, data, transaction);
      return { id, profileUpdated: Object.keys(changes) };
    });
  },

  // Staff: an alumnus's tracer history, newest first.
  history(accountId) {
    return TracerResponse.findAll({ where: { alumniAccountId: accountId }, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
  },
};

// Middleware: identity fields come from the verified account, whatever the form sent.
export function lockIdentity(req, res, next) {
  Object.assign(req.body, LOCKED(req.alumni));
  next();
}
