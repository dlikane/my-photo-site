import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  env: {
    NODE_VERSION: '18'
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  }
});
