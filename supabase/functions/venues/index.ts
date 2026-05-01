import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, json, err, getUserClient } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const client = getUserClient(req);
  const url = new URL(req.url);
  const genre = url.searchParams.get('genre');

  try {
    let query = client.from('venues').select('*').eq('visible', true);
    if (genre && genre !== 'all') {
      query = query.contains('music_genres', [genre]);
    }
    const { data, error } = await query;
    if (error) return err(error.message);
    return json({ data });
  } catch (e) {
    return err(String(e), 500);
  }
});
