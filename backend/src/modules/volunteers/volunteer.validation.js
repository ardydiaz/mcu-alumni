import { Joi, listQuerySchema, phone, year } from '../../middleware/validation.middleware.js';
import { COURSES, VOLUNTEER_ROLES } from '../content/content.data.js';
import { VOLUNTEER_STATUS } from './volunteer.model.js';

export const createVolunteerSchema = Joi.object({
  firstName: Joi.string().trim().max(80).required(),
  lastName: Joi.string().trim().max(80).required(),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  phone: phone().required(),
  course: Joi.string().valid(...COURSES).required(),
  yearGraduated: year().allow('', null).empty(''),
  role: Joi.string().valid(...VOLUNTEER_ROLES).required(),
  expertise: Joi.string().trim().max(250).allow(''),
  message: Joi.string().trim().max(1000).allow(''),
});

export const updateVolunteerSchema = Joi.object({
  status: Joi.string().valid(...VOLUNTEER_STATUS),
  notes: Joi.string().trim().max(2000).allow('', null),
}).min(1);

export const listVolunteersQuerySchema = listQuerySchema.keys({
  status: Joi.string().valid(...VOLUNTEER_STATUS),
  role: Joi.string().valid(...VOLUNTEER_ROLES),
});
