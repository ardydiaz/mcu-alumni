import { Router } from 'express';
import { alumniController } from './alumni.controller.js';
import { updateAlumniSchema, listAlumniQuerySchema } from './alumni.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';

const router = Router();

// The public Alumni Contact Update form is closed: alumni update their information in the Alumni Portal
// (My profile), so there is one verified record per graduate and no duplicates. Alumni ID requests also come
// from the portal (POST /portal/alumni-id).
router.post('/', (req, res) =>
  res.status(410).json({ success: false, message: 'Please log in to the MCU Alumni Portal to update your information. New here? Create your account at /portal/register.' })
);

// Staff: alumni directory and Alumni ID processing.
router.get('/', authenticate, adminPanelOnly, validate(listAlumniQuerySchema, 'query'), alumniController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), alumniController.getById);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), validate(updateAlumniSchema), alumniController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), alumniController.remove);

export default router;
