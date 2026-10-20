import { portalService, toPortalProfile } from './portal.service.js';
import { portalTracer } from './portal.tracer.js';
import { portalInvite } from './portal.invite.js';
import { portalAlumniId } from './portal.alumniId.js';
import { portalPassword } from './portal.password.js';
import { logService } from '../logs/log.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

const crud = createCrudController(portalService, { label: 'Alumni account' });

export const portalController = {
  // ---- Alumni ----
  register: asyncHandler(async (req, res) => {
    const data = await portalService.register(req.body);
    sendCreated(res, data, 'Account created! Please check your email to verify your address.');
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const data = await portalService.verifyEmail(req.body.token);
    sendSuccess(res, { data, message: 'Email verified. The Alumni Relations Office will now review your registration.' });
  }),

  resendVerification: asyncHandler(async (req, res) => {
    await portalService.resendVerification(req.body.email);
    sendSuccess(res, { message: 'If that email is registered and not yet verified, a new verification link is on its way.' });
  }),

  // Portal invitation: who the link is for, then set a password (account created verified, signed in).
  invitePreview: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalInvite.preview(req.query.token) });
  }),

  activate: asyncHandler(async (req, res) => {
    const { token, account } = await portalInvite.accept(req.body);
    sendCreated(res, { token, account: toPortalProfile(account) }, 'Welcome to the MCU Alumni Portal! Your account is active.');
  }),

  login: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalService.login(req.body), message: 'Welcome back!' });
  }),

  me: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: toPortalProfile(req.alumni) });
  }),

  // Graduate Tracer: pre-filled answers (account + latest submission)
  tracerPrefill: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalTracer.prefill(req.alumni) });
  }),

  tracerSubmit: asyncHandler(async (req, res) => {
    const data = await portalTracer.submit(req.alumni, req.body);
    const message = data.profileUpdated.length
      ? 'Thank you for completing the Graduate Tracer! Your profile was updated too.'
      : 'Thank you for completing the Graduate Tracer!';
    sendCreated(res, { ...data, account: toPortalProfile(req.alumni) }, message);
  }),

  // Staff: one alumnus's tracer history
  tracerHistory: asyncHandler(async (req, res) => {
    await portalService.getById(req.params.id, { internal: true }); // 404 if the account does not exist
    sendSuccess(res, { data: await portalTracer.history(req.params.id) });
  }),

  // ---- Password: forgot / reset / change ----
  forgotPassword: asyncHandler(async (req, res) => {
    const data = await portalPassword.request(req.body.email);
    const message = data.status === 'invited'
      ? `Your account isn't activated yet, so we sent your activation link to ${data.email}. Use it to set your password.`
      : `We sent a password reset link to ${data.email}. It expires in 1 hour; check your Spam folder too.`;
    sendSuccess(res, { data, message });
  }),

  checkResetToken: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalPassword.check(req.query.token) });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const data = await portalPassword.reset(req.body.token, req.body.password);
    sendSuccess(res, { data, message: 'Your password was changed. You can now log in with your new password.' });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const data = await portalPassword.change(req.alumni, req.body);
    sendSuccess(res, { data, message: 'Your password was changed. Other devices were signed out.' });
  }),

  // Staff: send the reset link (e.g. after correcting the alumnus's email)
  sendPasswordReset: asyncHandler(async (req, res) => {
    const data = await portalPassword.sendForStaff(req.params.id);
    await logService.record(req, { action: 'update', entity: 'Alumni account', entityId: req.params.id, description: `Sent a password reset link to ${data.email}` });
    sendSuccess(res, { data, message: data.status === 'invited' ? `Activation link sent to ${data.email}` : `Password reset link sent to ${data.email}` });
  }),

  // Alumni ID request (from the verified profile; one request per graduate)
  alumniIdStatus: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalAlumniId.status(req.alumni) });
  }),

  requestAlumniId: asyncHandler(async (req, res) => {
    const data = await portalAlumniId.request(req.alumni);
    const message =
      data.already === 'released' ? 'Your Alumni ID has already been released.'
        : data.already === 'open' ? 'Your Alumni ID request is already being processed.'
          : 'Alumni ID requested! The Alumni Relations Office will contact you about the requirements and release.';
    sendSuccess(res, { data, message });
  }),

  // Staff: the Registrar/EAO record this registration matches (null if none)
  recordMatch: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await portalService.recordMatch(req.params.id) });
  }),

  // ---- Staff ----
  list: crud.list,
  getById: crud.getById,
  remove: crud.remove,

  approve: asyncHandler(async (req, res) => {
    const account = await portalService.approve(req.params.id, req.user);
    await logService.record(req, { action: 'update', entity: 'Alumni account', entityId: account.id, description: `Verified alumni account ${account.fullName} (${account.email})` });
    sendSuccess(res, { data: account, message: `${account.fullName} is now verified` });
  }),

  reject: asyncHandler(async (req, res) => {
    const account = await portalService.reject(req.params.id, req.body, req.user);
    await logService.record(req, { action: 'update', entity: 'Alumni account', entityId: account.id, description: `Rejected alumni account ${account.fullName} (${account.email})` });
    sendSuccess(res, { data: account, message: `Registration of ${account.fullName} rejected` });
  }),
};
