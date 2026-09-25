import { Joi, listQuerySchema } from '../../middleware/validation.middleware.js';

export const createMessageSchema = Joi.object({
  name: Joi.string().trim().max(120).required(),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  subject: Joi.string().trim().max(150).allow(''),
  message: Joi.string().trim().max(2000).required(),
});

export const updateMessageSchema = Joi.object({
  isRead: Joi.boolean().required(),
});

export const listMessagesQuerySchema = listQuerySchema.keys({
  isRead: Joi.boolean(),
});
