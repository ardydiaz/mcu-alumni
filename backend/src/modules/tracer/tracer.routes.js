import { Router } from 'express';
import { tracerController } from './tracer.controller.js';
import { createTracerSchema, listTracerQuerySchema, tracerSummaryQuerySchema } from './tracer.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';

const router = Router();

// Public: Graduate Tracer form.
router.post('/', createRateLimiter(), validate(createTracerSchema), tracerController.create);

// Staff: responses and statistics.
router.get('/summary', authenticate, adminPanelOnly, validate(tracerSummaryQuerySchema, 'query'), tracerController.summary);
router.get('/', authenticate, adminPanelOnly, validate(listTracerQuerySchema, 'query'), tracerController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), tracerController.getById);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), tracerController.remove);

export default router;
