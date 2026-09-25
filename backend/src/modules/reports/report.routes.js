import { Router } from 'express';
import { reportController } from './report.controller.js';
import { createReportSchema, updateReportSchema, listReportsQuerySchema } from './report.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { uploadDocument } from '../../middleware/upload.middleware.js';

const router = Router();

router.get('/grouped', reportController.listGrouped);
router.get('/', optionalAuth, validate(listReportsQuerySchema, 'query'), reportController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), reportController.getById);
// multipart/form-data with a "file" PDF (stored as fileUrl), or JSON with a fileUrl
router.post('/', authenticate, adminPanelOnly, uploadDocument('file', 'reports', 'fileUrl'), validate(createReportSchema), reportController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), uploadDocument('file', 'reports', 'fileUrl'), validate(updateReportSchema), reportController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), reportController.remove);

export default router;
