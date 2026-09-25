import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

export const createScholarSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  college: Joi.string().trim().max(150).required(),
  yearLevel: Joi.string().trim().max(40).allow('', null),
  story: Joi.string().trim().max(5000).allow('', null),
  image: Joi.string().trim().max(500).allow('', null),
  videoUrl: Joi.string().trim().uri().max(500).allow('', null),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
});

export const updateScholarSchema = toUpdateSchema(createScholarSchema);

export const listScholarsQuerySchema = listQuerySchema.keys({
  college: Joi.string().trim().max(150),
  isActive: Joi.boolean(),
});
