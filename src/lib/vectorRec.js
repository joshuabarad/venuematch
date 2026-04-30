import { VENUE_PROFILES, ARTIST_PROFILES, VECTOR_DIMS } from '../data/venueProfiles.js';

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

function averageVectors(vecs) {
  if (!vecs.length) return null;
  const len = vecs[0].length;
  const sum = new Array(len).fill(0);
  for (const v of vecs) for (let i = 0; i < len; i++) sum[i] += v[i];
  return sum.map(v => v / vecs.length);
}

/**
 * Maps genre keywords to dimension weights.
 * Used as a fallback when an artist isn't in ARTIST_PROFILES
 * (e.g. custom Spotify search results).
 */
const GENRE_DIM_WEIGHTS = {
  // dims: music_curation, energy, dance, late_night, underground, electronic,
  //       rnb_hiphop, jazz_world, live_music, queer, intimate, outdoor,
  //       exclusive, chill, diverse, local
  techno:       [0.85, 0.80, 0.85, 1.00, 0.90, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  house:        [0.85, 0.75, 0.85, 0.85, 0.75, 0.90, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  electronic:   [0.80, 0.65, 0.70, 0.75, 0.70, 0.85, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  disco:        [0.80, 0.70, 0.85, 0.70, 0.60, 0.65, 0.00, 0.00, 0.00, 0.60, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  rave:         [0.75, 0.90, 0.90, 1.00, 0.85, 0.90, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  bass:         [0.75, 0.85, 0.80, 0.80, 0.80, 0.85, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  ambient:      [0.85, 0.30, 0.20, 0.40, 0.75, 0.50, 0.00, 0.30, 0.00, 0.00, 0.80, 0.00, 0.00, 0.90, 0.00, 0.00],
  club:         [0.70, 0.85, 0.85, 0.80, 0.50, 0.70, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  'r&b':        [0.80, 0.65, 0.65, 0.50, 0.45, 0.00, 0.95, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  'hip-hop':    [0.80, 0.75, 0.65, 0.50, 0.55, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  rap:          [0.75, 0.80, 0.60, 0.45, 0.55, 0.00, 0.95, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  soul:         [0.85, 0.50, 0.55, 0.35, 0.45, 0.00, 0.80, 0.30, 0.55, 0.00, 0.00, 0.00, 0.00, 0.55, 0.00, 0.00],
  funk:         [0.75, 0.75, 0.80, 0.45, 0.45, 0.00, 0.70, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  jazz:         [0.95, 0.50, 0.45, 0.35, 0.65, 0.00, 0.00, 1.00, 0.90, 0.00, 0.80, 0.00, 0.00, 0.50, 0.00, 0.00],
  experimental: [0.95, 0.40, 0.25, 0.30, 0.90, 0.15, 0.00, 0.80, 0.70, 0.00, 0.75, 0.00, 0.00, 0.55, 0.00, 0.00],
  classical:    [0.95, 0.35, 0.20, 0.20, 0.50, 0.00, 0.00, 0.85, 0.90, 0.00, 0.80, 0.00, 0.00, 0.65, 0.00, 0.00],
  world:        [0.85, 0.55, 0.55, 0.35, 0.60, 0.00, 0.00, 0.80, 0.65, 0.00, 0.00, 0.00, 0.00, 0.00, 0.85, 0.00],
  afrobeats:    [0.80, 0.80, 0.90, 0.55, 0.55, 0.00, 0.45, 0.20, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.90, 0.00],
  afropop:      [0.75, 0.75, 0.85, 0.50, 0.50, 0.00, 0.55, 0.15, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.90, 0.00],
  amapiano:     [0.80, 0.75, 0.90, 0.55, 0.55, 0.50, 0.30, 0.10, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.85, 0.00],
  soca:         [0.70, 0.90, 0.95, 0.55, 0.40, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.85, 0.00],
  reggae:       [0.75, 0.65, 0.75, 0.45, 0.55, 0.00, 0.25, 0.20, 0.50, 0.00, 0.00, 0.00, 0.00, 0.50, 0.80, 0.00],
  dancehall:    [0.75, 0.85, 0.90, 0.55, 0.55, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.80, 0.00],
  reggaeton:    [0.70, 0.90, 0.90, 0.55, 0.35, 0.10, 0.45, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25, 0.75, 0.00],
  latin:        [0.70, 0.80, 0.85, 0.50, 0.30, 0.10, 0.35, 0.15, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.80, 0.00],
  indie:        [0.75, 0.60, 0.50, 0.45, 0.55, 0.15, 0.00, 0.00, 0.75, 0.00, 0.00, 0.00, 0.00, 0.50, 0.00, 0.00],
  'indie dance':[0.80, 0.70, 0.75, 0.65, 0.65, 0.60, 0.00, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00],
  pop:          [0.65, 0.65, 0.65, 0.40, 0.20, 0.20, 0.40, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.40, 0.00, 0.00],
  rock:         [0.70, 0.75, 0.45, 0.45, 0.50, 0.00, 0.00, 0.00, 0.85, 0.00, 0.00, 0.00, 0.00, 0.35, 0.00, 0.00],
  punk:         [0.65, 0.85, 0.40, 0.45, 0.70, 0.00, 0.00, 0.00, 0.85, 0.00, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00],
  folk:         [0.80, 0.35, 0.25, 0.30, 0.40, 0.00, 0.00, 0.30, 0.90, 0.00, 0.80, 0.55, 0.00, 0.80, 0.00, 0.00],
  acoustic:     [0.75, 0.30, 0.25, 0.25, 0.35, 0.00, 0.00, 0.25, 0.90, 0.00, 0.85, 0.00, 0.00, 0.80, 0.00, 0.00],
  'dream pop':  [0.80, 0.45, 0.45, 0.45, 0.65, 0.25, 0.20, 0.20, 0.70, 0.00, 0.75, 0.00, 0.00, 0.60, 0.00, 0.00],
  'k-indie':    [0.80, 0.55, 0.55, 0.50, 0.75, 0.50, 0.00, 0.00, 0.30, 0.00, 0.75, 0.00, 0.00, 0.50, 0.00, 0.00],
  'south asian':[0.85, 0.45, 0.35, 0.30, 0.70, 0.00, 0.00, 0.80, 0.75, 0.00, 0.75, 0.00, 0.00, 0.60, 0.80, 0.00],
};

/**
 * Derive a 16-dim vector from a list of genre strings.
 * Averages matched genre vectors; unmatched genres are ignored.
 * Returns null if no genres could be matched.
 */
function genresToVector(genres) {
  if (!genres?.length) return null;
  const matched = [];
  for (const genre of genres) {
    const lower = genre.toLowerCase();
    for (const [key, vec] of Object.entries(GENRE_DIM_WEIGHTS)) {
      if (lower.includes(key)) { matched.push(vec); break; }
    }
  }
  return matched.length ? averageVectors(matched) : null;
}

/**
 * Build a user preference vector from seed artists + seed venues.
 *
 * Priority per artist:
 *   1. ARTIST_PROFILES exact name match (hand-calibrated 16-dim vector)
 *   2. Genre-based vector derived from their Spotify genre tags
 *   3. Skipped (contributes nothing)
 *
 * Seed venue profiles are averaged in alongside artists so that
 * "Your spots" also shapes the recommendation vector.
 */
export function buildUserVector(seedArtists = [], seedArtistGenres = {}, seedVenueIds = []) {
  const artistVecs = seedArtists.map(name => {
    if (ARTIST_PROFILES[name]) return ARTIST_PROFILES[name];
    const genres = seedArtistGenres[name] || [];
    return genresToVector(genres);
  }).filter(Boolean);

  const venueVecs = seedVenueIds
    .map(id => VENUE_PROFILES[id]?.vec)
    .filter(Boolean);

  const allVecs = [...artistVecs, ...venueVecs];
  if (!allVecs.length) return new Array(16).fill(0.5);
  return averageVectors(allVecs);
}

/**
 * Build a group preference vector by averaging all members' derived vectors.
 */
export function buildGroupVector(members = []) {
  const memberVecs = members
    .map(m => buildUserVector(m.seedArtists || [], m.seedArtistGenres || {}, m.seedVenues || []))
    .filter(Boolean);

  if (!memberVecs.length) return new Array(16).fill(0.5);
  return averageVectors(memberVecs);
}

/**
 * Score a venue against a user vector using cosine similarity.
 * Returns 0–100.
 */
export function vectorMatchScore(venue, userVec) {
  const profile = VENUE_PROFILES[venue.id];
  if (!profile || !userVec) return 70;
  const sim = cosineSimilarity(userVec, profile.vec);
  return Math.round(Math.min(99, Math.max(50, sim * 100)));
}

export function rankVenues(venues, userVec) {
  return [...venues]
    .map(v => ({ ...v, _score: vectorMatchScore(v, userVec) }))
    .sort((a, b) => b._score - a._score);
}
