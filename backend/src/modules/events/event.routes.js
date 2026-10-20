import { Router } from 'express';
import { eventController } from './event.controller.js';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  eventKeySchema,
  registrationParamSchema,
  registrationListQuerySchema,
  registrationStatusSchema,
  registrationBulkSchema,
} from './event.validation.js';
import { authenticateAlumni } from '../portal/portal.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

// Public: calendar and event pages (staff also see drafts).
router.get('/', optionalAuth, validate(listEventsQuerySchema, 'query'), eventController.list);
router.get('/:key/ics', optionalAuth, validate(eventKeySchema, 'params'), eventController.ics);
router.get('/:key', optionalAuth, validate(eventKeySchema, 'params'), eventController.getByKey);

// Staff: multipart/form-data with an optional "image" file (cover photo), or JSON.
router.post('/', authenticate, adminPanelOnly, uploadImage('image', 'events'), validate(createEventSchema), eventController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadImage('image', 'events'), validate(updateEventSchema), eventController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), eventController.remove);

// Staff: who registered through the Alumni Portal, attendance, CSV
const staff = [authenticate, adminPanelOnly];
router.get('/:id/registrations', ...staff, validate(registrationParamSchema, 'params'), validate(registrationListQuerySchema, 'query'), eventController.registrations);
router.get('/:id/registrations/export', ...staff, validate(registrationParamSchema, 'params'), eventController.exportRegistrations);
router.patch('/:id/registrations', ...staff, validate(registrationParamSchema, 'params'), validate(registrationBulkSchema), eventController.setRegistrationStatusMany);
router.patch('/:id/registrations/:registrationId', ...staff, validate(registrationParamSchema, 'params'), validate(registrationStatusSchema), eventController.setRegistrationStatus);

export default router;

// Alumni (portal): /api/v1/portal/events — register / cancel, and which events they registered for.
export const portalEventRoutes = Router();
portalEventRoutes.use(authenticateAlumni);
portalEventRoutes.get('/', eventController.myRegistrations);
portalEventRoutes.post('/:id/register', createRateLimiter({ max: 30 }), validate(idParamSchema, 'params'), eventController.register);
portalEventRoutes.delete('/:id/register', validate(idParamSchema, 'params'), eventController.cancelRegistration);
