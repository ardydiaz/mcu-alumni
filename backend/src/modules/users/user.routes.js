import { Router } from 'express';
import { userController } from './user.controller.js';
import { createUserSchema, updateUserSchema, listUsersQuerySchema, approveUserSchema } from './user.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { superAdminOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';

const router = Router();

// User and role management is for Super Admins only.
router.use(authenticate, superAdminOnly);

router.get('/roles', userController.roles);
router.get('/', validate(listUsersQuerySchema, 'query'), userController.list);
router.get('/:id', validate(idParamSchema, 'params'), userController.getById);
router.post('/', validate(createUserSchema), userController.create);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), userController.update);
// Access requests (status 'pending')
router.post('/:id/approve', validate(idParamSchema, 'params'), validate(approveUserSchema), userController.approve);
router.post('/:id/reject', validate(idParamSchema, 'params'), userController.reject);
router.delete('/:id', validate(idParamSchema, 'params'), userController.remove);

export default router;
