import { Project } from './project.model.js';
import { createCrudService } from '../../utils/helpers.js';

export const projectService = createCrudService(Project, {
  label: 'Project',
  searchFields: ['title', 'description'],
  filterFields: ['status', 'isActive'],
  sortFields: ['title', 'status', 'sortOrder', 'createdAt'],
  defaultOrder: [['sortOrder', 'ASC'], ['id', 'ASC']],
  publicWhere: { isActive: true },
  fileFields: ['image'],
});
