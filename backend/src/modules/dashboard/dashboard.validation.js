import { Joi } from '../../middleware/validation.middleware.js';

export const recentActivityQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(5),
});
