import { Op } from 'sequelize';
import { AlumniRecord } from '../alumni/alumni.model.js';
import { SectionModels } from '../profiles/profile.model.js';
import { profileService, oneLineAddress } from '../profiles/profile.service.js';
import { ApiError } from '../../utils/helpers.js';

// MCU Alumni ID requests from the Alumni Portal. The details come from the alumnus's verified profile (nothing
// is typed again), and each graduate has one request: asking again refreshes it instead of adding a duplicate.
// Requests appear in Admin -> Alumni records, where EAO processes and releases the IDs.

const OPEN = ['requested', 'processing'];

async function existing(account, profile) {
  const keys = [{ studentNumber: profile.studentNumber }, { email: profile.email || account.email }];
  return AlumniRecord.findOne({ where: { [Op.or]: keys }, order: [['createdAt', 'DESC'], ['id', 'DESC']] });
}

const view = (r) => (r ? { id: r.id, status: r.alumniIdStatus, requestedAt: r.updatedAt, createdAt: r.createdAt } : null);

export const portalAlumniId = {
  async status(account) {
    const profile = await profileService.forAccount(account.id);
    if (!profile) return { request: null, profile: null };
    return { request: view(await existing(account, profile)), alumniNumber: profile.alumniNumber };
  },

  async request(account) {
    const profile = await profileService.forAccount(account.id);
    if (!profile) throw new ApiError(403, 'You can request an Alumni ID once the Alumni Relations Office verifies your account.', { reason: 'not_verified' });

    const address = oneLineAddress(profile) || account.address;
    const phone = profile.phone || account.phone;
    const missing = [!address && 'address', !phone && 'mobile number'].filter(Boolean);
    if (missing.length) {
      throw ApiError.unprocessable(`Please add your ${missing.join(' and ')} in My profile first, so we can reach you about your ID.`, { reason: 'incomplete_profile' });
    }

    const current = await existing(account, profile);
    if (current && OPEN.includes(current.alumniIdStatus)) return { request: view(current), already: 'open' };
    if (current?.alumniIdStatus === 'released') return { request: view(current), already: 'released' };

    const job = await SectionModels.work.findOne({ where: { profileId: profile.id, isCurrent: true }, order: [['updatedAt', 'DESC']] });
    const data = {
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.surname,
      maidenName: profile.maidenName,
      birthDate: profile.birthDate,
      email: profile.email || account.email,
      phone,
      address: address.slice(0, 250),
      city: (profile.city || profile.province || 'Not specified').slice(0, 80),
      country: profile.country || 'Philippines',
      studentNumber: profile.studentNumber,
      course: profile.program,
      yearGraduated: profile.yearGraduated,
      employer: job?.company || null,
      position: job?.position || null,
      alumniIdStatus: 'requested',
      consentAt: new Date(),
    };
    const record = current ? await current.update(data) : await AlumniRecord.create(data);
    return { request: view(record), already: null };
  },
};
