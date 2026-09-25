import { Volunteer } from './volunteer.model.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(Volunteer, {
  label: 'Volunteer',
  searchFields: ['firstName', 'lastName', 'email', 'expertise'],
  filterFields: ['status', 'role'],
  sortFields: ['lastName', 'role', 'status', 'createdAt'],
});

export const volunteerService = {
  ...crud,

  async create(data) {
    const volunteer = await Volunteer.create(data);
    return { id: volunteer.id, role: volunteer.role };
  },
};
