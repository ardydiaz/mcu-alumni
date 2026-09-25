import { Router } from 'express';
import { campaignController } from './campaign.controller.js';
import { createCampaignSchema, updateCampaignSchema, listCampaignsQuerySchema } from './campaign.validation.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';

const router = Router();

router.get('/', optionalAuth, validate(listCampaignsQuerySchema, 'query'), campaignController.list);
router.get('/:id', optionalAuth, validate(idParamSchema, 'params'), campaignController.getById);
router.post('/', authenticate, adminPanelOnly, validate(createCampaignSchema), campaignController.create);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), validate(updateCampaignSchema), campaignController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), campaignController.remove);

export default router;
