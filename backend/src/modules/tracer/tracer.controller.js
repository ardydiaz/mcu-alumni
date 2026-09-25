import { tracerService } from './tracer.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendCreated, sendSuccess } from '../../utils/response.js';

export const tracerController = {
  ...createCrudController(tracerService, { label: 'Tracer response' }),

  create: asyncHandler(async (req, res) => {
    const data = await tracerService.create(req.body);
    sendCreated(res, data, 'Thank you for completing the Graduate Tracer!');
  }),

  summary: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await tracerService.summary(req.query) });
  }),
};
