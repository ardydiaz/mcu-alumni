import { Joi } from '../../middleware/validation.middleware.js';

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const m365LoginQuerySchema = Joi.object({
  returnTo: Joi.string().trim().max(200),
});

export const m365ExchangeSchema = Joi.object({
  ticket: Joi.string().trim().max(100).required(),
});

// Users may edit their own name and department; email and role are managed by Super Admins.
export const updateProfileSchema = Joi.object({
  fullname: Joi.string().trim().max(150),
  department: Joi.string().trim().max(120).allow('', null),
}).min(1);
