import Joi from 'joi';
import { ApiError } from '../utils/helpers.js';

// Friendly messages shown under form fields on the frontend.
const messages = {
  'any.required': 'This field is required',
  'string.empty': 'This field is required',
  'any.only': 'Choose a valid option',
  'string.email': 'Enter a valid email address',
  'string.max': 'Must be at most {#limit} characters',
  'string.min': 'Must be at least {#limit} characters',
  'string.pattern.base': 'Enter a valid value',
  'number.base': 'Must be a number',
  'number.min': 'Must be at least {#limit}',
  'number.max': 'Must be at most {#limit}',
  'number.integer': 'Must be a whole number',
  'date.base': 'Enter a valid date',
  'boolean.base': 'Must be true or false',
};

/**
 * Validates req[source] against a Joi schema. Unknown keys are stripped and
 * values are converted (e.g. "2020" -> 2020). On failure responds 422 with
 * { errors: { field: message } }.
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const { value, error } = schema.validate(req[source] ?? {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      messages,
      errors: { wrap: { label: false } },
    });

    if (error) {
      const errors = {};
      for (const detail of error.details) {
        const key = detail.path.join('.') || detail.context?.key || '_';
        errors[key] ??= detail.message;
      }
      return next(ApiError.unprocessable(undefined, errors));
    }

    req[source] = value;
    next();
  };

// ---- Shared schema pieces -------------------------------------------------

export const idParamSchema = Joi.object({ id: Joi.number().integer().min(1).required() });

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(100).allow(''),
  sort: Joi.string().trim().max(50),
  order: Joi.string().valid('asc', 'desc', 'ASC', 'DESC'),
});

export const phone = () => Joi.string().trim().pattern(/^[+\d][\d\s()-]{6,19}$/).messages({ 'string.pattern.base': 'Enter a valid phone number' });

export const year = () => Joi.number().integer().min(1904).max(new Date().getFullYear() + 1).messages({ 'number.min': 'Enter a valid year', 'number.max': 'Enter a valid year' });

// Makes every key of a create schema optional for PATCH, requiring at least one.
export const toUpdateSchema = (schema) => schema.fork(Object.keys(schema.describe().keys), (s) => s.optional()).min(1);

export { Joi };
