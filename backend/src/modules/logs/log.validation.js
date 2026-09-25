import { Joi, listQuerySchema } from '../../middleware/validation.middleware.js';
import { LOG_ACTIONS } from './log.model.js';

export const listLogsQuerySchema = listQuerySchema.keys({
  action: Joi.string().valid(...LOG_ACTIONS),
  entity: Joi.string().trim().max(50),
  userId: Joi.number().integer().min(1),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
});
