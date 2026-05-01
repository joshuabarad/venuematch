import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, json, err, getAuthUser } from '../_shared/cors.ts';

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const { user, error: authErr, client } = await getAuthUser(req);
  if (authErr || !user) return err('Unauthorized', 401);

  const url = new URL(req.url);
  const isFeedback = url.pathname.endsWith('/feedback');

  try {
    // GET /recommendations/tonight — return today's rec or generate one
    if (req.method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      const { data: existing } = await client
        .from('daily_recs')
        .select('*')
        .eq('user_id', user.id)
        .eq('rec_date', today)
        .single();

      if (existing) return json({ data: existing });

      // No rec yet — call Claude via the get-rec function
      const prompt = url.searchParams.get('prompt');
      if (!prompt) return err('No prompt provided and no rec found for today');

      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicKey) return err('Anthropic API key not configured', 500);

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{ role: 'user', content: decodeURIComponent(prompt) }],
        }),
      });

      const claudeData = await claudeRes.json() as { content?: Array<{ text: string }> };
      const text = claudeData.content?.[0]?.text ?? '';
      const rec = JSON.parse(text.replace(/```json|```/g, '').trim()) as {
        venueId: string; reason: string; matchScore: number; vibe: string;
      };

      const { data: saved, error: saveErr } = await client
        .from('daily_recs')
        .insert({
          user_id: user.id,
          venue_id: rec.venueId,
          rec_date: today,
          match_score: rec.matchScore,
          vibe: rec.vibe,
          reason: rec.reason,
        })
        .select()
        .single();

      if (saveErr) return err(saveErr.message);
      return json({ data: { ...saved, venueId: rec.venueId, matchScore: rec.matchScore, reason: rec.reason, vibe: rec.vibe } });
    }

    // POST /recommendations/tonight/feedback
    if (req.method === 'POST' && isFeedback) {
      const { action, venueId, matchScore } = await req.json();
      const today = new Date().toISOString().split('T')[0];
      const { error } = await client
        .from('daily_recs')
        .update({ user_action: action })
        .eq('user_id', user.id)
        .eq('rec_date', today);
      if (error) {
        // Rec might not exist yet (edge case), insert it
        await client.from('daily_recs').insert({
          user_id: user.id,
          venue_id: venueId,
          rec_date: today,
          match_score: matchScore,
          user_action: action,
        });
      }
      return json({ data: null });
    }

    return err('Method not allowed', 405);
  } catch (e) {
    return err(String(e), 500);
  }
});
