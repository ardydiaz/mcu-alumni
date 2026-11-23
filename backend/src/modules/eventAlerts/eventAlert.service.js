import crypto from 'node:crypto';
import { Op } from 'sequelize';
import { EventAlert } from './eventAlert.model.js';
import { Event } from '../events/event.model.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../utils/mailer.js';
import { logger } from '../../utils/logger.js';
import { createCrudService } from '../../utils/helpers.js';

// Homepage "Notify me" box: visitors leave an email and are told once when a Homecoming event is published.
// Every email carries a one-click unsubscribe link.

const crud = createCrudService(EventAlert, {
  label: 'Subscriber',
  searchFields: ['email'],
  filterFields: ['active'],
  sortFields: ['email', 'createdAt'],
});

const newToken = () => crypto.randomBytes(32).toString('hex');
const unsubscribeLink = (token) => `${env.frontendUrl}/event-alerts/unsubscribe?token=${encodeURIComponent(token)}`;
const SEND_GAP_MS = 250; // Graph allows ~30 messages/minute per mailbox burst; keep a gentle pace
const ANNOUNCE_CATEGORIES = ['homecoming'];

const when = (e) =>
  new Date(e.startAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', ...(e.allDay ? {} : { hour: 'numeric', minute: '2-digit' }) });

function confirm(alert) {
  return sendMail({
    to: alert.email,
    subject: "You're on the list: MCU Alumni Homecoming alerts",
    text:
      'Hi,\n\nThanks for signing up! We will email you as soon as registration for the Grand Alumni Homecoming opens.\n\n' +
      `Upcoming alumni events are always listed at:\n${env.frontendUrl}/events\n\n` +
      `Changed your mind? Stop these emails with one click:\n${unsubscribeLink(alert.unsubscribeToken)}\n\n` +
      'MCU Alumni Relations Office',
  });
}

function announcement(alert, event) {
  const link = `${env.frontendUrl}/events/${event.slug}`;
  return sendMail({
    to: alert.email,
    subject: `Registration is open: ${event.title}`,
    text:
      `Hi,\n\nGood news! ${event.title} is now on the MCU Alumni calendar.\n\n` +
      `When: ${when(event)}\n${event.venue ? `Where: ${event.venue}\n` : ''}${event.onlineUrl ? `Online: ${event.onlineUrl}\n` : ''}` +
      `${event.summary ? `\n${event.summary}\n` : ''}\n` +
      `See the details and register:\n${link}\n\n` +
      `You received this because you asked to be notified on the MCU Alumni website. Unsubscribe:\n${unsubscribeLink(alert.unsubscribeToken)}\n\n` +
      'MCU Alumni Relations Office',
  });
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const eventAlertService = {
  ...crud,

  // Same answer whether or not the address was already on the list, so the form can't be used to check emails.
  async subscribe(email) {
    const existing = await EventAlert.scope('withToken').findOne({ where: { email } });
    if (existing?.active) return;
    const alert = existing
      ? await existing.update({ active: true, unsubscribedAt: null, unsubscribeToken: newToken() })
      : await EventAlert.create({ email, unsubscribeToken: newToken() });
    confirm(alert).catch(() => {}); // background; sendMail never throws
  },

  // Idempotent: an old or repeated link still says "you're unsubscribed".
  async unsubscribe(token) {
    const alert = await EventAlert.scope('withToken').findOne({ where: { unsubscribeToken: token } });
    if (!alert) return { found: false };
    if (alert.active) await alert.update({ active: false, unsubscribedAt: new Date() });
    return { found: true, email: alert.email };
  },

  /**
   * Called after an event is created or updated. A published Homecoming event is announced once:
   * alerts_sent_at is claimed with a conditional UPDATE, so saving the event again (or two staff saving at
   * once) never emails the list twice. Sending runs in the background.
   */
  async announce(event) {
    if (!event || event.status !== 'published' || !ANNOUNCE_CATEGORIES.includes(event.category) || event.alertsSentAt) return;
    if (new Date(event.endAt || event.startAt) < new Date()) return; // past events aren't news
    const [claimed] = await Event.update({ alertsSentAt: new Date() }, { where: { id: event.id, alertsSentAt: null } });
    if (!claimed) return;

    (async () => {
      const subscribers = await EventAlert.scope('withToken').findAll({ where: { active: true } });
      let sent = 0;
      for (const alert of subscribers) {
        const result = await announcement(alert, event);
        if (result.delivered || !env.mail.enabled) {
          sent += 1;
          await alert.update({ lastNotifiedAt: new Date() });
        }
        await pause(SEND_GAP_MS);
      }
      logger.info(`[event-alerts] "${event.title}": announced to ${sent} of ${subscribers.length} subscriber(s)`);
    })().catch((err) => logger.error(`[event-alerts] announce "${event.title}": ${err.message}`));
  },

  async summary() {
    const [active, total] = await Promise.all([EventAlert.count({ where: { active: true } }), EventAlert.count()]);
    return { active, unsubscribed: total - active };
  },

  // CSV of active subscribers, for staff who want to send their own email.
  async exportCsv() {
    const rows = await EventAlert.findAll({ where: { active: true, email: { [Op.ne]: '' } }, order: [['createdAt', 'ASC']] });
    const lines = ['Email,Subscribed,Last notified'];
    const fmt = (d) => (d ? new Date(d).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : '');
    for (const r of rows) lines.push([r.email, fmt(r.createdAt), fmt(r.lastNotifiedAt)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    return `﻿${lines.join('\r\n')}\r\n`;
  },
};
