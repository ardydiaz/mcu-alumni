import { volunteerService } from './volunteer.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendCreated } from '../../utils/response.js';

export const volunteerController = {
  ...createCrudController(volunteerService, { label: 'Volunteer' }),

  create: asyncHandler(async (req, res) => {
    const data = await volunteerService.create(req.body);
    sendCreated(res, data, 'Thank you for volunteering! Our Alumni Relations team will get in touch soon.');
  }),
};
