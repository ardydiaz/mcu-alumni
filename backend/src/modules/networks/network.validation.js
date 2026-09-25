import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

export const createNetworkSchema = Joi.object({
  name: Joi.string().trim().max(200).required(),
  president: Joi.string().trim().max(150).allow('', null),
  description: Joi.string().trim().max(5000).allow('', null),
  logo: Joi.string().trim().max(500).allow('', null),
  contactEmail: Joi.string().trim().email().max(120).allow('', null),
  facebookUrl: Joi.string().trim().uri().max(500).allow('', null),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
});

export const updateNetworkSchema = toUpdateSchema(createNetworkSchema);

export const listNetworksQuerySchema = listQuerySchema.keys({
  isActive: Joi.boolean(),
});
