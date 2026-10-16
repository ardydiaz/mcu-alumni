import { sequelize } from '../../config/database.js';
import { TracerResponse } from '../tracer/tracer.model.js';
import { tracerService } from '../tracer/tracer.service.js';
import { profileService } from '../profiles/profile.service.js';

// Graduate Tracer from the Alumni Portal:
//   latest answers + account -> pre-filled form -> alumnus changes only what is different -> submit
//   -> a new tracer row linked to the account (history kept) + the account's personal details updated.

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

export const portalTracer = {
  latest(accountId) {
    return TracerResponse.findOne({ where: { alumniAccountId: accountId }, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
  },

  // Everything the form needs to start pre-filled, in the form's own format.
  async prefill(account) {
    const [last, count] = await Promise.all([this.latest(account.id), TracerResponse.count({ where: { alumniAccountId: account.id } })]);
    const locked = LOCKED(account);
    return {
      values: {
        ...Object.fromEntries(Object.entries(locked).map(([k, v]) => [k, text(v)])),
        phone: text(account.phone),
        sex: text(account.sex || last?.sex),
        address: text(account.address || last?.address),
        isEmployed: yesNo(last?.isEmployed),
        employer: text(last?.employer),
        jobCategories: list(last?.jobCategories),
        jobCategoryOther: text(last?.jobCategoryOther),
        position: text(last?.position),
        relatedToDegree: yesNo(last?.relatedToDegree),
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
