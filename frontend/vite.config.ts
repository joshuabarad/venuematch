import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'spotify-token-dev',
        configureServer(server) {
          server.middlewares.use('/api/spotify-token', async (_req, res) => {
            const id = env.SPOTIFY_CLIENT_ID;
            const secret = env.SPOTIFY_CLIENT_SECRET;
            if (!id || !secret) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Spotify credentials not configured' }));
              return;
            }
            try {
              const r = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Authorization:
                    'Basic ' +
                    Buffer.from(`${id}:${secret}`).toString('base64'),
                },
                body: 'grant_type=client_credentials',
              });
              const data = (await r.json()) as {
                access_token?: string;
                expires_in?: number;
                error?: string;
                error_description?: string;
              };
              if (!r.ok || data.error) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: data.error_description || data.error || 'Spotify auth failed' }));
                return;
              }
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(
                JSON.stringify({
                  access_token: data.access_token,
                  expires_in: data.expires_in,
                })
              );
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to reach Spotify' }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@venuematch/shared': path.resolve(__dirname, '../packages/shared/index.ts'),
      },
    },
  };
});
