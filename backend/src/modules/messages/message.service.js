import { Op } from 'sequelize';
import { Message } from './message.model.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../utils/mailer.js';
import { logger } from '../../utils/logger.js';
import { createCrudService } from '../../utils/helpers.js';

const crud = createCrudService(Message, {
  label: 'Message',
  searchFields: ['name', 'email', 'subject', 'message'],
  filterFields: ['isRead'],
  sortFields: ['name', 'createdAt'],
});

const AUTO_REPLY_EVERY_MINUTES = 60; // at most one confirmation per email address per hour (the form can't flood an inbox)
const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';
const quote = (text, max = 1500) => (text.length > max ? `${text.slice(0, max)}…` : text);

// 1. The Alumni Relations Office is told about the new message. "Reply" in Outlook goes straight to the sender.
function notifyOffice(m) {
  const subject = `New message from ${m.name}${m.subject ? `: ${m.subject}` : ''}`;
  const text =
    `${m.name} sent a message through the MCU Alumni website.\n\n` +
    `From: ${m.name} <${m.email}>\n` +
    `${m.subject ? `Subject: ${m.subject}\n` : ''}` +
    `Received: ${new Date(m.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}\n\n` +
    `${quote(m.message, 5000)}\n\n` +
    `Reply to this email to answer ${firstName(m.name)} directly, or open it in the admin panel:\n${env.frontendUrl}/admin/messages`;
  return env.mail.messageNotify.map((to) => sendMail({ to, subject, text, replyTo: { address: m.email, name: m.name } }));
}

// 2. The sender gets a confirmation that the message arrived.
async function confirmToSender(m) {
  const since = new Date(Date.now() - AUTO_REPLY_EVERY_MINUTES * 60000);
  const recent = await Message.count({ where: { email: m.email, createdAt: { [Op.gte]: since }, id: { [Op.ne]: m.id } } });
  if (recent) return null; // already confirmed recently
  return sendMail({
    to: m.email,
    subject: 'We received your message — MCU Alumni Relations Office',
    text:
      `Hi ${firstName(m.name)},\n\n` +
      'Thank you for contacting the MCU Alumni Relations Office. We received your message and will get back to you within 2–3 working days.\n\n' +
      `Your message${m.subject ? ` (${m.subject})` : ''}:\n"${quote(m.message)}"\n\n` +
      'If you need to add something, simply reply to this email.\n\n' +
      'MCU Alumni Relations Office\nalumni@mcu.edu.ph · (+63) 917 104 6520',
    replyTo: { address: env.mail.messageNotify[0] || 'alumni@mcu.edu.ph', name: 'MCU Alumni Relations Office' },
  });
}

export const messageService = {
  ...crud,

  async create(data) {
    const message = await Message.create(data);
    // Emails go out in the background so the form answers right away; sendMail never throws.
    Promise.allSettled([...notifyOffice(message), confirmToSender(message)]).catch((err) => logger.error(`[messages] email: ${err.message}`));
    return { id: message.id };
  },

  async update(id, { isRead }) {
    const message = await crud.getById(id, { internal: true });
    return message.update({ isRead, readAt: isRead ? message.readAt || new Date() : null });
  },
};
