import { eventService } from './event.service.js';
import { eventToIcs } from './event.ics.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendSuccess } from '../../utils/response.js';

const crud = createCrudController(eventService, { label: 'Event' });

export const eventController = {
  ...crud, // list, create, update, remove (with activity log)

  getByKey: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await eventService.getByKey(req.params.key, { user: req.user }) });
  }),

  // "Add to my calendar"
  ics: asyncHandler(async (req, res) => {
    const event = await eventService.getByKey(req.params.key, { user: req.user });
    res
      .type('text/calendar; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="${event.slug}.ics"`)
      .send(eventToIcs(event));
  }),
};
