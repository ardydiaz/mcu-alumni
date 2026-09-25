import { Network } from './network.model.js';
import { createCrudService } from '../../utils/helpers.js';

export const networkService = createCrudService(Network, {
  label: 'Network',
  searchFields: ['name', 'president'],
  filterFields: ['isActive'],
  sortFields: ['name', 'sortOrder', 'createdAt'],
  defaultOrder: [['sortOrder', 'ASC'], ['id', 'ASC']],
  publicWhere: { isActive: true },
  fileFields: ['logo'],
});
