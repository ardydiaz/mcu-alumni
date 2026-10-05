import { Router } from 'express';
import { slideController } from './slide.controller.js';
import { createSlideSchema, updateSlideSchema, listSlidesQuerySchema } from './slide.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

// Public: active slides for the homepage (admins also see hidden ones).
router.get('/', optionalAuth, validate(listSlidesQuerySchema, 'query'), slideController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), slideController.getById);

// Admin: multipart/form-data with an "image" file, or JSON with an image URL.
router.post('/', authenticate, adminPanelOnly, uploadImage('image', 'slides'), validate(createSlideSchema), slideController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadImage('image', 'slides'), validate(updateSlideSchema), slideController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), slideController.remove);

export default router;
