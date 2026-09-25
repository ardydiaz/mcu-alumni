import { Joi, listQuerySchema, phone, year } from '../../middleware/validation.middleware.js';
import { COURSES, EMPLOYMENT_STATUS, TIME_TO_FIRST_JOB, INCOME_RANGES } from '../content/content.data.js';

const optionalChoice = (options) => Joi.string().valid(...options).allow('');

export const createTracerSchema = Joi.object({
  firstName: Joi.string().trim().max(80).required(),
  lastName: Joi.string().trim().max(80).required(),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  phone: phone().required(),
  course: Joi.string().valid(...COURSES).required(),
  yearGraduated: year().required(),
  employmentStatus: Joi.string().valid(...EMPLOYMENT_STATUS).required(),
  employer: Joi.string().trim().max(150).allow(''),
  position: Joi.string().trim().max(120).allow(''),
  industry: Joi.string().trim().max(120).allow(''),
  workLocation: Joi.string().trim().max(120).allow(''),
  relatedToCourse: Joi.string().valid('Yes', 'No').allow(''),
  timeToFirstJob: optionalChoice(TIME_TO_FIRST_JOB),
  monthlyIncome: optionalChoice(INCOME_RANGES),
  licensure: Joi.string().trim().max(150).allow(''),
  feedback: Joi.string().trim().max(2000).allow(''),
  consent: Joi.boolean().valid(true).required().messages({ 'any.only': 'Please give your consent to continue', 'any.required': 'Please give your consent to continue' }),
});

export const listTracerQuerySchema = listQuerySchema.keys({
  course: Joi.string().valid(...COURSES),
  yearGraduated: year(),
  employmentStatus: Joi.string().valid(...EMPLOYMENT_STATUS),
});

export const tracerSummaryQuerySchema = Joi.object({
  course: Joi.string().valid(...COURSES),
  yearGraduated: year(),
});
