import { reportService } from './report.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendSuccess } from '../../utils/response.js';

export const reportController = {
  ...createCrudController(reportService, { label: 'Report' }),

  listGrouped: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await reportService.listGrouped() });
  }),
};
