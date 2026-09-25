import { logService } from './log.service.js';
import { LOG_ACTIONS } from './log.model.js';
import { asyncHandler } from '../../utils/helpers.js';
import { sendPaginated, sendSuccess } from '../../utils/response.js';

export const logController = {
  list: asyncHandler(async (req, res) => {
    sendPaginated(res, await logService.list(req.query));
  }),

  actions(req, res) {
    sendSuccess(res, { data: LOG_ACTIONS });
  },
};
