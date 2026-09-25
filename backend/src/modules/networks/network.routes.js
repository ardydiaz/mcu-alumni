import { Router } from 'express';
import { networkController } from './network.controller.js';
import { createNetworkSchema, updateNetworkSchema, listNetworksQuerySchema } from './network.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

router.get('/', optionalAuth, validate(listNetworksQuerySchema, 'query'), networkController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), networkController.getById);
router.post('/', authenticate, adminPanelOnly, uploadImage('logo', 'networks'), validate(createNetworkSchema), networkController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadImage('logo', 'networks'), validate(updateNetworkSchema), networkController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), networkController.remove);

export default router;
