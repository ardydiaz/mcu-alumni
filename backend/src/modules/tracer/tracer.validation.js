import { Joi, listQuerySchema, phone, year } from '../../middleware/validation.middleware.js';
import { SEXES, JOB_CATEGORIES, TIME_AFTER_GRADUATION, FURTHER_STUDIES_TIMING } from '../content/content.data.js';

const yesNo = () => Joi.string().valid('Yes', 'No');
const FULL_NAME_FORMAT = 'Please follow the format: Dela Cruz, Juan Carlo, M.';

// Required only when the graduate is currently employed; dropped otherwise.
const whenEmployed = (schema) => Joi.when('isEmployed', { is: 'Yes', then: schema.required(), otherwise: Joi.any().strip() });

// "If No, choose N/A": the timing must match the further-studies answer.
function furtherStudiesMatch(value, helpers) {
  const na = value.furtherStudiesTiming === 'N/A';
  if (value.furtherStudies === 'No' && !na) return helpers.error('tracer.furtherNa', { field: 'furtherStudiesTiming' });
  if (value.furtherStudies === 'Yes' && na) return helpers.error('tracer.furtherWhen', { field: 'furtherStudiesTiming' });
  return value;
}

// Public Graduate Tracer form.
export const createTracerSchema = Joi.object({
  // Graduate profile
  fullName: Joi.string().trim().max(200).pattern(/^[^,]+,\s*[^,]+/).required().messages({ 'string.pattern.base': FULL_NAME_FORMAT }),
  sex: Joi.string().valid(...SEXES).required(),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  phone: phone().required(),
  address: Joi.string().trim().min(10).max(500).required().messages({
    'string.min': 'Please enter your complete address (house number, street, barangay, city, province and ZIP code)',
  }),
  yearGraduated: year().required(),
  degree: Joi.string().trim().max(150).required(),

  // Employment information
  isEmployed: yesNo().required(),
  employer: whenEmployed(Joi.string().trim().max(150)),
  jobCategories: whenEmployed(
    Joi.array().items(Joi.string().valid(...JOB_CATEGORIES)).min(1).unique().messages({ 'array.min': 'Please choose at least one job category' })
  ),
  jobCategoryOther: Joi.when('isEmployed', {
    is: 'Yes',
    then: Joi.when('jobCategories', {
      is: Joi.array().has('Other').required(), // required: a missing list must not count as "Other"
      then: Joi.string().trim().max(120).required().messages({ 'any.required': 'Please specify your job category', 'string.empty': 'Please specify your job category' }),
      otherwise: Joi.any().strip(),
    }),
    otherwise: Joi.any().strip(),
  }),
  position: whenEmployed(Joi.string().trim().max(120)),
  relatedToDegree: whenEmployed(yesNo()),
  timeToFirstJob: whenEmployed(Joi.string().valid(...TIME_AFTER_GRADUATION)),

  // Additional information
  furtherStudies: yesNo().required(),
  furtherStudiesTiming: Joi.string().valid(...FURTHER_STUDIES_TIMING).required(),

  consent: Joi.boolean().valid(true).required().messages({ 'any.only': 'Please give your consent to continue', 'any.required': 'Please give your consent to continue' }),
})
  .custom(furtherStudiesMatch)
  .messages({
    'tracer.furtherNa': 'Choose N/A if you did not pursue further studies',
    'tracer.furtherWhen': 'Please choose when you started your further studies',
  });

export const listTracerQuerySchema = listQuerySchema.keys({
  degree: Joi.string().trim().max(150),
  yearGraduated: year(),
  isEmployed: Joi.boolean(),
});

export const tracerSummaryQuerySchema = Joi.object({
  degree: Joi.string().trim().max(150),
  yearGraduated: year(),
});
