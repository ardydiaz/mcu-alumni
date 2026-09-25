import { Router } from 'express';
import { partnerController } from './partner.controller.js';
import { createPartnerSchema, updatePartnerSchema, listPartnersQuerySchema } from './partner.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

// GET /partners?type=merchant | ?type=industry
router.get('/', optionalAuth, validate(listPartnersQuerySchema, 'query'), partnerController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), partnerController.getById);
router.post('/', authenticate, adminPanelOnly, uploadImage('logo', 'partners'), validate(createPartnerSchema), partnerController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadImage('logo', 'partners'), validate(updatePartnerSchema), partnerController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), partnerController.remove);

export default router;
