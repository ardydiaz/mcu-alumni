import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

export const createProjectSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(5000).allow('', null),
  image: Joi.string().trim().max(500).allow('', null),
  status: Joi.string().valid('planned', 'ongoing', 'completed'),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
});

export const updateProjectSchema = toUpdateSchema(createProjectSchema);

export const listProjectsQuerySchema = listQuerySchema.keys({
  status: Joi.string().valid('planned', 'ongoing', 'completed'),
  isActive: Joi.boolean(),
});
