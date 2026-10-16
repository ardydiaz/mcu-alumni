const BASE = import.meta.env.VITE_API_URL || '';
const API = `${BASE}/api/v1`;
const REFRESH_KEY = 'mcu_alumni_refresh';

// Content names used by the public pages -> backend endpoints.
const CONTENT_ENDPOINTS = {
  site: '/content/site',
  home: '/content/home',
  slides: '/slides?limit=20',
  give: '/content/give',
  courses: '/content/courses',
  volunteer: '/content/volunteer',
  transparency: '/content/transparency',
  'form-options': '/content/form-options',
  campaigns: '/campaigns?limit=100',
  scholars: '/scholars?limit=100',
  projects: '/projects?limit=100',
  networks: '/networks?limit=100',
  'merchant-partners': '/partners?type=merchant&limit=100',
  'industry-partners': '/partners?type=industry&limit=100',
  'transparency-reports': '/reports/grouped',
};

// Public form names -> backend endpoints.
const FORM_ENDPOINTS = {
  contact: '/messages',
  donation: '/donations',
  'alumni-update': '/alumni',
  tracer: '/tracer',
  volunteer: '/volunteers',
  'portal-register': '/portal/register',
};

// ---- Session ---------------------------------------------------------------
// The access token lives only in memory; the refresh token is kept in
// localStorage so staff stay signed in across reloads.
let accessToken = null;

const storage = {
  get: () => {
    try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
  },
  set: (token) => {
    try { token ? localStorage.setItem(REFRESH_KEY, token) : localStorage.removeItem(REFRESH_KEY); } catch { /* storage unavailable */ }
  },
};

export function setSession({ accessToken: access, refreshToken }) {
  accessToken = access;
  if (refreshToken) storage.set(refreshToken);
}

export function clearSession() {
  accessToken = null;
  storage.set(null);
}

export const hasStoredSession = () => Boolean(storage.get());
export const getRefreshToken = () => storage.get();

// ---- Requests --------------------------------------------------------------
// Responses look like { success, message, data, meta?, errors? }.
export async function send(path, { method = 'GET', body, token } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = {};
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (res.status === 204) return { success: true, data: null };

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.success === false) {
    const err = new Error(payload.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.fields = payload.errors;
    throw err;
  }
  return payload;
}

// One refresh at a time, shared by every request that hit a 401.
let refreshing = null;
export function refreshSession() {
  const refreshToken = storage.get();
  if (!refreshToken) return Promise.reject(new Error('Not signed in'));
  refreshing ??= send('/auth/refresh', { method: 'POST', body: { refreshToken } })
    .then(({ data }) => {
      setSession(data);
      return data;
    })
    .catch((err) => {
      clearSession();
      window.dispatchEvent(new Event('auth:expired'));
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Authenticated request; refreshes the access token once on 401 and retries.
export async function authRequest(path, options = {}) {
  if (!accessToken && storage.get()) await refreshSession();
  try {
    return await send(path, { ...options, token: accessToken });
  } catch (err) {
    if (err.status !== 401 || !storage.get()) throw err;
    await refreshSession();
    return send(path, { ...options, token: accessToken });
  }
}

// ---- Public site -----------------------------------------------------------
export async function getContent(name) {
  const endpoint = CONTENT_ENDPOINTS[name];
  if (!endpoint) throw new Error(`Unknown content "${name}"`);
  return (await send(endpoint)).data;
}

export const submitForm = (type, data) => send(FORM_ENDPOINTS[type], { method: 'POST', body: data });

// Which sign-in methods are enabled: { password: boolean, microsoft: boolean }
export const getAuthProviders = async () => (await send('/auth/providers')).data;

// Full-page navigation (not fetch): the backend redirects to Microsoft and back.
export const m365LoginUrl = (returnTo = '/admin') => `${API}/auth/m365/login?returnTo=${encodeURIComponent(returnTo)}`;

// One-time ticket from the Microsoft callback -> our access + refresh tokens.
export const exchangeM365Ticket = (ticket) => send('/auth/m365/exchange', { method: 'POST', body: { ticket } });

export const logout = (refreshToken) => send('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});

// Files uploaded to the backend are stored as "/uploads/..."; external URLs pass through.
export const assetUrl = (url) => (url && url.startsWith('/uploads/') ? `${BASE}${url}` : url);

// ---- Alumni events ---------------------------------------------------------
const toQuery = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null));
  return q.toString() ? `?${q}` : '';
};
// { from, to, upcoming, category, networkId, limit } -> { data, meta }
export const getEvents = (params) => send(`/events${toQuery(params)}`);
export const getEvent = async (slug) => (await send(`/events/${encodeURIComponent(slug)}`)).data;
// Philippine address lists (PSGC): '/regions', '/regions/:code/provinces', '/provinces/:code/cities', '/cities/:code/barangays'
const psgcCache = new Map();
export function getPsgc(path) {
  if (!psgcCache.has(path)) psgcCache.set(path, send(`/psgc${path}`).then((r) => r.data).catch((err) => { psgcCache.delete(path); throw err; }));
  return psgcCache.get(path);
}

// "Add to my calendar" (.ics download)
export const eventIcsUrl = (slug) => `${API}/events/${encodeURIComponent(slug)}/ics`;
