import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/time' || req.url?.startsWith('/api/time?')) {
          const now = new Date();
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: true,
              timestamp: now.getTime(),
              utcIso: now.toISOString(),
              formattedDate: now.toISOString().split('T')[0],
              formattedTime: now.toTimeString().split(' ')[0],
              serverOnline: true,
            })
          );
          return;
        }

        if (req.url === '/api/health' || req.url?.startsWith('/api/health?')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'Medical Imaging Management System',
              environment: 'development',
            })
          );
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data_vault.json', '**/*.json', '**/dist/**', '**/.git/**'],
      },
    },
  };
});
