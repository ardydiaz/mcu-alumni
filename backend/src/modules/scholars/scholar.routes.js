import { Router } from 'express';
import { scholarController } from './scholar.controller.js';
import { createScholarSchema, updateScholarSchema, listScholarsQuerySchema } from './scholar.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

router.get('/', optionalAuth, validate(listScholarsQuerySchema, 'query'), scholarController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), scholarController.getById);
// multipart/form-data with an optional "image" file, or JSON with an image URL
router.post('/', authenticate, adminPanelOnly, uploadImage('image', 'scholars'), validate(createScholarSchema), scholarController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadImage('image', 'scholars'), validate(updateScholarSchema), scholarController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), scholarController.remove);

export default router;
