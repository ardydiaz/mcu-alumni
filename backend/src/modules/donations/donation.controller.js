import { donationService } from './donation.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendCreated } from '../../utils/response.js';

export const donationController = {
  ...createCrudController(donationService, { label: 'Donation' }),

  create: asyncHandler(async (req, res) => {
    const data = await donationService.create(req.body);
    sendCreated(res, data, 'Thank you! Your pledge has been received. Please complete your gift through any of the bank accounts listed.');
  }),
};
