import { Joi, listQuerySchema, phone, year } from '../../middleware/validation.middleware.js';
import { ACCOUNT_STATUS } from './alumniAccount.model.js';

const email = () => Joi.string().trim().lowercase().email().max(120);

export const registerSchema = Joi.object({
  fullName: Joi.string().trim().max(200).pattern(/^[^,]+,\s*[^,]+/).required()
    .messages({ 'string.pattern.base': 'Please follow the format: Dela Cruz, Juan Carlo, M.' }),
  studentNumber: Joi.string().trim().max(30).pattern(/^[A-Za-z0-9-]+$/).required()
    .messages({ 'string.pattern.base': 'Use letters, numbers and dashes only' }),
  program: Joi.string().trim().max(150).required(),
  yearGraduated: year().required(),
  email: email().required(),
  phone: phone().required(),
  password: Joi.string().min(8).max(128).pattern(/[A-Za-z]/).pattern(/\d/).required()
    .messages({ 'string.min': 'Use at least 8 characters', 'string.pattern.base': 'Use at least one letter and one number' }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' }),
  consent: Joi.boolean().valid(true).required()
    .messages({ 'any.only': 'Please give your consent to continue', 'any.required': 'Please give your consent to continue' }),
});

export const verifyEmailSchema = Joi.object({ token: Joi.string().trim().max(200).required() });

export const resendSchema = Joi.object({ email: email().required() });

export const loginSchema = Joi.object({
  email: email().required(),
  password: Joi.string().max(128).required(),
});

// Staff: Alumni accounts page
export const listAccountsQuerySchema = listQuerySchema.keys({
  status: Joi.string().valid(...ACCOUNT_STATUS),
  yearGraduated: year(),
});

export const rejectSchema = Joi.object({ reason: Joi.string().trim().max(500).allow('') });
