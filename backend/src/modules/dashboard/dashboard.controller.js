import { dashboardService } from './dashboard.service.js';
import { asyncHandler } from '../../utils/helpers.js';
import { sendSuccess } from '../../utils/response.js';

export const dashboardController = {
  stats: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await dashboardService.getStats() });
  }),

  recent: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await dashboardService.getRecentActivity(req.query.limit) });
  }),
};
