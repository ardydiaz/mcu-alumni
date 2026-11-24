import { profileService, alumniActor, staffActor } from './profile.service.js';
import { logService } from '../logs/log.service.js';
import { portalInvite } from '../portal/portal.invite.js';
import { ApiError, asyncHandler } from '../../utils/helpers.js';
import { sendCreated, sendPaginated, sendSuccess, sendNoContent } from '../../utils/response.js';

const fullName = (p) => `${p.surname}, ${p.firstName}`;
const audit = (req, action, profile, description) =>
  logService.record(req, { action, entity: 'Alumni profile', entityId: profile.id, description: `${description} ${fullName(profile)} (${profile.alumniNumber || profile.studentNumber})` });

export const profileController = {
  // ---- Staff (EAO) ----
  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await profileService.list(req.query));
  }),

  overview: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await profileService.overview() });
  }),

  get: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await profileService.full(req.params.id) });
  }),

  create: asyncHandler(async (req, res) => {
    const profile = await profileService.createByStaff(req.body, staffActor(req.user));
    await audit(req, 'create', profile, 'Created alumni profile');
    sendCreated(res, await profileService.full(profile), `Profile created with Alumni Number ${profile.alumniNumber}`);
  }),

  update: asyncHandler(async (req, res) => {
    const profile = await profileService.getById(req.params.id);
    const data = await profileService.update(profile, req.body, staffActor(req.user));
    await audit(req, 'update', profile, 'Updated alumni profile');
    sendSuccess(res, { data, message: 'Profile saved' });
  }),

  remove: asyncHandler(async (req, res) => {
    const profile = await profileService.remove(req.params.id);
    await audit(req, 'delete', profile, 'Deleted alumni profile');
    sendNoContent(res);
  }),

  addItem: asyncHandler(async (req, res) => {
    const profile = await profileService.getById(req.params.id);
    await profileService.addItem(profile, req.params.section, req.body, staffActor(req.user));
    sendCreated(res, await profileService.full(profile), 'Added');
  }),

  editItem: asyncHandler(async (req, res) => {
    const profile = await profileService.getById(req.params.id);
    await profileService.editItem(profile, req.params.section, req.params.itemId, req.body, staffActor(req.user));
    sendSuccess(res, { data: await profileService.full(profile), message: 'Saved' });
  }),

  removeItem: asyncHandler(async (req, res) => {
    const profile = await profileService.getById(req.params.id);
    await profileService.removeItem(profile, req.params.section, req.params.itemId, staffActor(req.user));
    sendSuccess(res, { data: await profileService.full(profile), message: 'Removed' });
  }),

  // Portal invitations: email activation links to graduates in the database who have no portal account yet.
  sendInvites: asyncHandler(async (req, res) => {
    const { resend, ...scope } = req.body;
    const result = await portalInvite.send(scope, { resend }, staffActor(req.user));
    await logService.record(req, { action: 'create', entity: 'Alumni profile', description: `Sent ${result.sent} portal invitation${result.sent === 1 ? '' : 's'}${result.failed ? ` (${result.failed} failed)` : ''}` });
    const message = result.sent ? `${result.sent} invitation${result.sent === 1 ? '' : 's'} sent` : 'No invitations were sent';
    sendSuccess(res, { data: result, message: result.failed ? `${message}; ${result.failed} could not be delivered` : message });
  }),

  inviteSummary: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalInvite.summary(req.query) });
  }),

  changes: asyncHandler(async (req, res) => {
    await profileService.getById(req.params.id);
    sendSuccess(res, { data: await profileService.changes(req.params.id) });
  }),

  // ---- Alumni (portal): their own profile only ----
  mine: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await profileService.full(req.profile) });
  }),

  updateMine: asyncHandler(async (req, res) => {
    // Date of birth is part of the verified record: alumni can add it once, then only EAO changes it.
    const { birthDate } = req.body;
    const current = req.profile.birthDate;
    if (birthDate !== undefined && current && String(new Date(birthDate).toISOString()).slice(0, 10) !== String(current).slice(0, 10)) {
      throw ApiError.unprocessable('Your date of birth can only be corrected by the Alumni Relations Office.', { birthDate: 'Request a correction from the Alumni Relations Office' });
    }
    sendSuccess(res, { data: await profileService.update(req.profile, req.body, alumniActor(req.alumni)), message: 'Your profile was saved' });
  }),

  // "My information is correct": the alumnus reviewed their profile without needing to change anything (Step 3).
  confirmMine: asyncHandler(async (req, res) => {
    await profileService.confirmReviewed(req.profile, alumniActor(req.alumni));
    sendSuccess(res, { data: await profileService.full(req.profile), message: 'Thank you for reviewing your profile!' });
  }),

  addMine: asyncHandler(async (req, res) => {
    await profileService.addItem(req.profile, req.params.section, req.body, alumniActor(req.alumni));
    sendCreated(res, await profileService.full(req.profile), 'Added to your profile');
  }),

  editMine: asyncHandler(async (req, res) => {
    await profileService.editItem(req.profile, req.params.section, req.params.itemId, req.body, alumniActor(req.alumni));
    sendSuccess(res, { data: await profileService.full(req.profile), message: 'Saved' });
  }),

  removeMine: asyncHandler(async (req, res) => {
    await profileService.removeItem(req.profile, req.params.section, req.params.itemId, alumniActor(req.alumni));
    sendSuccess(res, { data: await profileService.full(req.profile), message: 'Removed' });
  }),
};

// Portal: the profile opens once the Alumni Office has verified the account (that's when it is created).
export const loadOwnProfile = asyncHandler(async (req, res, next) => {
  const profile = await profileService.forAccount(req.alumni.id);
  if (!profile) throw new ApiError(403, 'Your alumni profile opens after the Alumni Relations Office verifies your account.', { reason: 'not_verified' });
  req.profile = profile;
  next();
});
