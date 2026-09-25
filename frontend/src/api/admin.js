import { authRequest } from './client.js';

const toQuery = (params = {}) => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') q.set(key, value);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
};

// Sends JSON, or multipart/form-data when a File is included (image/PDF uploads).
function toBody(data, files = {}) {
  const fileEntries = Object.entries(files).filter(([, file]) => file instanceof File);
  if (!fileEntries.length) return data;

  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    form.append(key, typeof value === 'boolean' ? String(value) : value);
  }
  for (const [key, file] of fileEntries) form.append(key, file);
  return form;
}

// Thin wrappers over the staff endpoints. `resource` is a path like "/scholars".
export const adminApi = {
  list: (resource, params) => authRequest(`${resource}${toQuery(params)}`),
  get: async (resource, id) => (await authRequest(`${resource}/${id}`)).data,
  create: (resource, data, files) => authRequest(resource, { method: 'POST', body: toBody(data, files) }),
  update: (resource, id, data, files) => authRequest(`${resource}/${id}`, { method: 'PATCH', body: toBody(data, files) }),
  remove: (resource, id) => authRequest(`${resource}/${id}`, { method: 'DELETE' }),
  fetch: async (path, params) => (await authRequest(`${path}${toQuery(params)}`)).data,
  send: (path, method, body) => authRequest(path, { method, body }),
};
