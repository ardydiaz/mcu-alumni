import { sections } from './content.data.js';
import { ApiError } from '../../utils/helpers.js';

export const contentService = {
  listSections() {
    return Object.keys(sections);
  },

  getSection(name) {
    if (!Object.hasOwn(sections, name)) throw ApiError.notFound(`Unknown content section "${name}"`);
    return sections[name];
  },
};
