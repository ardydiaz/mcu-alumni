// Every endpoint responds with the same envelope:
//   { success: true,  message, data, meta? }
//   { success: false, message, errors? }

export function sendSuccess(res, { data = null, message = 'OK', statusCode = 200, meta } = {}) {
  return res.status(statusCode).json({ success: true, message, data, ...(meta && { meta }) });
}

export function sendCreated(res, data, message = 'Created successfully') {
  return sendSuccess(res, { data, message, statusCode: 201 });
}

export function sendPaginated(res, { rows, meta }, message = 'OK') {
  return sendSuccess(res, { data: rows, meta, message });
}

export function sendNoContent(res) {
  return res.status(204).end();
}

export function sendError(res, { statusCode = 500, message = 'Something went wrong', errors } = {}) {
  return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
}
