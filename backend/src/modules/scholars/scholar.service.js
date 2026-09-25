import { Scholar } from './scholar.model.js';
import { createCrudService } from '../../utils/helpers.js';

export const scholarService = createCrudService(Scholar, {
  label: 'Scholar',
  searchFields: ['name', 'college'],
  filterFields: ['college', 'isActive'],
  sortFields: ['name', 'college', 'sortOrder', 'createdAt'],
  defaultOrder: [['sortOrder', 'ASC'], ['name', 'ASC']],
  publicWhere: { isActive: true },
  fileFields: ['image'],
});
