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
    if (req.method === 'POST' && venueId) {
      const { genres, vibe_tags } = await req.json();
      const { data, error } = await client
        .from('venue_rejections')
        .insert({ user_id: user.id, venue_id: venueId, genres, vibe_tags })
        .select()
        .single();
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'GET') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await client
        .from('venue_rejections')
        .select('*')
        .eq('user_id', user.id)
        .gte('rejected_at', sevenDaysAgo);
      if (error) return err(error.message);
      return json({ data });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    return err(String(e), 500);
  }
});
