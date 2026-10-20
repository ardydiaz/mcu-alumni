import { AlumniAccount } from './alumniAccount.model.js';
import { AlumniProfile } from '../profiles/profile.model.js';
import { createEmailToken, hashPassword, hashToken, signAlumniToken, verifyPassword, passwordChangeStamp } from './portal.security.js';
import { portalInvite } from './portal.invite.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../utils/mailer.js';
import { ApiError } from '../../utils/helpers.js';

// Alumni Portal password reset ("Forgot password?") and change.
// The alumnus enters their email; if it is registered, a one-time link (valid 1 hour) is emailed. As chosen by
// EAO, the page says plainly when an email is not registered; the endpoint is rate-limited against misuse.

const RESET_HOURS = 1;
const first = (fullName = '') => (fullName.split(',')[1] || fullName).trim().split(/\s+/)[0];
const systemActor = { id: null, name: 'Forgot password' };

function sendResetEmail(account, token) {
  const link = `${env.frontendUrl}/portal/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: account.email,
    subject: 'Reset your MCU Alumni Portal password',
    text:
      `Hi ${first(account.fullName)},\n\nWe received a request to reset the password of your MCU Alumni Portal account.\n\n` +
      `Set a new password here:\n${link}\n\n` +
      `This link works once and expires in ${RESET_HOURS} hour. If you didn't ask for this, you can ignore this email: your password stays the same.\n\nMCU Alumni Relations Office`,
  });
}

export const portalPassword = {
  /**
   * -> { status: 'sent' } reset link emailed
   *    { status: 'invited' } no account yet, but the graduate is in the alumni database: activation link sent instead
   * Throws 404 "not registered" otherwise.
   */
  async request(email) {
    const account = await AlumniAccount.findOne({ where: { email } });
    if (account) {
      if (account.status === 'rejected') {
        throw new ApiError(403, 'This registration was not approved. Please contact the Alumni Relations Office at alumni@mcu.edu.ph.', { email: 'Registration not approved' });
      }
      const { token, hash, expiresAt } = createEmailToken(RESET_HOURS);
      await account.update({ passwordResetHash: hash, passwordResetExpiresAt: expiresAt }); // a new link replaces the old one
      await sendResetEmail(account, token);
      return { status: 'sent', email: account.email };
    }

    // Imported / EAO-encoded graduate who never activated: there is no password yet, so send the activation link.
    const profile = await AlumniProfile.findOne({ where: { email, alumniAccountId: null } });
    if (profile) {
      const result = await portalInvite.send({ profileIds: [profile.id] }, { resend: true }, systemActor);
      if (result.sent) return { status: 'invited', email };
    }
    throw new ApiError(404, 'This email is not registered in the Alumni Portal.', { email: 'This email is not registered' });
  },

  // Who the link is for (the reset page shows it), without using it up.
  async check(token) {
    const account = await this.findByToken(token);
    return { email: account.email, firstName: first(account.fullName) };
  },

  async findByToken(token) {
    const account = token ? await AlumniAccount.scope('withSecrets').findOne({ where: { passwordResetHash: hashToken(token) } }) : null;
    if (!account || !account.passwordResetExpiresAt || account.passwordResetExpiresAt < new Date()) {
      throw ApiError.badRequest('This reset link is invalid or has expired. Please request a new one.');
    }
    return account;
  },

  async reset(token, password) {
    const account = await this.findByToken(token);
    await account.update({
      passwordHash: await hashPassword(password),
      passwordResetHash: null,
      passwordResetExpiresAt: null,
      passwordChangedAt: passwordChangeStamp(), // signs out every device that was logged in
      failedLogins: 0,
      lockedUntil: null,
      // Opening the emailed link proves they own the mailbox.
      ...(account.status === 'email_unverified' && { status: 'pending', emailVerifiedAt: new Date(), emailTokenHash: null, emailTokenExpiresAt: null }),
    });
    await this.notifyChanged(account);
    return { email: account.email };
  },

  // Logged in: change with the current password. Other devices are signed out; this one gets a fresh session.
  async change(account, { currentPassword, password }) {
    const full = await AlumniAccount.scope('withSecrets').findByPk(account.id);
    if (!(await verifyPassword(currentPassword, full.passwordHash))) {
      throw ApiError.unprocessable('Your current password is incorrect.', { currentPassword: 'Incorrect password' });
    }
    await full.update({ passwordHash: await hashPassword(password), passwordChangedAt: passwordChangeStamp(), passwordResetHash: null, passwordResetExpiresAt: null });
    await this.notifyChanged(full);
    return { token: signAlumniToken(full) }; // issued after passwordChangedAt, so it stays valid
  },

  // Sessions started before the last password change are no longer accepted (see authenticateAlumni).
  // payload.ims = session start in ms; older sessions only have iat (seconds).
  sessionRevoked(account, payload) {
    if (!account.passwordChangedAt) return false;
    const changed = new Date(account.passwordChangedAt).getTime();
    return payload.ims ? payload.ims < changed : payload.iat * 1000 < changed;
  },

  notifyChanged(account) {
    return sendMail({
      to: account.email,
      subject: 'Your MCU Alumni Portal password was changed',
      text:
        `Hi ${first(account.fullName)},\n\nThe password of your MCU Alumni Portal account was just changed, and any device that was logged in has been signed out.\n\n` +
        `If this was you, there's nothing else to do. If it wasn't, reset your password right away at ${env.frontendUrl}/portal/forgot-password and contact alumni@mcu.edu.ph.\n\nMCU Alumni Relations Office`,
    });
  },

  // Staff (Admin -> Portal accounts): send the reset link, e.g. after correcting the alumnus's email.
  async sendForStaff(accountId) {
    const account = await AlumniAccount.findByPk(accountId);
    if (!account) throw ApiError.notFound('Alumni account not found');
    return this.request(account.email);
  },
};
