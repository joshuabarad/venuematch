import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, json, err, getAuthUser } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authErr, client } = await getAuthUser(req);
  if (authErr || !user) return err('Unauthorized', 401);

  const url = new URL(req.url);
  const venueId = url.pathname.split('/').filter(Boolean).pop();

  try {
    if (req.method === 'GET') {
      const { data, error } = await client
        .from('user_venue_ratings')
        .select('*')
        .eq('user_id', user.id);
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'PUT' && venueId) {
      const body = await req.json();
      const { data, error } = await client
        .from('user_venue_ratings')
        .upsert({
          user_id: user.id,
          venue_id: venueId,
          music_score: body.music,
          energy_score: body.energy,
          dance_score: body.dance,
          demo_score: body.demo,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) return err(error.message);
      return json({ data });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    return err(String(e), 500);
  }
});
