import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, json, err, getAuthUser } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authErr, client } = await getAuthUser(req);
  if (authErr || !user) return err('Unauthorized', 401);

  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const groupId = segments[1];
  const isJoin = segments[segments.length - 1] === 'join';
  const isScores = segments[segments.length - 1] === 'scores';

  try {
    if (req.method === 'GET' && !groupId) {
      const { data, error } = await client
        .from('group_members')
        .select('group:groups(*), joined_at')
        .eq('user_id', user.id);
      if (error) return err(error.message);
      return json({ data });
    }

    if (req.method === 'POST' && !isJoin) {
      const { name } = await req.json();
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data: group, error: gErr } = await client
        .from('groups')
        .insert({ name, code, created_by: user.id })
        .select()
        .single();
      if (gErr) return err(gErr.message);
      await client.from('group_members').insert({ group_id: group.id, user_id: user.id });
      return json({ data: group });
    }

    if (req.method === 'POST' && isJoin) {
      const { code } = await req.json();
      const { data: group, error: gErr } = await client
        .from('groups')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      if (gErr || !group) return err('Group not found', 404);
      const { error: mErr } = await client
        .from('group_members')
        .upsert({ group_id: group.id, user_id: user.id });
      if (mErr) return err(mErr.message);
      return json({ data: group });
    }

    if (req.method === 'DELETE' && groupId) {
      const { error } = await client
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by', user.id);
      if (error) return err(error.message);
      return json({ data: null });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    return err(String(e), 500);
  }
});
