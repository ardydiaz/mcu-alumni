import { eventService } from './event.service.js';
import { eventToIcs } from './event.ics.js';
import { eventRegistrations } from './event.registration.js';
import { logService } from '../logs/log.service.js';
import { asyncHandler, createCrudController } from '../../utils/helpers.js';
import { sendSuccess } from '../../utils/response.js';

const crud = createCrudController(eventService, { label: 'Event' });

export const eventController = {
  ...crud, // list, create, update, remove (with activity log)

  getByKey: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await eventService.getByKey(req.params.key, { user: req.user }) });
  }),

  // ---- Registrations (staff) ----
  registrations: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await eventRegistrations.list(req.params.id, req.query) });
  }),

  setRegistrationStatus: asyncHandler(async (req, res) => {
    const r = await eventRegistrations.setStatus(req.params.id, req.params.registrationId, req.body.status);
    sendSuccess(res, { data: r, message: r.status === 'attended' ? 'Marked as attended' : r.status === 'cancelled' ? 'Registration cancelled' : 'Marked as registered' });
  }),

  exportRegistrations: asyncHandler(async (req, res) => {
    const { event, csv } = await eventRegistrations.exportCsv(req.params.id);
    await logService.record(req, { action: 'export', entity: 'Event', entityId: event.id, description: `Exported the registrants of ${event.title}` });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="registrants-${event.id}.csv"`);
    res.send(csv);
  }),

  // ---- Registrations (alumni, portal) ----
  myRegistrations: asyncHandler(async (req, res) => {
    sendSuccess(res, { data: await eventRegistrations.mine(req.alumni.id) });
  }),

  register: asyncHandler(async (req, res) => {
    const { event, already } = await eventRegistrations.register(req.alumni, req.params.id);
    sendSuccess(res, { data: await eventService.getByKey(String(event.id), {}), message: already ? "You're already registered" : `You're registered for ${event.title}. We sent the details to your email.` });
  }),

  cancelRegistration: asyncHandler(async (req, res) => {
    await eventRegistrations.cancel(req.alumni, req.params.id);
    sendSuccess(res, { message: 'Your registration was cancelled' });
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
