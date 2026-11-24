import { Op } from 'sequelize';
import { AlumniAccount } from './alumniAccount.model.js';
import { hashPassword, verifyPassword, createEmailToken, hashToken, signAlumniToken } from './portal.security.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../utils/mailer.js';
import { ApiError, createCrudService } from '../../utils/helpers.js';
import { profileService, staffActor, splitName } from '../profiles/profile.service.js';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const SIGN_IN_ERROR = 'Incorrect email or password';

// "Dela Cruz, Juan Carlo, M." -> "Juan" for email greetings
const firstName = (fullName = '') => (fullName.split(',')[1] || fullName).trim().split(/\s+/)[0];

const crud = createCrudService(AlumniAccount, {
  label: 'Alumni account',
  searchFields: ['fullName', 'email', 'studentNumber', 'program'],
  filterFields: ['status', 'yearGraduated'],
  sortFields: ['fullName', 'yearGraduated', 'status', 'createdAt'],
});

// Only what the alumnus needs to see about their own account.
export const toPortalProfile = (a) => ({
  id: a.id,
  fullName: a.fullName,
  studentNumber: a.studentNumber,
  program: a.program,
  yearGraduated: a.yearGraduated,
  email: a.email,
  phone: a.phone,
  sex: a.sex,
  address: a.address,
  status: a.status,
  reviewNote: a.status === 'rejected' ? a.reviewNote : null,
  createdAt: a.createdAt,
});

// The same, plus the profile photo (uploaded in My profile) for the sidebar and header avatar.
// profileReviewed: false while a verified alumnus has never reviewed their profile (edited it, confirmed it or
// answered the Graduate Tracer); the portal then opens My Profile after login (Step 3) instead of the dashboard.
export async function toPortalProfileWithPhoto(a) {
  const profile = await profileService.forAccount(a.id);
  return { ...toPortalProfile(a), photo: profile?.photo || null, profileReviewed: profile ? Boolean(profile.alumniUpdatedAt) : null };
}

function sendVerificationEmail(account, token) {
  const link = `${env.frontendUrl}/portal/verify?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: account.email,
    subject: 'Verify your MCU Alumni Portal account',
    text: `Hi ${firstName(account.fullName)},\n\nPlease confirm your email address to continue your MCU Alumni Portal registration:\n${link}\n\nThis link expires in 24 hours. If you did not register, you can ignore this email.`,
  });
}

export const portalService = {
  ...crud,

  async register({ password, confirmPassword, consent, ...data }) {
    const taken = await AlumniAccount.findOne({
      where: { [Op.or]: [{ email: data.email }, { studentNumber: data.studentNumber }] },
    });
    if (taken?.email === data.email) {
      throw ApiError.conflict('An account with this email already exists. Log in instead, or request a new verification link.', {
        email: 'This email is already registered',
      });
    }
    if (taken) {
      throw ApiError.conflict('This student number is already registered. Please contact the Alumni Relations Office.', {
        studentNumber: 'This student number is already registered',
      });
    }

    const { token, hash, expiresAt } = createEmailToken();
    const account = await AlumniAccount.create({
      ...data,
      passwordHash: await hashPassword(password),
      emailTokenHash: hash,
      emailTokenExpiresAt: expiresAt,
      consentAt: new Date(),
    });
    await sendVerificationEmail(account, token);
    return { email: account.email };
  },

  // Email confirmed -> waits for the Alumni Office (status "pending").
  async verifyEmail(token) {
    const account = await AlumniAccount.scope('withSecrets').findOne({ where: { emailTokenHash: hashToken(token) } });
    if (!account || account.emailTokenExpiresAt < new Date()) {
      throw ApiError.badRequest('This verification link is invalid or has expired. Please request a new one.');
    }
    await account.update({
      status: account.status === 'email_unverified' ? 'pending' : account.status,
      emailVerifiedAt: account.emailVerifiedAt || new Date(),
      emailTokenHash: null,
      emailTokenExpiresAt: null,
    });
    return { status: account.status };
  },

  // Always succeeds from the caller's point of view, so it can't be used to discover accounts.
  async resendVerification(email) {
    const account = await AlumniAccount.findOne({ where: { email } });
    if (!account || account.status !== 'email_unverified') return;
    const { token, hash, expiresAt } = createEmailToken();
    await account.update({ emailTokenHash: hash, emailTokenExpiresAt: expiresAt });
    await sendVerificationEmail(account, token);
  },

  async login({ email, password }) {
    const account = await AlumniAccount.scope('withSecrets').findOne({ where: { email } });
    if (!account) throw ApiError.unauthorized(SIGN_IN_ERROR);

    if (account.lockedUntil && account.lockedUntil > new Date()) {
      const minutes = Math.ceil((account.lockedUntil - Date.now()) / 60000);
      throw new ApiError(429, `Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
    }

    if (!(await verifyPassword(password, account.passwordHash))) {
      const failed = account.failedLogins + 1;
      const locked = failed >= MAX_FAILED_LOGINS;
      await account.update({ failedLogins: locked ? 0 : failed, lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60000) : null });
      throw ApiError.unauthorized(SIGN_IN_ERROR);
    }

    if (account.status === 'email_unverified') {
      throw new ApiError(403, 'Please verify your email address first. Check your inbox for the verification link.', { reason: 'email_unverified' });
    }
    // The portal opens only after the Alumni Relations Office verifies the account (the approval email says so).
    if (account.status === 'pending') {
      throw new ApiError(403, 'Your account is still being reviewed by the Alumni Relations Office. We will email you once it is verified, and then you can log in.', { reason: 'pending' });
    }
    if (account.status === 'rejected') {
      throw new ApiError(403, 'Your registration was not approved. Please contact the Alumni Relations Office.', { reason: 'rejected' });
    }

    await account.update({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() });
    return { token: signAlumniToken(account), account: await toPortalProfileWithPhoto(account) };
  },

  // ---- Staff review ----
  // The record EAO encoded or imported from the Registrar (Step 5) under this student number, compared field
  // by field with what the alumnus typed when registering. Verifying links the account to this record.
  async recordMatch(id) {
    const account = await crud.getById(id, { internal: true });
    const record = account.status === 'verified' ? await profileService.forAccount(account.id) : await profileService.unclaimedFor(account.studentNumber);
    if (!record) return null;
    const fold = (s) => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9@.]/g, '');
    const typed = splitName(account.fullName);
    const digits = (s) => String(s || '').replace(/\D/g, '').slice(-10);
    const row = (label, mine, theirs, same) => ({ label, account: mine || null, record: theirs || null, match: theirs ? same : null });
    return {
      profileId: record.id,
      alumniNumber: record.alumniNumber,
      source: record.source,
      checks: [
        row('Name', account.fullName, `${record.surname}, ${record.firstName}${record.middleName ? ` ${record.middleName}` : ''}`, fold(typed.surname) === fold(record.surname) && fold(record.firstName).startsWith(fold(typed.firstName).slice(0, 4))),
        row('Program', account.program, record.program, fold(account.program) === fold(record.program)),
        row('Year graduated', account.yearGraduated, record.yearGraduated, Number(account.yearGraduated) === Number(record.yearGraduated)),
        row('Email', account.email, record.email, fold(account.email) === fold(record.email)),
        row('Contact number', account.phone, record.phone, digits(account.phone) === digits(record.phone)),
      ],
    };
  },

  async approve(id, actor) {
    const account = await crud.getById(id, { internal: true });
    if (account.status === 'email_unverified') throw ApiError.badRequest('This person has not verified their email address yet.');
    await account.update({ status: 'verified', reviewedById: actor.id, reviewedAt: new Date(), reviewNote: null });
    // Verified alumni get their master profile (or are linked to one EAO already encoded) with an Alumni Number.
    await profileService.createForAccount(account, staffActor(actor));
    await sendMail({
      to: account.email,
      subject: 'Your MCU Alumni Portal account is verified',
      text: `Hi ${firstName(account.fullName)},\n\nGood news! The Alumni Relations Office has verified your account. You can now log in:\n${env.frontendUrl}/portal/login`,
    });
    return account;
  },

  async reject(id, { reason } = {}, actor) {
    const account = await crud.getById(id, { internal: true });
    await account.update({ status: 'rejected', reviewedById: actor.id, reviewedAt: new Date(), reviewNote: reason || null });
    await sendMail({
      to: account.email,
      subject: 'About your MCU Alumni Portal registration',
      text: `Hi ${firstName(account.fullName)},\n\nWe could not verify your registration${reason ? `: ${reason}` : '.'}\nPlease contact the Alumni Relations Office at alumni@mcu.edu.ph.`,
    });
    return account;
  },
};
