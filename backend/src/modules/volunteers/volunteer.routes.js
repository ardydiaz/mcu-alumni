import { Router } from 'express';
import { volunteerController } from './volunteer.controller.js';
import { createVolunteerSchema, updateVolunteerSchema, listVolunteersQuerySchema } from './volunteer.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';

const router = Router();

// Public: volunteer sign-up form.
router.post('/', createRateLimiter(), validate(createVolunteerSchema), volunteerController.create);

// Staff: manage volunteers.
router.get('/', authenticate, adminPanelOnly, validate(listVolunteersQuerySchema, 'query'), volunteerController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), volunteerController.getById);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), validate(updateVolunteerSchema), volunteerController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), volunteerController.remove);

export default router;
