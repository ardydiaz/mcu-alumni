import { Router } from 'express';
import { messageController } from './message.controller.js';
import { createMessageSchema, updateMessageSchema, listMessagesQuerySchema } from './message.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';
import { withCaptcha } from '../../middleware/captcha.middleware.js';

const router = Router();

// Public: "Leave us a message" form in the footer.
router.post('/', createRateLimiter(), ...withCaptcha(validate(createMessageSchema)), messageController.create);

// Staff: inbox.
router.get('/', authenticate, adminPanelOnly, validate(listMessagesQuerySchema, 'query'), messageController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), messageController.getById);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), validate(updateMessageSchema), messageController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), messageController.remove);

export default router;
