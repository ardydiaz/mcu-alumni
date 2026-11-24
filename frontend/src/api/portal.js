import { send } from './client.js';

// Alumni Portal session. Separate from the staff session in client.js: different
// storage key and token type, so signing in on one never signs in on the other.
const TOKEN_KEY = 'mcu_alumni_portal';

export const portalSession = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (token) => {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

// JSON, or multipart/form-data when a photo file is attached.
export function withFile(data, file, field = 'photo') {
  if (!(file instanceof File)) return data;
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) if (value !== undefined && value !== null) form.append(key, value);
  form.append(field, file);
  return form;
}

export const portalApi = {
  register: (data) => send('/portal/register', { method: 'POST', body: data }),
  verifyEmail: (token) => send('/portal/verify-email', { method: 'POST', body: { token } }),
  resendVerification: (email) => send('/portal/resend-verification', { method: 'POST', body: { email } }),
  login: (credentials) => send('/portal/login', { method: 'POST', body: credentials }),
  // Portal invitation (record imported by the Alumni Office): who the link is for, then set a password.
  invitePreview: async (token) => (await send(`/portal/invite?token=${encodeURIComponent(token)}`)).data,
  activate: (data) => send('/portal/activate', { method: 'POST', body: data }),
  me: () => send('/portal/me', { token: portalSession.get() }),
  // Password: forgot / reset (from the emailed link) / change (logged in)
  forgotPassword: (email) => send('/portal/forgot-password', { method: 'POST', body: { email } }),
  checkResetToken: async (token) => (await send(`/portal/reset-password?token=${encodeURIComponent(token)}`)).data,
  resetPassword: (data) => send('/portal/reset-password', { method: 'POST', body: data }),
  changePassword: (data) => send('/portal/change-password', { method: 'POST', body: data, token: portalSession.get() }),
  // Graduate Tracer: pre-filled answers (account + latest submission), and submit (linked to the account)
  tracer: () => send('/portal/tracer', { token: portalSession.get() }),
  submitTracer: (data) => send('/portal/tracer', { method: 'POST', body: data, token: portalSession.get() }),

  // Alumni ID request (details come from the verified profile)
  alumniId: async () => (await send('/portal/alumni-id', { token: portalSession.get() })).data,
  requestAlumniId: () => send('/portal/alumni-id', { method: 'POST', token: portalSession.get() }),

  // Event registrations (Step 11)
  myEvents: async () => (await send('/portal/events', { token: portalSession.get() })).data,
  registerEvent: (id) => send(`/portal/events/${id}/register`, { method: 'POST', token: portalSession.get() }),
  cancelEvent: (id) => send(`/portal/events/${id}/register`, { method: 'DELETE', token: portalSession.get() }),

  // My Profile (Step 4). Every call returns the full profile.
  profile: async () => (await send('/portal/profile', { token: portalSession.get() })).data,
  saveProfile: async (data, photo) => (await send('/portal/profile', { method: 'PATCH', body: withFile(data, photo), token: portalSession.get() })).data,
  confirmProfile: async () => send('/portal/profile/confirm', { method: 'POST', token: portalSession.get() }),
  addItem: async (section, data) => (await send(`/portal/profile/${section}`, { method: 'POST', body: data, token: portalSession.get() })).data,
  editItem: async (section, id, data) => (await send(`/portal/profile/${section}/${id}`, { method: 'PATCH', body: data, token: portalSession.get() })).data,
  removeItem: async (section, id) => (await send(`/portal/profile/${section}/${id}`, { method: 'DELETE', token: portalSession.get() })).data,
};
