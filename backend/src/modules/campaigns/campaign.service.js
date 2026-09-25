import { Campaign } from './campaign.model.js';
import { createCrudService } from '../../utils/helpers.js';

export const campaignService = createCrudService(Campaign, {
  label: 'Campaign',
  searchFields: ['title', 'area', 'description'],
  filterFields: ['slug', 'area', 'isActive'],
  sortFields: ['title', 'area', 'sortOrder', 'createdAt'],
  defaultOrder: [['sortOrder', 'ASC'], ['id', 'ASC']],
  publicWhere: { isActive: true },
});
