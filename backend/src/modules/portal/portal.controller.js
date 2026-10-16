import { portalService, toPortalProfile } from './portal.service.js';
import { portalTracer } from './portal.tracer.js';
import { portalInvite } from './portal.invite.js';
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
