import { Router } from 'express';
import { logController } from './log.controller.js';
import { listLogsQuerySchema } from './log.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { superAdminOnly } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate, superAdminOnly);

router.get('/actions', logController.actions);
router.get('/', validate(listLogsQuerySchema, 'query'), logController.list);

export default router;
