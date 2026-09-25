import multer from 'multer';
import { createUploader } from '../config/multer.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/helpers.js';

/**
 * Accepts one optional file in multipart field `field`, saves it under
 * uploads/<folder>/ and sets req.body[target] to its public URL
 * ("/uploads/<folder>/<file>"). JSON requests pass straight through, so the
 * same route accepts either an uploaded file or a URL string.
 */
export function uploadSingle({ field, folder, kind = 'image', target = field }) {
  const upload = createUploader({ folder, kind }).single(field);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? `File must be at most ${env.upload.maxSizeMb} MB` : err.message;
        return next(ApiError.unprocessable(message, { [field]: message }));
      }
      if (err) return next(err);
      if (req.file) req.body[target] = `/uploads/${folder}/${req.file.filename}`;
      next();
    });
  };
}

export const uploadImage = (field, folder, target = field) => uploadSingle({ field, folder, kind: 'image', target });
export const uploadDocument = (field, folder, target = field) => uploadSingle({ field, folder, kind: 'document', target });
