import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import selfsigned from 'selfsigned';

/** Generate self-signed cert so dev server can run over HTTPS (required for camera on mobile). */
async function getHttpsConfig() {
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const opts = { algorithm: 'sha256', days: 365 };
  const pems = await selfsigned.generate(attrs, opts);
  return { key: pems.private, cert: pems.cert };
}

export default defineConfig(async () => {
  const https = await getHttpsConfig();
  return {
    plugins: [react()],
    server: {
      port: 5173,
      https,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
