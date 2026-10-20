import { Router } from 'express';
import { tracerController } from './tracer.controller.js';
import { listTracerQuerySchema, tracerSummaryQuerySchema } from './tracer.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';

const router = Router();

// The public Graduate Tracer form is closed: alumni answer it in the Alumni Portal (POST /portal/tracer),
// pre-filled from their verified profile, so every answer belongs to a known graduate and updates their record.
router.post('/', (req, res) =>
  res.status(410).json({ success: false, message: 'Please log in to the MCU Alumni Portal to answer the Graduate Tracer. New here? Create your account at /portal/register.' })
);

// Staff: responses and statistics.
router.get('/summary', authenticate, adminPanelOnly, validate(tracerSummaryQuerySchema, 'query'), tracerController.summary);
router.get('/', authenticate, adminPanelOnly, validate(listTracerQuerySchema, 'query'), tracerController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), tracerController.getById);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), tracerController.remove);

export default router;
