import { Slide } from './slide.model.js';
import { createCrudService } from '../../utils/helpers.js';

export const slideService = createCrudService(Slide, {
  label: 'Slide',
  searchFields: ['title', 'eyebrow', 'subtitle'],
  filterFields: ['isActive'],
  sortFields: ['title', 'sortOrder', 'createdAt'],
  defaultOrder: [['sortOrder', 'ASC'], ['id', 'ASC']],
  publicWhere: { isActive: true }, // visitors only see active slides
  fileFields: ['image'], // replaced/deleted uploads are removed from disk
});
