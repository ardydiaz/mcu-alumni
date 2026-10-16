import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AlumniAccount } from './alumniAccount.model.js';
import { AlumniProfile, ProfileChange } from '../profiles/profile.model.js';
import { createEmailToken, hashPassword, hashToken, signAlumniToken } from './portal.security.js';
import { sendMail } from '../../utils/mailer.js';
import { ApiError } from '../../utils/helpers.js';

// Portal invitations: graduates whose record is already in the alumni database (imported from the Registrar
// or encoded by EAO) get a personal link by email. Opening it, they set a password and their Alumni Portal
// account is created already verified and linked to that record: no registration form, no staff review.
// Safe because the link only goes to the email on the official record, expires, and works once.

export const INVITE_DAYS = 14;
const CONCURRENCY = 5;

// not_invited | invited | expired | claimed | no_email
export function inviteStatus(p, now = new Date()) {
  if (p.alumniAccountId) return 'claimed';
  if (!p.email) return 'no_email';
  if (!p.invitedAt) return 'not_invited';
  return p.inviteExpiresAt && new Date(p.inviteExpiresAt) < now ? 'expired' : 'invited';
}

// Query filter for the profiles list (?invite=...)
export function inviteWhere(status, now = new Date()) {
  switch (status) {
    case 'claimed': return { alumniAccountId: { [Op.ne]: null } };
    case 'no_email': return { alumniAccountId: null, email: null };
    case 'not_invited': return { alumniAccountId: null, email: { [Op.ne]: null }, invitedAt: null };
    case 'invited': return { alumniAccountId: null, email: { [Op.ne]: null }, invitedAt: { [Op.ne]: null }, inviteExpiresAt: { [Op.gte]: now } };
    case 'expired': return { alumniAccountId: null, email: { [Op.ne]: null }, invitedAt: { [Op.ne]: null }, inviteExpiresAt: { [Op.lt]: now } };
    default: return {};
  }
}

const greeting = (p) => p.firstName.split(/\s+/)[0];
const accountName = (p) => `${p.surname}${p.suffix ? ` ${p.suffix}` : ''}, ${p.firstName}${p.middleName ? ` ${p.middleName[0]}.` : ''}`;
const scopeWhere = ({ profileIds, importBatchId, yearGraduated } = {}) => ({
  ...(profileIds?.length && { id: profileIds }),
  ...(importBatchId && { importBatchId }),
  ...(yearGraduated && { yearGraduated }),
});

function inviteEmail(p, token) {
  const link = `${env.frontendUrl}/portal/activate?token=${encodeURIComponent(token)}`;
  return {
    to: p.email,
    subject: 'Activate your MCU Alumni Portal account',
    text:
      `Hi ${greeting(p)},\n\n` +
      `Congratulations, Centralino! Your record as a ${p.program} graduate (${p.yearGraduated}) is now in the MCU alumni database` +
      `${p.alumniNumber ? `, with Alumni Number ${p.alumniNumber}` : ''}.\n\n` +
      `Set your password to activate your Alumni Portal account. Your profile is already filled in:\n${link}\n\n` +
      `This link is only for you and expires in ${INVITE_DAYS} days. If it expires, you can still register at ${env.frontendUrl}/portal/register with your Student No. ${p.studentNumber}.\n\n` +
      'If you are not this graduate, please ignore this email.\n\nMCU Alumni Relations Office',
  };
}

// Runs `fn` over `items`, a few at a time (Microsoft 365 sends one message per request).
async function pool(items, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}

export const portalInvite = {
  // Counts per invitation status, for one import, one batch year, or everyone.
  async summary(scope = {}) {
    const profiles = await AlumniProfile.findAll({ where: scopeWhere(scope), attributes: ['id', 'alumniAccountId', 'email', 'studentNumber', 'invitedAt', 'inviteExpiresAt'] });
    const counts = { total: profiles.length, not_invited: 0, invited: 0, expired: 0, claimed: 0, no_email: 0, registered: 0 };
    const registered = await this.registeredKeys(profiles.filter((p) => !p.alumniAccountId));
    for (const p of profiles) {
      if (!p.alumniAccountId && registered.has(p.id)) counts.registered += 1;
      else counts[inviteStatus(p)] += 1;
    }
    return counts;
  },

  // Profiles whose student number or email already has a portal account (registered on their own and
  // waiting for review): they are linked when staff verify them, so they are not invited.
  async registeredKeys(profiles) {
    if (!profiles.length) return new Set();
    const accounts = await AlumniAccount.findAll({
      where: { [Op.or]: [{ studentNumber: profiles.map((p) => p.studentNumber) }, { email: profiles.map((p) => p.email).filter(Boolean) }] },
      attributes: ['studentNumber', 'email'],
    });
    const numbers = new Set(accounts.map((a) => a.studentNumber));
    const emails = new Set(accounts.map((a) => a.email));
    return new Set(profiles.filter((p) => numbers.has(p.studentNumber) || (p.email && emails.has(p.email))).map((p) => p.id));
  },

  /**
   * Emails invitations. scope: { profileIds?, importBatchId?, yearGraduated? }; resend: also those invited
   * before who haven't activated yet (they get a new link; the old one stops working).
   */
  async send(scope, { resend = false } = {}, actor) {
    const profiles = await AlumniProfile.scope('withInvite').findAll({ where: scopeWhere(scope) });
    const skipped = { claimed: 0, no_email: 0, already_invited: 0, registered: 0, shared_email: 0 };
    const registered = await this.registeredKeys(profiles.filter((p) => !p.alumniAccountId));

    // One account per email: when several graduates share an email we can't tell whose it is, so none is invited.
    const byEmail = new Map();
    for (const p of profiles) if (p.email && !p.alumniAccountId) byEmail.set(p.email, (byEmail.get(p.email) || 0) + 1);

    const targets = [];
    for (const p of profiles) {
      const status = inviteStatus(p);
      if (status === 'claimed') skipped.claimed += 1;
      else if (status === 'no_email') skipped.no_email += 1;
      else if (registered.has(p.id)) skipped.registered += 1;
      else if (byEmail.get(p.email) > 1) skipped.shared_email += 1;
      else if (status === 'invited' && !resend) skipped.already_invited += 1;
      else targets.push(p);
    }

    let sent = 0;
    const failed = [];
    await pool(targets, async (p) => {
      const { token, hash, expiresAt } = createEmailToken(INVITE_DAYS * 24);
      const previous = { inviteTokenHash: p.inviteTokenHash, inviteExpiresAt: p.inviteExpiresAt, invitedAt: p.invitedAt }; // an earlier link keeps working
      await AlumniProfile.update({ inviteTokenHash: hash, inviteExpiresAt: expiresAt, invitedAt: new Date(), inviteCount: p.inviteCount + 1 }, { where: { id: p.id } });
      const result = await sendMail(inviteEmail(p, token));
      if (result.delivered || !env.mail.enabled) {
        sent += 1; // not configured (development): the link is in the server log
        await ProfileChange.create({ profileId: p.id, actorType: 'staff', actorId: actor.id, actorName: actor.name, section: 'profile', action: 'invite', changes: { title: `Portal invitation sent to ${p.email}` } });
      } else {
        // Not delivered: put the record back so it shows as not invited and can be sent again.
        await AlumniProfile.update({ ...previous, inviteCount: p.inviteCount }, { where: { id: p.id } });
        failed.push({ id: p.id, email: p.email, error: result.error });
      }
    });
    return { sent, failed: failed.length, failures: failed.slice(0, 20), skipped };
  },

  // ---- Public (the invited graduate) ----
  async find(token) {
    const profile = token ? await AlumniProfile.scope('withInvite').findOne({ where: { inviteTokenHash: hashToken(token) } }) : null;
    if (!profile || profile.alumniAccountId) throw ApiError.badRequest('This activation link is invalid or was already used. If you already activated your account, log in.');
    if (profile.inviteExpiresAt < new Date()) {
      throw new ApiError(400, 'This activation link has expired. Ask the Alumni Relations Office for a new one, or register with your Student No.', { reason: 'expired' });
    }
    return profile;
  },

  // What the activation page shows: who this is, so the graduate can confirm it's them.
  async preview(token) {
    const p = await this.find(token);
    return {
      firstName: p.firstName,
      surname: p.surname,
      studentNumber: p.studentNumber,
      program: p.program,
      yearGraduated: p.yearGraduated,
      alumniNumber: p.alumniNumber,
      email: p.email,
      phone: p.phone,
      expiresAt: p.inviteExpiresAt,
    };
  },

  // Sets the password: creates the verified account, links it to the record, signs the graduate in.
  async accept({ token, password, phone }) {
    const profile = await this.find(token);
    const mobile = profile.phone || phone;
    if (!mobile) throw ApiError.unprocessable('Please enter your mobile number.', { phone: 'Enter your mobile number' });
    const taken = await AlumniAccount.findOne({ where: { [Op.or]: [{ email: profile.email }, { studentNumber: profile.studentNumber }] } });
    if (taken) {
      throw ApiError.conflict('An Alumni Portal account already exists for this email or student number. Please log in instead.', { reason: 'exists' });
    }

    const now = new Date();
    const account = await sequelize.transaction(async (transaction) => {
      const account = await AlumniAccount.create(
        {
          fullName: accountName(profile),
          studentNumber: profile.studentNumber,
          program: profile.program,
          yearGraduated: profile.yearGraduated,
          email: profile.email,
          phone: mobile,
          sex: profile.sex,
          address: [profile.houseStreet, profile.barangay, profile.city, profile.province].filter(Boolean).join(', ') || null,
          passwordHash: await hashPassword(password),
          status: 'verified',
          emailVerifiedAt: now, // the link was opened from this mailbox
          reviewedAt: now,
          reviewNote: null,
          consentAt: now,
          lastLoginAt: now,
        },
        { transaction }
      );
      await profile.update({ alumniAccountId: account.id, phone: mobile, inviteTokenHash: null, inviteExpiresAt: null, verifiedAt: profile.verifiedAt || now }, { transaction });
      await ProfileChange.create(
        { profileId: profile.id, actorType: 'alumni', actorId: account.id, actorName: account.fullName, section: 'profile', action: 'verify', changes: { title: 'Activated through the portal invitation', alumniAccountId: [null, account.id] } },
        { transaction }
      );
      return account;
    });
    return { token: signAlumniToken(account), account };
  },
};
