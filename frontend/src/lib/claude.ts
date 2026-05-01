import type { Venue, VibeVector, DailyRec, TonightAnswers, UserPreferences, RejectedVenue } from '@venuematch/shared';

interface SeedProfile {
  music: number;
  energy: number;
  dance: number;
  demo: number;
  genres: string[];
  vibes: string[];
}

interface EnrichedVector {
  music: number;
  energy: number;
  dance: number;
  demo: number;
}

function vibeScore(v: Venue, vector: EnrichedVector): number {
  const dims: Array<[keyof Venue, keyof EnrichedVector]> = [
    ['music_score', 'music'],
    ['energy_score', 'energy'],
    ['dance_score', 'dance'],
    ['demo_score', 'demo'],
  ];
  return (
    dims.reduce((s, [vk, uk]) => {
      return s + (1 - Math.abs((vector[uk] || 3) - (v[vk] as number)) / 5);
    }, 0) / dims.length
  );
}

function buildSeedProfile(seedVenueObjects: Venue[]): SeedProfile | null {
  if (!seedVenueObjects.length) return null;
  const avg = (key: keyof Venue) =>
    seedVenueObjects.reduce((s, v) => s + ((v[key] as number) || 0), 0) /
    seedVenueObjects.length;
  return {
    music: avg('music_score'),
    energy: avg('energy_score'),
    dance: avg('dance_score'),
    demo: avg('demo_score'),
    genres: [...new Set(seedVenueObjects.flatMap((v) => v.music_genres))],
    vibes: [...new Set(seedVenueObjects.flatMap((v) => v.vibe_tags))],
  };
}

function enrichVector(
  vibeVector: EnrichedVector,
  seedProfile: SeedProfile | null,
  ratedCount: number
): EnrichedVector {
  if (!seedProfile) return vibeVector;
  const explicitWeight = ratedCount > 0 ? 0.6 : 0;
  const seedWeight = 1 - explicitWeight;
  return {
    music: vibeVector.music * explicitWeight + seedProfile.music * seedWeight,
    energy: vibeVector.energy * explicitWeight + seedProfile.energy * seedWeight,
    dance: vibeVector.dance * explicitWeight + seedProfile.dance * seedWeight,
    demo: vibeVector.demo * explicitWeight + seedProfile.demo * seedWeight,
  };
}

export async function getTonightsRec({
  vibeVector,
  answers,
  venues,
  savedVenueIds,
  prefs,
  rejectedVenues,
}: {
  vibeVector: VibeVector;
  answers: TonightAnswers;
  venues: Venue[];
  savedVenueIds: string[];
  prefs: UserPreferences;
  rejectedVenues: Record<string, RejectedVenue>;
}): Promise<DailyRec> {
  void savedVenueIds; // reserved for future filtering

  const seedIds = new Set([
    ...(vibeVector.seedVenues || []),
    ...(vibeVector.customSeedVenues || []).map((v) => v.id),
  ]);

  const seedVenueObjects = venues.filter((v) => seedIds.has(v.id));
  const seedProfile = buildSeedProfile(seedVenueObjects);
  const enriched = enrichVector(vibeVector, seedProfile, vibeVector.ratedCount || 0);

  const discoveryPool = venues.filter(
    (v) => !seedIds.has(v.id) && v.isOpenNow !== false
  );

  const topVenues = [...discoveryPool]
    .sort((a, b) => vibeScore(b, enriched) - vibeScore(a, enriched))
    .slice(0, 15)
    .map((v) => ({
      id: v.id,
      name: v.name,
      neighborhood: v.neighborhood,
      genres: v.music_genres,
      vibe_tags: v.vibe_tags.slice(0, 3),
      music: v.music_score,
      energy: v.energy_score,
      dance: v.dance_score,
      crowd: v.crowd_desc,
      ...(v.editorialSummary ? { summary: v.editorialSummary } : {}),
      ...(v.googleRating
        ? { googleRating: v.googleRating, reviews: v.reviewCount }
        : {}),
    }));

  const seedVenueNames = [
    ...seedVenueObjects.map((v) => v.name),
    ...(vibeVector.customSeedVenues || []).map((v) => v.name),
  ];

  const seedArtistStr =
    (vibeVector.seedArtists || [])
      .slice(0, 5)
      .map((name) => {
        const genres = (vibeVector.seedArtistGenres || {})[name];
        return genres?.length
          ? `${name} (${genres.slice(0, 3).join(', ')})`
          : name;
      })
      .join(', ') || 'not set';

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentRejections = Object.values(rejectedVenues || {}).filter(
    (r) => r.timestamp > sevenDaysAgo
  );
  const rejectedGenres = [...new Set(recentRejections.flatMap((r) => r.genres))];
  const rejectedVibes = [...new Set(recentRejections.flatMap((r) => r.vibe_tags))];
  const rejectionContext = recentRejections.length
    ? `Recently rejected (avoid): genres: ${rejectedGenres.join(', ')} | vibes: ${rejectedVibes.join(', ')}`
    : 'No recent rejections';

  const purposes = (prefs?.purposes || []).join(', ') || 'not set';
  const neighborhoods = (prefs?.neighborhoods || []).join(', ') || 'open to all';

  const prompt = `You are a NYC nightlife discovery engine. Your job is to recommend a venue the user will love but hasn't experienced yet.

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
- Frame the rec as a discovery: why will this feel familiar enough to love, but fresh enough to be worth the trip?
- The reason must cite something concrete (a genre, a vibe tag, a crowd detail, a neighborhood)
- matchScore 70–98 reflecting genuine fit quality

Respond ONLY with valid JSON, no markdown fences:
{"venueId":"v1","reason":"One specific sentence why this is the right discovery for them tonight","matchScore":87,"vibe":"2-3 word vibe"}`;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  try {
    let res: Response;
    if (supabaseUrl) {
      res = await fetch(`${supabaseUrl}/functions/v1/get-rec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
    } else if (anthropicKey) {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } else {
      throw new Error('No API configured');
    }
    const data = (await res.json()) as {
      text?: string;
      content?: Array<{ text: string }>;
    };
    const text = supabaseUrl
      ? (data.text ?? '')
      : (data.content?.[0]?.text ?? '');
    return JSON.parse(text.replace(/```json|```/g, '').trim()) as DailyRec;
  } catch {
    const best = [...discoveryPool]
      .map((v) => ({ ...v, _s: vibeScore(v, enriched) }))
      .sort((a, b) => b._s - a._s)[0];
    return {
      venueId: best.id,
      reason: `Based on your taste profile, ${best.name} is the closest match you haven't tried yet.`,
      matchScore: Math.round(best._s * 100),
      vibe: best.vibe_tags[0] || 'your vibe',
    };
  }
}
