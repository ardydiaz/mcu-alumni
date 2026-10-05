import { slideService } from './slide.service.js';
import { createCrudController } from '../../utils/helpers.js';

export const slideController = createCrudController(slideService, { label: 'Slide' });
