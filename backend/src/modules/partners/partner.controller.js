import { partnerService } from './partner.service.js';
import { createCrudController } from '../../utils/helpers.js';

export const partnerController = createCrudController(partnerService, { label: 'Partner' });
