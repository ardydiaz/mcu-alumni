import { Partner } from './partner.model.js';
import { createCrudService } from '../../utils/helpers.js';

export const partnerService = createCrudService(Partner, {
  label: 'Partner',
  searchFields: ['name', 'offer'],
  filterFields: ['type', 'isActive'],
  sortFields: ['name', 'type', 'sortOrder', 'validUntil', 'createdAt'],
  defaultOrder: [['sortOrder', 'ASC'], ['name', 'ASC']],
  publicWhere: { isActive: true },
  fileFields: ['logo'],
});
