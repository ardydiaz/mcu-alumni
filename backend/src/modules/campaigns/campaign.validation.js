import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

export const createCampaignSchema = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).required()
    .messages({ 'string.pattern.base': 'Use lowercase letters, numbers and dashes only' }),
  title: Joi.string().trim().max(150).required(),
  area: Joi.string().trim().max(80).required(),
  description: Joi.string().trim().max(2000).allow('', null),
  goalAmount: Joi.number().min(0).allow(null),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
});

export const updateCampaignSchema = toUpdateSchema(createCampaignSchema);

export const listCampaignsQuerySchema = listQuerySchema.keys({
  slug: Joi.string().trim().max(80),
  area: Joi.string().trim().max(80),
  isActive: Joi.boolean(),
});
