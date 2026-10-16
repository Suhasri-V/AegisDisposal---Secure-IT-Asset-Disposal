import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = process.env.PORT || env.PORT || '5000';
  const apiOrigin = process.env.API_ORIGIN || env.API_ORIGIN || `http://localhost:${apiPort}`;
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'google-oauth-dev-handler',
        configureServer(server) {
          server.middlewares.use('/api/auth/google', (req, res, next) => {
            if (req.url === '' || req.url === '/') {
              const googleAuthUrl =
                'https://accounts.google.com/o/oauth2/v2/auth?client_id=1008518815688-mkscml1pj4391nnk9hrhqkn5mrtfk3rt.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=openid%20email%20profile&prompt=select_account';
              res.writeHead(302, { Location: googleAuthUrl });
              res.end();
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
