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
        .from('saved_venues')
        .select('*')
        .eq('user_id', user.id);
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'PUT' && venueId) {
      const { status } = await req.json();
      const { data, error } = await client
        .from('saved_venues')
        .upsert({ user_id: user.id, venue_id: venueId, status })
        .select()
        .single();
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'DELETE' && venueId) {
      const { error } = await client
        .from('saved_venues')
        .delete()
        .eq('user_id', user.id)
        .eq('venue_id', venueId);
      if (error) return err(error.message);
      return json({ data: null });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    return err(String(e), 500);
  }
});
