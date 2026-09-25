import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { recentActivityQuerySchema } from './dashboard.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = Router();

router.use(authenticate, adminPanelOnly);

router.get('/stats', dashboardController.stats);
router.get('/recent', validate(recentActivityQuerySchema, 'query'), dashboardController.recent);

export default router;
