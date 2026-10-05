import { Joi, listQuerySchema } from '../../middleware/validation.middleware.js';

// Button links: a page on this site ("/give") or a full URL ("https://...").
const link = () =>
  Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .pattern(/^(\/(?!\/)|https?:\/\/)/)
    .messages({ 'string.pattern.base': 'Use a site path like /give or a full https:// link' });

const label = () => Joi.string().trim().max(60).allow('', null);

// Each button needs both its text and its link, or neither. The error is reported
// on the missing field (see `field` in validation.middleware.js).
const BUTTONS = [
  ['primaryLabel', 'primaryLink'],
  ['secondaryLabel', 'secondaryLink'],
];
function buttonsComplete(value, helpers) {
  for (const [text, href] of BUTTONS) {
    if (!(text in value) && !(href in value)) continue; // not being changed (PATCH)
    const hasText = Boolean(value[text]);
    const hasHref = Boolean(value[href]);
    if (hasText !== hasHref) return helpers.error('slide.button', { field: hasText ? href : text });
  }
  return value;
}
const messages = { 'slide.button': 'Add both the button text and its link, or leave both empty' };

const fields = {
  eyebrow: Joi.string().trim().max(80).allow('', null),
  title: Joi.string().trim().max(200),
  subtitle: Joi.string().trim().max(300).allow('', null),
  image: Joi.string().trim().max(500).messages({ 'any.required': 'Upload an image or paste its URL' }),
  primaryLabel: label(),
  primaryLink: link(),
  secondaryLabel: label(),
  secondaryLink: link(),
  sortOrder: Joi.number().integer(),
  isActive: Joi.boolean(),
};

export const createSlideSchema = Joi.object(fields)
  .fork(['title', 'image'], (s) => s.required())
  .custom(buttonsComplete)
  .messages(messages);

// Editing: any subset of fields (the admin form sends all of them).
export const updateSlideSchema = Joi.object(fields).min(1).custom(buttonsComplete).messages(messages);

export const listSlidesQuerySchema = listQuerySchema.keys({
  isActive: Joi.boolean(),
});
