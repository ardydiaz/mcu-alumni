import { messageService } from './message.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendCreated } from '../../utils/response.js';

export const messageController = {
  ...createCrudController(messageService, { label: 'Message' }),

  create: asyncHandler(async (req, res) => {
    const data = await messageService.create(req.body);
    sendCreated(res, data, 'Thank you! Your message has been sent. We emailed you a confirmation and will reply within 2–3 working days.');
  }),
};
