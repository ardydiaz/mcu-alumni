import { Joi, listQuerySchema, toUpdateSchema } from '../../middleware/validation.middleware.js';

const schoolYear = () =>
  Joi.string().trim().pattern(/^SY \d{4} - \d{4}$/).messages({ 'string.pattern.base': 'Use the format "SY 2025 - 2026"' });

export const createReportSchema = Joi.object({
  schoolYear: schoolYear().required(),
  title: Joi.string().trim().max(200).required(),
  periodStart: Joi.date().iso().allow(null),
  fileUrl: Joi.string().trim().max(500).required().messages({ 'any.required': 'Upload a PDF file or provide its URL' }),
  isPublished: Joi.boolean(),
});

export const updateReportSchema = toUpdateSchema(createReportSchema);

export const listReportsQuerySchema = listQuerySchema.keys({
  schoolYear: schoolYear(),
  isPublished: Joi.boolean(),
});
