import { alumniService } from './alumni.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendCreated } from '../../utils/response.js';

export const alumniController = {
  ...createCrudController(alumniService, { label: 'Alumni record' }),

  create: asyncHandler(async (req, res) => {
    const data = await alumniService.create(req.body);
    const message =
      data.alumniIdStatus === 'requested'
        ? 'Thank you! Your information has been updated. We will contact you about your Alumni ID.'
        : 'Thank you! Your information has been updated.';
    sendCreated(res, data, message);
  }),
};
