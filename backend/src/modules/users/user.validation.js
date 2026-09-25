import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

export const USER_STATUS = ['pending', 'active', 'inactive'];

export const createUserSchema = Joi.object({
  fullname: Joi.string().trim().max(150).required(),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  roleId: Joi.number().integer().min(1).required().messages({ 'any.required': 'Choose a role' }),
  department: Joi.string().trim().max(120).allow('', null),
  status: Joi.string().valid(...USER_STATUS).default('active'),
});

export const updateUserSchema = toUpdateSchema(createUserSchema);

export const approveUserSchema = Joi.object({
  roleId: Joi.number().integer().min(1).required().messages({ 'any.required': 'Choose a role' }),
  department: Joi.string().trim().max(120).allow('', null),
});

export const listUsersQuerySchema = listQuerySchema.keys({
  roleId: Joi.number().integer().min(1),
  status: Joi.string().valid(...USER_STATUS),
});
