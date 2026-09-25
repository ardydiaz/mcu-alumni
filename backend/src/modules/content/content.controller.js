import { contentService } from './content.service.js';
import { sendSuccess } from '../../utils/response.js';

export const contentController = {
  listSections(req, res) {
    sendSuccess(res, { data: contentService.listSections() });
  },

  getSection(req, res) {
    sendSuccess(res, { data: contentService.getSection(req.params.section) });
  },
};
