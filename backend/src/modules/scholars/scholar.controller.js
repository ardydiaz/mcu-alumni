import { scholarService } from './scholar.service.js';
import { createCrudController } from '../../utils/helpers.js';

export const scholarController = createCrudController(scholarService, { label: 'Scholar' });
