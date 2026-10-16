import { Joi, listQuerySchema } from '../../middleware/validation.middleware.js';
import { EVENT_CATEGORIES, EVENT_STATUS } from './event.model.js';

// Optional values may arrive as '' (forms) or null (cleared); the service stores both as NULL.
const optional = (schema) => schema.allow('', null);
const url = () => optional(Joi.string().trim().max(500).uri({ scheme: ['http', 'https'] })).messages({ 'string.uri': 'Use a full link starting with https://' });
const dateTime = () => Joi.date().iso().messages({ 'date.format': 'Enter a valid date and time', 'date.base': 'Enter a valid date and time' });

// End after start; registration closes before the event ends.
function datesInOrder(value, helpers) {
  const { startAt, endAt, registrationDeadline } = value;
  if (startAt && endAt && new Date(endAt) < new Date(startAt)) return helpers.error('event.end', { field: 'endAt' });
  const last = endAt || startAt;
  if (last && registrationDeadline && new Date(registrationDeadline) > new Date(last)) return helpers.error('event.deadline', { field: 'registrationDeadline' });
  return value;
}
const messages = {
  'event.end': 'The event must end after it starts',
  'event.deadline': 'Registration must close before the event ends',
};

const fields = {
  title: Joi.string().trim().max(200),
  summary: optional(Joi.string().trim().max(300)),
  description: optional(Joi.string().trim().max(10000)),
  category: Joi.string().valid(...EVENT_CATEGORIES),
  startAt: dateTime(),
  endAt: optional(dateTime()),
  allDay: Joi.boolean(),
  venue: optional(Joi.string().trim().max(200)),
  onlineUrl: url(),
  image: optional(Joi.string().trim().max(500)),
  registrationDeadline: optional(dateTime()),
  capacity: optional(Joi.number().integer().min(1).max(100000)),
  registrationUrl: url(),
  networkId: optional(Joi.number().integer().min(1)),
  status: Joi.string().valid(...EVENT_STATUS),
};

export const createEventSchema = Joi.object(fields)
  .fork(['title', 'category', 'startAt'], (s) => s.required())
  .custom(datesInOrder)
  .messages(messages);

export const updateEventSchema = Joi.object(fields).min(1).custom(datesInOrder).messages(messages);

export const listEventsQuerySchema = listQuerySchema.keys({
  category: Joi.string().valid(...EVENT_CATEGORIES),
  status: Joi.string().valid(...EVENT_STATUS), // staff only
  networkId: Joi.number().integer().min(1),
  from: Joi.date().iso(), // events that overlap [from, to]
  to: Joi.date().iso(),
  upcoming: Joi.boolean(), // not yet ended
});

// Public URLs use the slug; the admin panel uses the numeric id.
export const eventKeySchema = Joi.object({ key: Joi.string().trim().max(220).pattern(/^[a-z0-9-]+$/).required() });
