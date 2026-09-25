import { Router } from 'express';
import { contentController } from './content.controller.js';
import { sectionParamSchema } from './content.validation.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = Router();

router.get('/', contentController.listSections);
router.get('/:section', validate(sectionParamSchema, 'params'), contentController.getSection);

export default router;
