import { networkService } from './network.service.js';
import { createCrudController } from '../../utils/helpers.js';

export const networkController = createCrudController(networkService, { label: 'Network' });
