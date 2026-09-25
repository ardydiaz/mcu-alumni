import cors from 'cors';
import { env } from './env.js';

export const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin requests and tools without an Origin header (curl, Postman).
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};

export const corsMiddleware = cors(corsOptions);
