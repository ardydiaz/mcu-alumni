import { Router } from 'express';
import { authController } from './auth.controller.js';
import { refreshSchema, updateProfileSchema, m365LoginQuerySchema, m365ExchangeSchema } from './auth.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';
import { env } from '../../config/env.js';

const router = Router();

// Each Microsoft sign-in makes 2 requests (login + callback); staff behind the campus NAT share one IP.
const m365RedirectLimiter = createRateLimiter({ windowMinutes: 15, max: 60, redirectTo: `${env.frontendUrl}/admin/login?error=too_many_attempts` });
const m365Limiter = createRateLimiter({ windowMinutes: 15, max: 60, message: 'Too many sign-in attempts. Please try again in 15 minutes.' });

router.get('/providers', authController.providers);

// Microsoft 365 (Entra ID) sign-in
router.get('/m365/login', m365RedirectLimiter, validate(m365LoginQuerySchema, 'query'), authController.m365Login);
router.get('/m365/callback', m365RedirectLimiter, authController.m365Callback);
router.post('/m365/exchange', m365Limiter, validate(m365ExchangeSchema), authController.m365Exchange);

// Session
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(refreshSchema), authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// Admin dashboard profile: JWT -> role -> Super Admin or Administrator, otherwise 403.
router.get('/profile', authenticate, adminPanelOnly, authController.profile);
router.patch('/profile', authenticate, adminPanelOnly, validate(updateProfileSchema), authController.updateProfile);

export default router;
