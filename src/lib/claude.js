function vibeScore(v, vector) {
  const dims = [['music_score','music'],['energy_score','energy'],['dance_score','dance'],['demo_score','demo']];
  return dims.reduce((s, [vk, uk]) => s + (1 - Math.abs((vector[uk] || 3) - v[vk]) / 5), 0) / dims.length;
}

// Build a taste profile from the user's seed venues
function buildSeedProfile(seedVenueObjects) {
  if (!seedVenueObjects.length) return null;
  const avg = (key) => seedVenueObjects.reduce((s, v) => s + (v[key] || 0), 0) / seedVenueObjects.length;
  return {
    music: avg('music_score'),
    energy: avg('energy_score'),
    dance: avg('dance_score'),
    demo: avg('demo_score'),
    genres: [...new Set(seedVenueObjects.flatMap(v => v.music_genres))],
    vibes: [...new Set(seedVenueObjects.flatMap(v => v.vibe_tags))],
  };
}

// Blend explicit rating signal with implicit seed venue signal
function enrichVector(vibeVector, seedProfile, ratedCount) {
  if (!seedProfile) return vibeVector;
  // Explicit ratings dominate once the user has rated venues; seeds are the prior
  const explicitWeight = ratedCount > 0 ? 0.6 : 0;
  const seedWeight = 1 - explicitWeight;
  return {
    music:  vibeVector.music  * explicitWeight + seedProfile.music  * seedWeight,
    energy: vibeVector.energy * explicitWeight + seedProfile.energy * seedWeight,
    dance:  vibeVector.dance  * explicitWeight + seedProfile.dance  * seedWeight,
    demo:   vibeVector.demo   * explicitWeight + seedProfile.demo   * seedWeight,
  };
}

export async function getTonightsRec({ vibeVector, answers, venues, savedVenueIds, prefs, rejectedVenues }) {
  // Seed venues = taste DNA only — never candidates for recommendation
  const seedIds = new Set([
    ...(vibeVector.seedVenues || []),
    ...(vibeVector.customSeedVenues || []).map(v => v.id),
  ]);

  const seedVenueObjects = venues.filter(v => seedIds.has(v.id));
  const seedProfile = buildSeedProfile(seedVenueObjects);
  const enriched = enrichVector(vibeVector, seedProfile, vibeVector.ratedCount || 0);

  // Discovery pool: only venues the user hasn't seeded, excluding closed venues (if we know they're closed)
  const discoveryPool = venues.filter(v => !seedIds.has(v.id) && v.isOpenNow !== false);

  const topVenues = [...discoveryPool]
    .sort((a, b) => vibeScore(b, enriched) - vibeScore(a, enriched))
    .slice(0, 15)
    .map(v => ({
      id: v.id, name: v.name, neighborhood: v.neighborhood,
      genres: v.music_genres, vibe_tags: v.vibe_tags.slice(0, 3),
      music: v.music_score, energy: v.energy_score,
      dance: v.dance_score, crowd: v.crowd_desc,
      ...(v.editorialSummary ? { summary: v.editorialSummary } : {}),
      ...(v.googleRating ? { googleRating: v.googleRating, reviews: v.reviewCount } : {}),
    }));

  // Seed venue names + custom Google Places venues as taste anchors for Claude
  const seedVenueNames = [
    ...seedVenueObjects.map(v => v.name),
    ...(vibeVector.customSeedVenues || []).map(v => v.name),
  ];

  const seedArtistStr = (vibeVector.seedArtists || []).slice(0, 5).map(name => {
    const genres = (vibeVector.seedArtistGenres || {})[name];
    return genres?.length ? `${name} (${genres.slice(0, 3).join(', ')})` : name;
  }).join(', ') || 'not set';

  // Recent rejection context (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentRejections = Object.values(rejectedVenues || {}).filter(r => r.timestamp > sevenDaysAgo);
  const rejectedGenres = [...new Set(recentRejections.flatMap(r => r.genres))];
  const rejectedVibes = [...new Set(recentRejections.flatMap(r => r.vibe_tags))];
  const rejectionContext = recentRejections.length
    ? `Recently rejected (avoid recommending venues heavy in these): genres: ${rejectedGenres.join(', ')} | vibes: ${rejectedVibes.join(', ')}`
    : 'No recent rejections';

  // User purpose + neighborhood context
  const purposes = (prefs?.purposes || []).join(', ') || 'not set';
  const neighborhoods = (prefs?.neighborhoods || []).join(', ') || 'open to all';

  const prompt = `You are a NYC nightlife discovery engine. Your job is to recommend a venue the user will love but hasn't experienced yet — this is about expanding their world, not reminding them of their regulars.

User's known favorites (DO NOT recommend these — use them only to understand their taste):
${seedVenueNames.length ? seedVenueNames.join(', ') : 'none set'}

Taste DNA inferred from their seeds (scores out of 5):
- Music: ${enriched.music.toFixed(1)} | Energy: ${enriched.energy.toFixed(1)} | Dance: ${enriched.dance.toFixed(1)} | Crowd match: ${enriched.demo.toFixed(1)}
- Genre fingerprint: ${seedProfile?.genres?.join(', ') || 'varied'}
- Vibe fingerprint: ${seedProfile?.vibes?.join(', ') || 'varied'}
- Artist taste: ${seedArtistStr}
- Tonight's goals: ${purposes}
- Preferred neighborhoods: ${neighborhoods}
- ${rejectionContext}

Tonight's mood:
- ${answers.q1}
- ${answers.q2}${answers.currentSong ? `\n- Currently listening to: "${answers.currentSong}"` : ''}

Discovery candidates — choose from ONLY these venues:
${JSON.stringify(topVenues, null, 1)}

Rules:
- Pick the ONE venue from the list above that best matches their taste DNA and tonight's mood
- Avoid venues that share genres or vibes from the rejection context
- If tonight's goals include 'dancing', weight dance score heavily; if 'low_key', prefer lower energy
- Frame the rec as a discovery: why will this feel familiar enough to love, but fresh enough to be worth the trip?
- The reason must cite something concrete (a genre, a vibe tag, a crowd detail, a neighborhood)
- matchScore 70–98 reflecting genuine fit quality

Respond ONLY with valid JSON, no markdown fences:
{"venueId":"v1","reason":"One specific sentence why this is the right discovery for them tonight","matchScore":87,"vibe":"2-3 word vibe"}`;

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
    // Fallback: score-based pick from discovery pool only
    const best = [...discoveryPool]
      .map(v => ({ ...v, _s: vibeScore(v, enriched) }))
      .sort((a, b) => b._s - a._s)[0];
    return {
      venueId: best.id,
      reason: `Based on your taste profile, ${best.name} is the closest match you haven't tried yet.`,
      matchScore: Math.round(best._s * 100),
      vibe: best.vibe_tags[0] || 'your vibe',
    };
  }
}
