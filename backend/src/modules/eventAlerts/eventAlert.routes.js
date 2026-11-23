import { Router } from 'express';
import { eventAlertService } from './eventAlert.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema, listQuerySchema, Joi } from '../../middleware/validation.middleware.js';
import { asyncHandler, createRateLimiter, createCrudController } from '../../utils/helpers.js';
import { sendSuccess } from '../../utils/response.js';

const subscribeSchema = Joi.object({ email: Joi.string().trim().lowercase().email().max(120).required() });
const unsubscribeSchema = Joi.object({ token: Joi.string().hex().length(64).required() });
const listSchema = listQuerySchema.keys({ active: Joi.boolean() });

const crud = createCrudController(eventAlertService, { label: 'Subscriber' });
const router = Router();

// Public: homepage "Notify me" box, and the unsubscribe link in every alert email.
router.post(
  '/',
  createRateLimiter({ windowMinutes: 15, max: 10 }),
  validate(subscribeSchema),
  asyncHandler(async (req, res) => {
    await eventAlertService.subscribe(req.body.email);
    sendSuccess(res, { message: "You're on the list! We'll email you when Grand Alumni Homecoming registration opens." });
  })
);
router.post(
  '/unsubscribe',
  createRateLimiter({ windowMinutes: 15, max: 30 }),
  validate(unsubscribeSchema),
  asyncHandler(async (req, res) => {
    const result = await eventAlertService.unsubscribe(req.body.token);
    sendSuccess(res, { data: result, message: result.found ? 'You have been unsubscribed from event alerts.' : 'This unsubscribe link is not valid.' });
  })
);

// Staff: subscriber list.
router.get('/summary', authenticate, adminPanelOnly, asyncHandler(async (req, res) => sendSuccess(res, { data: await eventAlertService.summary() })));
router.get(
  '/export',
  authenticate,
  adminPanelOnly,
  asyncHandler(async (req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event-alert-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(await eventAlertService.exportCsv());
  })
);
router.get('/', authenticate, adminPanelOnly, validate(listSchema, 'query'), crud.list);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), crud.remove);

export default router;
