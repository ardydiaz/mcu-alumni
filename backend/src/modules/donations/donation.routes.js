import { Router } from 'express';
import { donationController } from './donation.controller.js';
import { createDonationSchema, updateDonationSchema, listDonationsQuerySchema } from './donation.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { adminPanelOnly } from '../../middleware/role.middleware.js';
import { validate, idParamSchema } from '../../middleware/validation.middleware.js';
import { createRateLimiter } from '../../utils/helpers.js';

const router = Router();

// Public: submit a pledge from the Give page.
router.post('/', createRateLimiter(), validate(createDonationSchema), donationController.create);

// Staff: review and confirm pledges.
router.get('/', authenticate, adminPanelOnly, validate(listDonationsQuerySchema, 'query'), donationController.list);
router.get('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), donationController.getById);
router.patch('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), validate(updateDonationSchema), donationController.update);
router.delete('/:id', authenticate, adminPanelOnly, validate(idParamSchema, 'params'), donationController.remove);

export default router;
