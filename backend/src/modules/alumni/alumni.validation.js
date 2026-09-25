import { Joi, listQuerySchema, phone, year } from '../../middleware/validation.middleware.js';
import { COURSES } from '../content/content.data.js';
import { ALUMNI_ID_STATUS } from './alumni.model.js';

// Public "Alumni Contact Update" form.
export const createAlumniSchema = Joi.object({
  firstName: Joi.string().trim().max(80).required(),
  middleName: Joi.string().trim().max(80).allow(''),
  lastName: Joi.string().trim().max(80).required(),
  maidenName: Joi.string().trim().max(80).allow(''),
  birthDate: Joi.date().iso().max('now').allow('', null),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  phone: phone().required(),
  address: Joi.string().trim().max(250).required(),
  city: Joi.string().trim().max(80).required(),
  country: Joi.string().trim().max(80).required(),
  studentNumber: Joi.string().trim().max(30).allow(''),
  course: Joi.string().valid(...COURSES).required(),
  yearGraduated: year().required(),
  employer: Joi.string().trim().max(150).allow(''),
  position: Joi.string().trim().max(120).allow(''),
  requestAlumniId: Joi.boolean().default(false),
  consent: Joi.boolean().valid(true).required().messages({ 'any.only': 'Please give your consent to continue', 'any.required': 'Please give your consent to continue' }),
});

export const updateAlumniSchema = Joi.object({
  alumniIdStatus: Joi.string().valid(...ALUMNI_ID_STATUS),
  notes: Joi.string().trim().max(2000).allow('', null),
}).min(1);

export const listAlumniQuerySchema = listQuerySchema.keys({
  alumniIdStatus: Joi.string().valid(...ALUMNI_ID_STATUS),
  course: Joi.string().valid(...COURSES),
  yearGraduated: year(),
});
