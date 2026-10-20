import { fn, col } from 'sequelize';
import { Event, EventRegistration } from './event.model.js';
import { AlumniAccount } from '../portal/alumniAccount.model.js';
import { AlumniProfile } from '../profiles/profile.model.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../utils/mailer.js';
import { ApiError } from '../../utils/helpers.js';

// Event registrations through the Alumni Portal (Step 11: monitor event registrations).
// Alumni register from the event page or their dashboard; EAO sees who registered, marks attendance, exports.

const ACTIVE = ['registered', 'attended']; // count towards capacity

const when = (e) =>
  new Date(e.startAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', ...(e.allDay ? {} : { hour: 'numeric', minute: '2-digit' }) });
const first = (fullName = '') => (fullName.split(',')[1] || fullName).trim().split(/\s+/)[0];

// Why registration is closed (or null when open).
export function closedReason(event, taken, now = new Date()) {
  if (!event.portalRegistration) return 'Registration is not done through the Alumni Portal for this event.';
  if (event.status !== 'published') return event.status === 'cancelled' ? 'This event was cancelled.' : 'This event is not open yet.';
  if (new Date(event.endAt || event.startAt) < now) return 'This event has ended.';
  if (event.registrationDeadline && new Date(event.registrationDeadline) < now) return 'Registration for this event has closed.';
  if (event.capacity && taken >= event.capacity) return 'This event is full.';
  return null;
}

export const eventRegistrations = {
  // { eventId: number of active registrations }
  async counts(eventIds) {
    if (!eventIds.length) return {};
    const rows = await EventRegistration.findAll({
      where: { eventId: eventIds, status: ACTIVE },
      attributes: ['eventId', [fn('COUNT', col('id')), 'count']],
      group: ['eventId'],
      raw: true,
    });
    return Object.fromEntries(rows.map((r) => [r.eventId, Number(r.count)]));
  },

  // Adds registeredCount / spotsLeft / registrationClosed to events for the calendar and detail pages.
  async decorate(events) {
    const list = Array.isArray(events) ? events : [events];
    const counts = await this.counts(list.map((e) => e.id));
    for (const e of list) {
      const taken = counts[e.id] || 0;
      e.setDataValue('registeredCount', taken);
      e.setDataValue('spotsLeft', e.capacity ? Math.max(0, e.capacity - taken) : null);
      e.setDataValue('registrationClosed', closedReason(e, taken));
    }
    return events;
  },

  // ---- Alumni ----
  async mine(accountId) {
    const rows = await EventRegistration.findAll({ where: { alumniAccountId: accountId, status: ACTIVE }, attributes: ['eventId', 'status', 'createdAt'] });
    return rows;
  },

  async register(account, eventId) {
    if (account.status !== 'verified') throw ApiError.forbidden('Event registration opens once the Alumni Relations Office verifies your account.');
    const event = await Event.findByPk(eventId);
    if (!event || !['published', 'cancelled'].includes(event.status)) throw ApiError.notFound('Event not found');
    const existing = await EventRegistration.findOne({ where: { eventId, alumniAccountId: account.id } });
    if (existing && ACTIVE.includes(existing.status)) return { registration: existing, event, already: true };
    const taken = (await this.counts([event.id]))[event.id] || 0;
    const closed = closedReason(event, taken);
    if (closed) throw ApiError.conflict(closed);

    const registration = existing
      ? await existing.update({ status: 'registered', cancelledAt: null })
      : await EventRegistration.create({ eventId, alumniAccountId: account.id });
    const link = `${env.frontendUrl}/events/${event.slug}`;
    await sendMail({
      to: account.email,
      subject: `You're registered: ${event.title}`,
      text:
        `Hi ${first(account.fullName)},\n\nYou're registered for ${event.title}.\n\n` +
        `When: ${when(event)}\n${event.venue ? `Where: ${event.venue}\n` : ''}${event.onlineUrl ? `Online: ${event.onlineUrl}\n` : ''}\n` +
        `Event details and calendar file:\n${link}\n\nCan't make it? You can cancel your registration from the event page.\n\nMCU Alumni Relations Office`,
    });
    return { registration, event, already: false };
  },

  async cancel(account, eventId) {
    const registration = await EventRegistration.findOne({ where: { eventId, alumniAccountId: account.id, status: 'registered' } });
    if (!registration) throw ApiError.notFound('You are not registered for this event.');
    await registration.update({ status: 'cancelled', cancelledAt: new Date() });
    return registration;
  },

  // ---- Staff ----
  async list(eventId, { status, search } = {}) {
    const event = await Event.findByPk(eventId);
    if (!event) throw ApiError.notFound('Event not found');
    const registrations = await EventRegistration.findAll({ where: { eventId, ...(status && { status }) }, order: [['createdAt', 'ASC']] });
    const accountIds = registrations.map((r) => r.alumniAccountId);
    const [accounts, profiles] = await Promise.all([
      AlumniAccount.findAll({ where: { id: accountIds } }),
      AlumniProfile.findAll({ where: { alumniAccountId: accountIds }, attributes: ['id', 'alumniAccountId', 'alumniNumber'] }),
    ]);
    const acc = new Map(accounts.map((a) => [a.id, a]));
    const prof = new Map(profiles.map((p) => [p.alumniAccountId, p]));
    const term = (search || '').trim().toLowerCase();
    const rows = registrations
      .map((r) => {
        const a = acc.get(r.alumniAccountId);
        const p = prof.get(r.alumniAccountId);
        return {
          id: r.id,
          status: r.status,
          registeredAt: r.createdAt,
          attendedAt: r.attendedAt,
          cancelledAt: r.cancelledAt,
          accountId: r.alumniAccountId,
          profileId: p?.id || null,
          alumniNumber: p?.alumniNumber || null,
          fullName: a?.fullName || '(account removed)',
          studentNumber: a?.studentNumber,
          program: a?.program,
          yearGraduated: a?.yearGraduated,
          email: a?.email,
          phone: a?.phone,
        };
      })
      .filter((r) => !term || `${r.fullName} ${r.email} ${r.studentNumber} ${r.program}`.toLowerCase().includes(term));
    const counts = { registered: 0, attended: 0, cancelled: 0 };
    for (const r of registrations) counts[r.status] = (counts[r.status] || 0) + 1;
    const e = event;
    return {
      event: { id: e.id, title: e.title, slug: e.slug, capacity: e.capacity, startAt: e.startAt, endAt: e.endAt, allDay: e.allDay, venue: e.venue, status: e.status, portalRegistration: e.portalRegistration, registrationDeadline: e.registrationDeadline },
      counts,
      rows,
    };
  },

  async setStatus(eventId, registrationId, status) {
    const registration = await EventRegistration.findOne({ where: { id: registrationId, eventId } });
    if (!registration) throw ApiError.notFound('Registration not found');
    await registration.update({
      status,
      attendedAt: status === 'attended' ? registration.attendedAt || new Date() : null,
      cancelledAt: status === 'cancelled' ? registration.cancelledAt || new Date() : null,
    });
    return registration;
  },

  // Many at once (e.g. mark everyone selected as attended). Only this event's registrations are touched.
  async setStatusMany(eventId, ids, status) {
    const rows = await EventRegistration.findAll({ where: { id: ids, eventId } });
    for (const r of rows) {
      if (r.status === status) continue;
      await r.update({
        status,
        attendedAt: status === 'attended' ? r.attendedAt || new Date() : null,
        cancelledAt: status === 'cancelled' ? r.cancelledAt || new Date() : null,
      });
    }
    return rows.length;
  },

  async exportCsv(eventId) {
    const { event, rows } = await this.list(eventId);
    const date = (d) => (d ? new Date(d).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '');
    const header = ['Name', 'Alumni No.', 'Student No.', 'Program', 'Year', 'Email', 'Contact No.', 'Status', 'Registered', 'Attended'];
    const lines = rows.map((r) => [r.fullName, r.alumniNumber, r.studentNumber, r.program, r.yearGraduated, r.email, r.phone, r.status, date(r.registeredAt), date(r.attendedAt)]);
    const cell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return { event, csv: `﻿${[header, ...lines].map((l) => l.map(cell).join(',')).join('\r\n')}\r\n` };
  },
};
