import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

export const createPartnerSchema = Joi.object({
  type: Joi.string().valid('merchant', 'industry').required(),
  name: Joi.string().trim().max(200).required(),
  offer: Joi.string().trim().max(500).allow('', null),
  validity: Joi.string().trim().max(150).allow('', null),
  validUntil: Joi.date().iso().allow(null),
  logo: Joi.string().trim().max(500).allow('', null),
  website: Joi.string().trim().uri().max(500).allow('', null),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
});

export const updatePartnerSchema = toUpdateSchema(createPartnerSchema);

export const listPartnersQuerySchema = listQuerySchema.keys({
  type: Joi.string().valid('merchant', 'industry'),
  isActive: Joi.boolean(),
});
