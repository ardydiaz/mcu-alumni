import { Router } from 'express';
import multer from 'multer';
import { importController } from './import.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema, Joi } from '../../middleware/validation.middleware.js';
import { ApiError } from '../../utils/helpers.js';
import { listProfilesQuerySchema } from '../profiles/profile.validation.js';

const MAX_MB = 10;

// The spreadsheet is read in memory and never written to disk; only the cleaned records are saved.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 } }).single('file');
const uploadCsv = (req, res, next) =>
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? `The file must be at most ${MAX_MB} MB` : err.message;
      return next(ApiError.unprocessable(message, { file: message }));
    }
    next(err);
  });

const modeSchema = Joi.object({ mode: Joi.string().valid('fill', 'skip').default('fill') });
// Export takes the same filters as the Alumni profiles list.
const exportQuerySchema = listProfilesQuerySchema;

// Staff (EAO): /api/v1/imports — Step 5: Alumni Database Migration
const router = Router();
router.use(authenticate, adminPanelOnly);
router.get('/', importController.list);
router.get('/export', validate(exportQuerySchema, 'query'), importController.export);
router.post('/preview', uploadCsv, validate(modeSchema), importController.preview);
router.post('/', uploadCsv, validate(modeSchema), importController.commit);
router.get('/:id', validate(idParamSchema, 'params'), importController.get);
router.post('/:id/undo', validate(idParamSchema, 'params'), importController.undo);

export default router;
