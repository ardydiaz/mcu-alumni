import { campaignService } from './campaign.service.js';
import { createCrudController } from '../../utils/helpers.js';

export const campaignController = createCrudController(campaignService, { label: 'Campaign' });
