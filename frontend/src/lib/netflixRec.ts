/**
 * Netflix-style recommendation engine (v2.0).
 *
 * Formula:
 *   match_score = 0.35 × genre_jaccard
 *               + 0.30 × vibe_cosine
 *               + 0.15 × cost_alignment
 *               + 0.10 × neighborhood_match
 *               + 0.10 × quality_score
 *               − rejection_penalty
 *               − novelty_penalty
 *
 * All five raw components are 0–1; final × 100 = 0–100 before penalties.
 */

import type { Venue, VenueVector, RejectedVenue } from '@venuematch/shared';
import { SCORING } from '@venuematch/shared';

// ── Component functions ──────────────────────────────────────────────────────

/**
 * Jaccard similarity: |intersection| / |union|
 * Case-insensitive.
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Cosine similarity on 4-dim vibe vectors.
 * Returns 0–1 (both vectors guaranteed non-negative).
 */
export function vibeCosineSimilarity(
  a: [number, number, number, number],
  b: [number, number, number, number],
): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < 4; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Cost alignment: 1 − |userCost − venueCost| / 3
 * Max difference is 3 (1 vs 4). Result 0–1.
 */
export function costAlignment(userCost: number, venueCost: number): number {
  return 1 - Math.abs(userCost - venueCost) / 3;
}

/**
 * Neighborhood match:
 *   1.0  if venue is in user's preferred list (or session mode — disabled)
 *   0.5  baseline otherwise
 */
export function neighborhoodMatch(
  neighborhood: string,
  preferred: string[],
  sessionMode = false,
): number {
  if (sessionMode) return 0.5; // neighborhood disabled during session mode
  if (!preferred.length) return 0.5;
  return preferred
    .map((n) => n.toLowerCase())
    .includes(neighborhood.toLowerCase())
    ? 1.0
    : 0.5;
}

/**
 * Quality score: overall_score / 5.0 (Google rating is 1–5)
 * Falls back to 0.5 if no rating.
 */
export function qualityScore(overallScore: number | undefined | null): number {
  if (!overallScore) return 0.5;
  return Math.min(1, overallScore / 5);
}

// ── Session blending ─────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Blend a session vector into the user's base vector.
 *   effective.genres = union(base.genres, session.genres)
 *   effective.vibe   = lerp(base.vibe, session.vibe, 0.6)  // 60% session-weighted
 *   effective.cost   = session.cost ?? base.cost
 */
export function blendSessionVector(base: VenueVector, session: VenueVector): VenueVector {
  const genreUnion = [...new Set([...base.genres, ...session.genres])];
  const blendedVibe: [number, number, number, number] = [
    lerp(base.vibe[0], session.vibe[0], 0.6),
    lerp(base.vibe[1], session.vibe[1], 0.6),
    lerp(base.vibe[2], session.vibe[2], 0.6),
    lerp(base.vibe[3], session.vibe[3], 0.6),
  ];
  return {
    genres: genreUnion,
    vibe: blendedVibe,
    cost: session.cost ?? base.cost,
  };
}

// ── Main scoring function ────────────────────────────────────────────────────

/**
 * Netflix-style match score (0–100).
 *
 * @param userVec            User's effective VenueVector (already blended with session if active)
 * @param venue              The venue to score
 * @param preferredNeighborhoods  User's preferred neighborhoods (from onboarding step 2)
 * @param rejectedVenues     Map of recently rejected venues
 * @param viewedVenues       Map of recently viewed venue timestamps
 * @param isSessionMode      True when a tonight session vector is active (disables neighborhood bonus)
 */
export function netflixMatchScore(
  userVec: VenueVector,
  venue: Venue,
  preferredNeighborhoods: string[],
  rejectedVenues: Record<string, RejectedVenue>,
  viewedVenues: Record<string, number>,
  isSessionMode = false,
): number {
  const vVec = venue.vectors;
  if (!vVec) {
    // Caller should fall back to 16-dim legacy scoring
    return -1;
  }

  const genreScore   = jaccardSimilarity(userVec.genres, vVec.genres);
  const vibeScore    = vibeCosineSimilarity(userVec.vibe, vVec.vibe);
  const costScore    = costAlignment(userVec.cost, vVec.cost);
  const neighScore   = neighborhoodMatch(venue.neighborhood, preferredNeighborhoods, isSessionMode);
  const qualScore    = qualityScore(venue.overall_score ?? venue.googleRating ?? undefined);

  const raw =
    SCORING.GENRE_WEIGHT        * genreScore  +
    SCORING.VIBE_WEIGHT         * vibeScore   +
    SCORING.COST_WEIGHT         * costScore   +
    SCORING.NEIGHBORHOOD_WEIGHT * neighScore  +
    SCORING.QUALITY_WEIGHT      * qualScore;

  let score = raw * 100;

  // Rejection penalty
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = Object.values(rejectedVenues || {}).filter(
    (r) => r.timestamp > sevenDaysAgo,
  );
  const rGenres = new Set(recent.flatMap((r) => r.genres));
  const rTags   = new Set(recent.flatMap((r) => r.vibe_tags));
  const venueGenres = (venue.music_genres || []).map((g) => g.toLowerCase());
  const gOverlap = venueGenres.filter((g) => rGenres.has(g)).length;
  const tOverlap = (venue.vibe_tags || []).filter((t) => rTags.has(t)).length;
  const rejectionPenalty = gOverlap >= 2 || tOverlap >= 2 ? 20 : gOverlap + tOverlap >= 2 ? 10 : 0;

  // Novelty penalty
  const lastViewed = viewedVenues?.[venue.id];
  const daysSince = lastViewed
    ? (Date.now() - lastViewed) / (1000 * 60 * 60 * 24)
    : 999;
  const noveltyPenalty = daysSince < 1 ? 10 : daysSince < 3 ? 5 : daysSince < 7 ? 2 : 0;

  return Math.max(0, Math.min(100, Math.round(score - rejectionPenalty - noveltyPenalty)));
}
