import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Load VITE_* from the repo-root .env, the single env file for the monorepo.
  const rootDir = path.resolve(import.meta.dirname, '../..');
  const env = loadEnv(mode, rootDir, '');

  return {
    envDir: rootDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        // Use shared source directly so edits hot-reload without a rebuild.
        '@fitgeng/shared': path.resolve(import.meta.dirname, '../../packages/shared/src/index.ts'),
      },
    },
    server: {
      host: true,
      port: 5173,
      // Docker bind mounts from Windows/macOS don't always deliver file events.
      watch: env.VITE_USE_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
      proxy: {
        // Same-origin API in dev, matching the Nginx setup in production (architecture D13).
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: false,
        },
      },
    },
    build: {
      sourcemap: true,
    },
  };
});
