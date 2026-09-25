import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_URL = 'http://localhost:6002';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5002,
    strictPort: true, // fail instead of silently moving to another port (CORS expects 5002)
    // Forward API calls and uploaded files to the Express backend during development.
    proxy: {
      '/api': BACKEND_URL,
      '/uploads': BACKEND_URL,
    },
  },
  preview: {
    port: 5002,
    strictPort: true,
  },
});
