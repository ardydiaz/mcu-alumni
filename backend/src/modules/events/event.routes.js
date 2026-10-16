import { Router } from 'express';
import { eventController } from './event.controller.js';
import { createEventSchema, updateEventSchema, listEventsQuerySchema, eventKeySchema } from './event.validation.js';
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

export default router;
