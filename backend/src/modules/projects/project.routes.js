import { Router } from 'express';
import { projectController } from './project.controller.js';
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from './project.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

router.get('/', optionalAuth, validate(listProjectsQuerySchema, 'query'), projectController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), projectController.getById);
router.post('/', authenticate, adminPanelOnly, uploadImage('image', 'projects'), validate(createProjectSchema), projectController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadImage('image', 'projects'), validate(updateProjectSchema), projectController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), projectController.remove);

export default router;
