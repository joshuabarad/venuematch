import type { Venue, VibeVector, DailyRec, TonightAnswers, UserPreferences, RejectedVenue, VenueVector } from '@venuematch/shared';
import { buildUserVector, vectorMatchScore } from './vectorRec';
import { blendSessionVector } from './netflixRec';
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

// ── v2: Claude inference helpers ─────────────────────────────────────────────

async function callClaude(prompt: string, maxTokens = 400): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

  let res: Response;
  if (supabaseUrl) {
    res = await fetch(`${supabaseUrl}/functions/v1/claude-infer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = (await res.json()) as { text?: string };
    return data.text ?? '';
  } else if (anthropicKey) {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = (await res.json()) as { content?: Array<{ text: string }> };
    return data.content?.[0]?.text ?? '';
  }
  throw new Error('No Claude API configured');
}

/**
 * Infer a VenueVector from the user's onboarding signals.
 * Called at the end of Step 4 (Ideal Night).
 *
 * @param selectedGenres   Genres chosen in Step 1 (e.g. ["electronic", "hip-hop"])
 * @param neighborhoods    Neighborhoods chosen in Step 2
 * @param winningVenue     The venue that won the Step 3 head-to-head
 * @param idealNightChips  Chips selected in Step 4 (e.g. ["Late night", "Dance", "NYC underground"])
 * @param freeText         Optional free-text from Step 4
 */
export async function inferUserVector({
  selectedGenres,
  neighborhoods,
  winningVenue,
  idealNightChips,
  freeText,
}: {
  selectedGenres: string[];
  neighborhoods: string[];
  winningVenue?: Venue | null;
  idealNightChips: string[];
  freeText?: string;
}): Promise<VenueVector> {
  const prompt = `You are a NYC nightlife taste profiler. Based on a user's onboarding answers, infer their taste vector.

Onboarding signals:
- Preferred genres: ${selectedGenres.join(', ') || 'none selected'}
- Preferred neighborhoods: ${neighborhoods.join(', ') || 'open to all'}
- Winning venue (they preferred this): ${winningVenue ? `${winningVenue.name} (${winningVenue.neighborhood}) — genres: ${winningVenue.music_genres.join(', ')}, vibe: ${winningVenue.vibe_tags.join(', ')}, energy: ${winningVenue.energy_score}/5, dance: ${winningVenue.dance_score}/5` : 'none'}
- Ideal night chips: ${idealNightChips.join(', ') || 'none selected'}
- Free text description: ${freeText || 'none'}

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "genres": ["genre1", "genre2", ...],
  "vibe": [energy_0_to_1, underground_0_to_1, social_0_to_1, dance_0_to_1],
  "cost": 1_to_4
}

Vibe dimensions:
- energy: 0 = mellow lounge, 1 = high-energy club
- underground: 0 = mainstream/commercial, 1 = underground/alternative
- social: 0 = focused listening crowd, 1 = mixer/meetup crowd
- dance: 0 = standing bar, 1 = dance-floor focus

Cost: 1 = free/cheap, 2 = moderate, 3 = pricier, 4 = high-end

Use 3–6 specific lowercase genre tags (e.g. "techno", "hip-hop", "indie rock").`;

  try {
    const text = await callClaude(prompt, 300);
    const json = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(json) as VenueVector;
    // Clamp vibe to [0,1] and cost to [1,4]
    result.vibe = result.vibe.map((v) => Math.max(0, Math.min(1, v))) as [number,number,number,number];
    result.cost = Math.max(1, Math.min(4, Math.round(result.cost)));
    return result;
  } catch {
    // Fallback: derive from genre selections
    const genreMap: Record<string, Partial<VenueVector['vibe']>> = {
      electronic: [0.8, 0.7, 0.4, 0.8],
      'hip-hop':  [0.7, 0.4, 0.7, 0.5],
      rock:       [0.7, 0.5, 0.4, 0.3],
      jazz:       [0.3, 0.6, 0.5, 0.2],
      indie:      [0.5, 0.6, 0.5, 0.3],
      pop:        [0.6, 0.2, 0.7, 0.6],
      chill:      [0.2, 0.4, 0.4, 0.2],
    };
    const vibeSum: [number,number,number,number] = [0.5, 0.5, 0.5, 0.5];
    let count = 0;
    for (const g of selectedGenres) {
      const mapped = genreMap[g.toLowerCase()];
      if (mapped) {
        for (let i = 0; i < 4; i++) vibeSum[i] += (mapped[i] ?? 0.5);
        count++;
      }
    }
    if (count > 0) {
      for (let i = 0; i < 4; i++) vibeSum[i] /= (count + 1);
    }
    return { genres: selectedGenres, vibe: vibeSum, cost: 2 };
  }
}

/**
 * Infer a session vector from tonight's answers, then blend with the user's base vector.
 * Called when returning user completes "Where to Tonight" questions.
 *
 * @param answers    Key-value map of question IDs to answer strings
 * @param baseVector User's stored VenueVector from onboarding
 */
export async function inferSessionVector(
  answers: Record<string, string>,
  baseVector: VenueVector,
): Promise<VenueVector> {
  const answerStr = Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const prompt = `You are a NYC nightlife recommender. A user has answered 3 questions about tonight's vibe.

Tonight's answers:
${answerStr}

Their base taste profile:
- genres: ${baseVector.genres.join(', ')}
- vibe [energy, underground, social, dance]: [${baseVector.vibe.join(', ')}]
- cost preference: ${baseVector.cost}

Based ONLY on tonight's answers, return a SESSION vector that captures what they want RIGHT NOW.
(The system will blend this with their base 60/40 automatically.)

Return ONLY valid JSON (no markdown):
{
  "genres": ["genre1", ...],
  "vibe": [energy, underground, social, dance],
  "cost": 1_to_4
}`;

  try {
    const text = await callClaude(prompt, 250);
    const json = text.replace(/```json|```/g, '').trim();
    const sessionVec = JSON.parse(json) as VenueVector;
    sessionVec.vibe = sessionVec.vibe.map((v) => Math.max(0, Math.min(1, v))) as [number,number,number,number];
    sessionVec.cost = Math.max(1, Math.min(4, Math.round(sessionVec.cost)));
    return blendSessionVector(baseVector, sessionVec);
  } catch {
    // Fallback: return base vector unchanged
    return baseVector;
  }
}
