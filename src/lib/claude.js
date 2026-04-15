export async function getTonightsRec({ vibeVector, answers, venues, savedVenueIds }) {
  const topVenues = venues.slice(0, 15).map(v => ({
    id: v.id, name: v.name, neighborhood: v.neighborhood,
    genres: v.music_genres, vibe_tags: v.vibe_tags.slice(0, 3),
    music: v.music_score, energy: v.energy_score,
    dance: v.dance_score, crowd: v.crowd_desc,
  }));

  const prompt = `You are a NYC nightlife recommendation engine with deep knowledge of the Brooklyn and Manhattan bar scene. Based on this user's taste profile and tonight's mood answers, pick the SINGLE best venue and give a punchy 1-sentence reason why it's perfect for them tonight.

User vibe profile (all scores out of 5):
- Music: ${vibeVector.music?.toFixed(1) || 3} | Energy: ${vibeVector.energy?.toFixed(1) || 3} | Dance: ${vibeVector.dance?.toFixed(1) || 3}
- Seed artists: ${(vibeVector.seedArtists || []).slice(0,5).join(', ') || 'not set'}

Tonight's answers:
- ${answers.q1}
- ${answers.q2}${answers.currentSong ? `\n- Listening to: "${answers.currentSong}"` : ''}

Venues to choose from:
${JSON.stringify(topVenues, null, 1)}

Rules:
- Pick the ONE venue that best fits the user's profile AND tonight's mood
- The reason must be specific (mention the genre, vibe, or something concrete about the venue)
- matchScore should be 70-98 reflecting genuine fit quality

Respond ONLY with valid JSON, no markdown fences:
{"venueId":"v1","reason":"One specific sentence why this is perfect for them tonight","matchScore":87,"vibe":"2-3 word vibe"}`;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  try {
    let res, data;
    if (supabaseUrl) {
      res = await fetch(`${supabaseUrl}/functions/v1/get-rec`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
    } else if (anthropicKey) {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: prompt }] }),
      });
    } else { throw new Error('No API configured'); }
    data = await res.json();
    const text = supabaseUrl ? data.text : (data.content?.[0]?.text || '');
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    const scored = venues.map(v => {
      let s = 0;
      ['music','energy','dance','demo'].forEach((k,i) => {
        s += 1 - Math.abs((vibeVector[k]||3) - v[['music_score','energy_score','dance_score','demo_score'][i]]) / 5;
      });
      return { ...v, _s: s / 4 };
    }).sort((a,b) => b._s - a._s);
    const best = scored[0];
    return { venueId: best.id, reason: `Based on your taste profile, ${best.name} hits your sweet spot tonight.`, matchScore: Math.round(best._s*100), vibe: best.vibe_tags[0]||'your vibe' };
  }
}
