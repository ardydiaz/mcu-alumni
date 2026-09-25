import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from './env.js';

export const FILE_TYPES = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    label: 'JPG, PNG, WEBP, GIF or SVG image',
  },
  document: {
    mimeTypes: ['application/pdf'],
    label: 'PDF document',
  },
};

// Creates a multer instance that stores files in uploads/<folder>/ with random names.
export function createUploader({ folder, kind = 'image' }) {
  const allowed = FILE_TYPES[kind];
  const destination = path.join(env.upload.dir, folder);
  fs.mkdirSync(destination, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
      },
    }),
    limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      if (allowed.mimeTypes.includes(file.mimetype)) return cb(null, true);
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
      err.message = `Only ${allowed.label} files are allowed`;
      cb(err);
    },
  });
}
