import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, json, err, getAuthUser, getUserClient } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authErr, client } = await getAuthUser(req);
  if (authErr || !user) return err('Unauthorized', 401);

  const url = new URL(req.url);
  const path = url.pathname.split('/').filter(Boolean);
  const isCompleteOnboarding = path[path.length - 1] === 'complete-onboarding';

  try {
    if (req.method === 'GET') {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { data, error } = await client
        .from('users')
        .upsert({ id: user.id, email: user.email, ...body, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'POST' && isCompleteOnboarding) {
      const body = await req.json();
      const { data, error } = await client
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          onboarding_complete: true,
          ...body,
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
