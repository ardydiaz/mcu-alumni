import { Message } from './message.model.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(Message, {
  label: 'Message',
  searchFields: ['name', 'email', 'subject', 'message'],
  filterFields: ['isRead'],
  sortFields: ['name', 'createdAt'],
});

export const messageService = {
  ...crud,

  async create(data) {
    const message = await Message.create(data);
    return { id: message.id };
  },

  async update(id, { isRead }) {
    const message = await crud.getById(id, { internal: true });
    return message.update({ isRead, readAt: isRead ? message.readAt || new Date() : null });
  },
};
