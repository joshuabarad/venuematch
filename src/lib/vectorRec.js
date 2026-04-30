import { VENUE_PROFILES, ARTIST_PROFILES } from '../data/venueProfiles.js';

function dotProduct(a, b) {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function magnitude(a) {
  return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
}

export function cosineSimilarity(a, b) {
  const mag = magnitude(a) * magnitude(b);
  if (mag === 0) return 0;
  return dotProduct(a, b) / mag;
}

/**
 * Average multiple vectors into one.
 */
function averageVectors(vecs) {
  if (!vecs.length) return null;
  const len = vecs[0].length;
  const sum = new Array(len).fill(0);
  for (const v of vecs) for (let i = 0; i < len; i++) sum[i] += v[i];
  return sum.map(v => v / vecs.length);
}

/**
 * Build a user preference vector from their selected seed artists.
 * Falls back to a neutral mid-range vector if no artists are selected.
 */
export function buildUserVector(seedArtists = []) {
  const artistVecs = seedArtists
    .map(name => ARTIST_PROFILES[name])
    .filter(Boolean);

  if (!artistVecs.length) return new Array(16).fill(0.5);
  return averageVectors(artistVecs);
}

/**
 * Build a group preference vector by averaging all members' artist-derived vectors.
 */
export function buildGroupVector(members = []) {
  const memberVecs = members
    .map(m => buildUserVector(m.seedArtists || []))
    .filter(Boolean);

  if (!memberVecs.length) return new Array(16).fill(0.5);
  return averageVectors(memberVecs);
}

/**
 * Score a venue against a user vector using cosine similarity.
 * Returns 0–100, normalised so good matches feel high (floor at ~60).
 */
export function vectorMatchScore(venue, userVec) {
  const profile = VENUE_PROFILES[venue.id];
  if (!profile || !userVec) return 70; // neutral fallback
  const sim = cosineSimilarity(userVec, profile.vec);
  // cosine sim on positive unit vectors is typically 0.7–0.99
  // map that range to ~60–99 so scores feel meaningful
  return Math.round(Math.min(99, Math.max(50, sim * 100)));
}

/**
 * Rank venues by vector match score, highest first.
 */
export function rankVenues(venues, userVec) {
  return [...venues]
    .map(v => ({ ...v, _score: vectorMatchScore(v, userVec) }))
    .sort((a, b) => b._score - a._score);
}
