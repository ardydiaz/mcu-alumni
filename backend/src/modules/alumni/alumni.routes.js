import { Router } from 'express';
import { alumniController } from './alumni.controller.js';
import { createAlumniSchema, updateAlumniSchema, listAlumniQuerySchema } from './alumni.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';

const router = Router();

// Public: Alumni Contact Update form.
router.post('/', createRateLimiter(), validate(createAlumniSchema), alumniController.create);

// Staff: alumni directory and Alumni ID processing.
router.get('/', authenticate, adminPanelOnly, validate(listAlumniQuerySchema, 'query'), alumniController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), alumniController.getById);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), validate(updateAlumniSchema), alumniController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), alumniController.remove);

export default router;
