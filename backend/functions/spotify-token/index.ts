// Supabase Edge Function — Spotify client credentials token exchange
// Mirrors api/spotify-token.js but runs server-side in Deno

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (_req) => {
  const id = Deno.env.get('SPOTIFY_CLIENT_ID');
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  if (!id || !secret) {
    return new Response(JSON.stringify({ error: 'Spotify credentials not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${id}:${secret}`),
      },
      body: 'grant_type=client_credentials',
    });

    const data = await r.json() as { access_token: string; expires_in: number };

    return new Response(
      JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to reach Spotify', detail: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
