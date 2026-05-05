import type { Venue, VibeVector, DailyRec, TonightAnswers, UserPreferences, RejectedVenue } from '@venuematch/shared';
import { buildUserVector, vectorMatchScore } from './vectorRec';
import { VECTOR_DIMS } from '../data/venueProfiles';

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
  void savedVenueIds;

  const userVec = buildUserVector(
    vibeVector.seedArtists || [],
    vibeVector.seedArtistGenres || {},
    vibeVector.seedVenues || [],
    vibeVector.customSeedVenues || [],
  );

  const seedIds = new Set([
    ...(vibeVector.seedVenues || []),
    ...(vibeVector.customSeedVenues || []).map((v) => v.id),
  ]);

  const seedVenueObjects = venues.filter((v) => seedIds.has(v.id));
  const discoveryPool = venues.filter((v) => !seedIds.has(v.id) && v.isOpenNow !== false);

  const topVenues = [...discoveryPool]
    .sort((a, b) => vectorMatchScore(b, userVec) - vectorMatchScore(a, userVec))
    .slice(0, 15)
    .map((v) => ({
      id: v.id,
      name: v.name,
      neighborhood: v.neighborhood,
      genres: v.music_genres,
      vibe_tags: v.vibe_tags.slice(0, 3),
      crowd: v.crowd_desc,
      ...(v.editorialSummary ? { summary: v.editorialSummary } : {}),
      ...(v.googleRating ? { googleRating: v.googleRating, reviews: v.reviewCount } : {}),
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
        return genres?.length ? `${name} (${genres.slice(0, 3).join(', ')})` : name;
      })
      .join(', ') || 'not set';

  const fingerprint = VECTOR_DIMS.slice(0, 8)
    .map((dim, i) => `${dim}: ${userVec[i].toFixed(2)}`)
    .join(', ');

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentRejections = Object.values(rejectedVenues || {}).filter((r) => r.timestamp > sevenDaysAgo);
  const rejectedGenres = [...new Set(recentRejections.flatMap((r) => r.genres))];
  const rejectedVibes  = [...new Set(recentRejections.flatMap((r) => r.vibe_tags))];
  const rejectionContext = recentRejections.length
    ? `Recently rejected (avoid): genres: ${rejectedGenres.join(', ')} | vibes: ${rejectedVibes.join(', ')}`
    : 'No recent rejections';

  const purposes = (prefs?.purposes || []).join(', ') || 'not set';
  const neighborhoods = (prefs?.neighborhoods || []).join(', ') || 'open to all';

  const prompt = `You are a NYC nightlife discovery engine. Pick the ONE venue the user will love but hasn't experienced yet.

Known favorites (DO NOT recommend — use to understand taste):
${seedVenueNames.length ? seedVenueNames.join(', ') : 'none set'}

16-dim taste fingerprint (0–1):
${fingerprint}
Artist taste: ${seedArtistStr}
Tonight's goals: ${purposes}
Preferred neighborhoods: ${neighborhoods}
${rejectionContext}

Tonight's mood:
- ${answers.q1}
- ${answers.q2}${answers.currentSong ? `\n- Currently listening to: "${answers.currentSong}"` : ''}

Discovery candidates (choose from ONLY these):
${JSON.stringify(topVenues, null, 1)}

Rules:
- Pick the single best venue for their fingerprint + tonight's mood
- Avoid rejected genres/vibes
- Cite something concrete in the reason (genre, vibe, crowd, neighborhood)
- matchScore 70–98 reflecting genuine fit

Respond ONLY with valid JSON, no markdown fences:
{"venueId":"v1","reason":"One sentence why this is right for them tonight","matchScore":87,"vibe":"2-3 word vibe"}`;

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
    const best = [...discoveryPool].sort(
      (a, b) => vectorMatchScore(b, userVec) - vectorMatchScore(a, userVec)
    )[0];
    return {
      venueId: best.id,
      reason: `Based on your taste profile, ${best.name} is the closest match you haven't tried yet.`,
      matchScore: vectorMatchScore(best, userVec),
      vibe: best.vibe_tags[0] || 'your vibe',
    };
  }
}
