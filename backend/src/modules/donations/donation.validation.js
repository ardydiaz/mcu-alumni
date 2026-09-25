import { Joi, listQuerySchema, phone } from '../../middleware/validation.middleware.js';
import { COURSES } from '../content/content.data.js';
import { DONATION_STATUS } from './donation.model.js';

// Public pledge form on the Give page.
export const createDonationSchema = Joi.object({
  campaignId: Joi.number().integer().min(1).required().messages({ 'any.required': 'Please choose a campaign' }),
  firstName: Joi.string().trim().max(80).required(),
  lastName: Joi.string().trim().max(80).required(),
  email: Joi.string().trim().lowercase().email().max(120).required(),
  phone: phone().required(),
  course: Joi.string().valid(...COURSES).required(),
  country: Joi.string().trim().max(80).required(),
  city: Joi.string().trim().max(80).required(),
  // Accepts "1,000" as well as 1000.
  amount: Joi.alternatives()
    .try(Joi.number(), Joi.string().trim().replace(/,/g, '').pattern(/^\d+(\.\d{1,2})?$/))
    .required()
    .custom((value, helpers) => {
      const n = Number(value);
      return n >= 1 && n <= 100_000_000 ? n : helpers.error('number.min', { limit: 1 });
    })
    .messages({ 'alternatives.match': 'Enter a valid amount' }),
  currency: Joi.string().valid('PHP', 'USD').default('PHP'),
  message: Joi.string().trim().max(1000).allow(''),
});

// Staff updating a pledge after checking the bank deposit.
export const updateDonationSchema = Joi.object({
  status: Joi.string().valid(...DONATION_STATUS),
  referenceNo: Joi.string().trim().max(80).allow('', null),
  notes: Joi.string().trim().max(2000).allow('', null),
  amount: Joi.number().min(1),
}).min(1);

export const listDonationsQuerySchema = listQuerySchema.keys({
  status: Joi.string().valid(...DONATION_STATUS),
  campaignId: Joi.number().integer().min(1),
  currency: Joi.string().valid('PHP', 'USD'),
});
