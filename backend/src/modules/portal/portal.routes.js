import { Router } from 'express';
import { portalController } from './portal.controller.js';
import { registerSchema, verifyEmailSchema, resendSchema, loginSchema, listAccountsQuerySchema, rejectSchema, activateSchema, inviteTokenQuerySchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './portal.validation.js';
import { authenticateAlumni } from './portal.middleware.js';
import { lockIdentity } from './portal.tracer.js';
import { createTracerSchema } from '../tracer/tracer.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';
import { withCaptcha } from '../../middleware/captcha.middleware.js'; // security code on register / resend / forgot password

const router = Router();
const staff = [authenticate, adminPanelOnly];

// Alumni Portal (public + alumni session)
router.post('/register', createRateLimiter({ max: 10 }), ...withCaptcha(validate(registerSchema)), portalController.register);
router.post('/verify-email', createRateLimiter({ max: 20 }), validate(verifyEmailSchema), portalController.verifyEmail);
router.post('/resend-verification', createRateLimiter({ max: 5 }), ...withCaptcha(validate(resendSchema)), portalController.resendVerification);
router.post('/login', createRateLimiter({ max: 20 }), validate(loginSchema), portalController.login);
router.get('/invite', createRateLimiter({ max: 30 }), validate(inviteTokenQuerySchema, 'query'), portalController.invitePreview);
router.post('/activate', createRateLimiter({ max: 10 }), validate(activateSchema), portalController.activate);
// Password: "Forgot password?" (rate-limited: the page says whether an email is registered), reset, change
router.post('/forgot-password', createRateLimiter({ max: 5, message: 'Too many reset requests. Please try again in 15 minutes.' }), ...withCaptcha(validate(forgotPasswordSchema)), portalController.forgotPassword);
router.get('/reset-password', createRateLimiter({ max: 30 }), validate(inviteTokenQuerySchema, 'query'), portalController.checkResetToken);
router.post('/reset-password', createRateLimiter({ max: 10 }), validate(resetPasswordSchema), portalController.resetPassword);
router.post('/change-password', createRateLimiter({ max: 10 }), authenticateAlumni, validate(changePasswordSchema), portalController.changePassword);
router.get('/me', authenticateAlumni, portalController.me);
router.get('/alumni-id', authenticateAlumni, portalController.alumniIdStatus);
router.post('/alumni-id', createRateLimiter({ max: 10 }), authenticateAlumni, portalController.requestAlumniId);
router.get('/tracer', authenticateAlumni, portalController.tracerPrefill);
// lockIdentity runs before validation: name, email, degree and year always come from the verified account.
router.post('/tracer', createRateLimiter({ max: 20 }), authenticateAlumni, lockIdentity, validate(createTracerSchema), portalController.tracerSubmit);

// Staff: Alumni accounts review (Super Admin + Administrator)
router.get('/accounts', ...staff, validate(listAccountsQuerySchema, 'query'), portalController.list);
router.get('/accounts/:id', ...staff, validate(idParamSchema, 'params'), portalController.getById);
router.post('/accounts/:id/approve', ...staff, validate(idParamSchema, 'params'), portalController.approve);
router.post('/accounts/:id/reject', ...staff, validate(idParamSchema, 'params'), validate(rejectSchema), portalController.reject);
router.get('/accounts/:id/tracer', ...staff, validate(idParamSchema, 'params'), portalController.tracerHistory);
router.get('/accounts/:id/record', ...staff, validate(idParamSchema, 'params'), portalController.recordMatch);
router.post('/accounts/:id/send-reset', ...staff, validate(idParamSchema, 'params'), portalController.sendPasswordReset);
router.delete('/accounts/:id', ...staff, validate(idParamSchema, 'params'), portalController.remove);

export default router;
