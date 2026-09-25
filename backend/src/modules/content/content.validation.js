import { Joi } from '../../middleware/validation.middleware.js';

export const sectionParamSchema = Joi.object({
  section: Joi.string().trim().pattern(/^[a-z-]{2,40}$/).required(),
});
