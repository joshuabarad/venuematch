import { VENUE_PROFILES, ARTIST_PROFILES } from '../data/venueProfiles';
import type { Venue, CustomSeedVenue } from '@venuematch/shared';

export type UserVector = number[]; // 16-dim, all 0–1

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const mag = magnitude(a) * magnitude(b);
  if (mag === 0) return 0;
  return dotProduct(a, b) / mag;
}

function averageVectors(vecs: number[][]): number[] {
  if (!vecs.length) return new Array(16).fill(0.5);
  const len = vecs[0].length;
  const sum = new Array(len).fill(0);
  for (const v of vecs) for (let i = 0; i < len; i++) sum[i] += v[i];
  return sum.map((v) => v / vecs.length);
}

// dims: music_curation, energy, dance, late_night, underground, electronic,
//       rnb_hiphop, jazz_world, live_music, queer, intimate, outdoor,
//       exclusive, chill, diverse, local
const GENRE_DIM_WEIGHTS: Record<string, number[]> = {
  techno:        [0.85, 0.80, 0.85, 1.00, 0.90, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  house:         [0.85, 0.75, 0.85, 0.85, 0.75, 0.90, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  electronic:    [0.80, 0.65, 0.70, 0.75, 0.70, 0.85, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  disco:         [0.80, 0.70, 0.85, 0.70, 0.60, 0.65, 0.00, 0.00, 0.00, 0.60, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  rave:          [0.75, 0.90, 0.90, 1.00, 0.85, 0.90, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  bass:          [0.75, 0.85, 0.80, 0.80, 0.80, 0.85, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  ambient:       [0.85, 0.30, 0.20, 0.40, 0.75, 0.50, 0.00, 0.30, 0.00, 0.00, 0.80, 0.00, 0.00, 0.90, 0.00, 0.00],
  club:          [0.70, 0.85, 0.85, 0.80, 0.50, 0.70, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  'r&b':         [0.80, 0.65, 0.65, 0.50, 0.45, 0.00, 0.95, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  'hip-hop':     [0.80, 0.75, 0.65, 0.50, 0.55, 0.00, 1.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  rap:           [0.75, 0.80, 0.60, 0.45, 0.55, 0.00, 0.95, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  soul:          [0.85, 0.50, 0.55, 0.35, 0.45, 0.00, 0.80, 0.30, 0.55, 0.00, 0.00, 0.00, 0.00, 0.55, 0.00, 0.00],
  funk:          [0.75, 0.75, 0.80, 0.45, 0.45, 0.00, 0.70, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
  jazz:          [0.95, 0.50, 0.45, 0.35, 0.65, 0.00, 0.00, 1.00, 0.90, 0.00, 0.80, 0.00, 0.00, 0.50, 0.00, 0.00],
  experimental:  [0.95, 0.40, 0.25, 0.30, 0.90, 0.15, 0.00, 0.80, 0.70, 0.00, 0.75, 0.00, 0.00, 0.55, 0.00, 0.00],
  classical:     [0.95, 0.35, 0.20, 0.20, 0.50, 0.00, 0.00, 0.85, 0.90, 0.00, 0.80, 0.00, 0.00, 0.65, 0.00, 0.00],
  world:         [0.85, 0.55, 0.55, 0.35, 0.60, 0.00, 0.00, 0.80, 0.65, 0.00, 0.00, 0.00, 0.00, 0.00, 0.85, 0.00],
  afrobeats:     [0.80, 0.80, 0.90, 0.55, 0.55, 0.00, 0.45, 0.20, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.90, 0.00],
  afropop:       [0.75, 0.75, 0.85, 0.50, 0.50, 0.00, 0.55, 0.15, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.90, 0.00],
  amapiano:      [0.80, 0.75, 0.90, 0.55, 0.55, 0.50, 0.30, 0.10, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.85, 0.00],
  soca:          [0.70, 0.90, 0.95, 0.55, 0.40, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.85, 0.00],
  reggae:        [0.75, 0.65, 0.75, 0.45, 0.55, 0.00, 0.25, 0.20, 0.50, 0.00, 0.00, 0.00, 0.00, 0.50, 0.80, 0.00],
  dancehall:     [0.75, 0.85, 0.90, 0.55, 0.55, 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.80, 0.00],
  reggaeton:     [0.70, 0.90, 0.90, 0.55, 0.35, 0.10, 0.45, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25, 0.75, 0.00],
  latin:         [0.70, 0.80, 0.85, 0.50, 0.30, 0.10, 0.35, 0.15, 0.00, 0.00, 0.00, 0.00, 0.00, 0.30, 0.80, 0.00],
  indie:         [0.75, 0.60, 0.50, 0.45, 0.55, 0.15, 0.00, 0.00, 0.75, 0.00, 0.00, 0.00, 0.00, 0.50, 0.00, 0.00],
  'indie dance': [0.80, 0.70, 0.75, 0.65, 0.65, 0.60, 0.00, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00],
  pop:           [0.65, 0.65, 0.65, 0.40, 0.20, 0.20, 0.40, 0.00, 0.30, 0.00, 0.00, 0.00, 0.00, 0.40, 0.00, 0.00],
  rock:          [0.70, 0.75, 0.45, 0.45, 0.50, 0.00, 0.00, 0.00, 0.85, 0.00, 0.00, 0.00, 0.00, 0.35, 0.00, 0.00],
  punk:          [0.65, 0.85, 0.40, 0.45, 0.70, 0.00, 0.00, 0.00, 0.85, 0.00, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00],
  folk:          [0.80, 0.35, 0.25, 0.30, 0.40, 0.00, 0.00, 0.30, 0.90, 0.00, 0.80, 0.55, 0.00, 0.80, 0.00, 0.00],
  acoustic:      [0.75, 0.30, 0.25, 0.25, 0.35, 0.00, 0.00, 0.25, 0.90, 0.00, 0.85, 0.00, 0.00, 0.80, 0.00, 0.00],
  'dream pop':   [0.80, 0.45, 0.45, 0.45, 0.65, 0.25, 0.20, 0.20, 0.70, 0.00, 0.75, 0.00, 0.00, 0.60, 0.00, 0.00],
  'k-indie':     [0.80, 0.55, 0.55, 0.50, 0.75, 0.50, 0.00, 0.00, 0.30, 0.00, 0.75, 0.00, 0.00, 0.50, 0.00, 0.00],
  'south asian': [0.85, 0.45, 0.35, 0.30, 0.70, 0.00, 0.00, 0.80, 0.75, 0.00, 0.75, 0.00, 0.00, 0.60, 0.80, 0.00],
};

function genresToVector(genres: string[]): number[] | null {
  if (!genres?.length) return null;
  const matched: number[][] = [];
  for (const genre of genres) {
    const lower = genre.toLowerCase();
    for (const [key, vec] of Object.entries(GENRE_DIM_WEIGHTS)) {
      if (lower.includes(key)) { matched.push(vec); break; }
    }
  }
  return matched.length ? averageVectors(matched) : null;
}

export function placesToVector(place: {
  types?: string[];
  name?: string;
  editorialSummary?: { text?: string } | null;
  primaryTypeDisplayName?: { text?: string } | null;
  vibe_tags?: string[];
  regularOpeningHours?: { periods?: Array<{ close?: { time?: string } }> } | null;
  priceLevel?: number;
}): number[] {
  const vec = new Array(16).fill(0.3);
  const types = place.types || [];
  const text = [
    place.name || '',
    place.editorialSummary?.text || '',
    place.primaryTypeDisplayName?.text || '',
    (place.vibe_tags || []).join(' '),
  ].join(' ').toLowerCase();

  const isClub   = types.includes('night_club') || /nightclub|dance club/.test(text);
  const isBar    = types.includes('bar') || /\bbar\b/.test(text);
  const isLive   = types.includes('concert_hall') || types.includes('music_venue') || /live music|concert|band/.test(text);
  const isLounge = /lounge|speakeasy|supper club/.test(text);

  vec[0] = /jazz|classical|curated|underground|experimental/.test(text) ? 0.88 : isLive ? 0.78 : isClub ? 0.72 : 0.52;
  vec[1] = isClub ? 0.85 : isBar && /dive|punk|rock/.test(text) ? 0.65 : isLounge ? 0.40 : 0.50;
  vec[2] = isClub || /danc|floor/.test(text) ? 0.82 : isBar ? 0.35 : 0.25;

  const periods = place.regularOpeningHours?.periods || [];
  const closesLate = periods.some((p) => {
    const t = p.close?.time ? parseInt(p.close.time, 10) : null;
    return t !== null && t >= 200 && t <= 600;
  });
  vec[3] = closesLate ? 0.88 : isClub ? 0.70 : isBar ? 0.50 : 0.25;

  vec[4]  = /underground|basement|no.frills|dive/.test(text) ? 0.78 : isClub ? 0.48 : 0.22;
  vec[5]  = /techno|house|edm|electronic|rave/.test(text) ? 0.88 : isClub ? 0.50 : 0.15;
  vec[6]  = /r&b|hip.hop|rap|soul|funk/.test(text) ? 0.85 : 0.22;
  vec[7]  = /jazz|blues|world|global|afro|latin|bossa|salsa|cumbia/.test(text) ? 0.85 : 0.18;
  vec[8]  = isLive ? 0.88 : /acoustic|open mic|performer/.test(text) ? 0.60 : isClub ? 0.20 : 0.30;
  vec[9]  = /queer|lgbtq|gay|lesbian|drag/.test(text) ? 0.85 : 0.12;
  vec[10] = /intimate|cozy|small|tiny|underground/.test(text) ? 0.82 : isClub ? 0.22 : 0.55;
  vec[11] = /outdoor|garden|rooftop|patio|terrace/.test(text) ? 0.82 : 0.12;
  vec[12] = [0.05, 0.12, 0.38, 0.68, 0.90][Math.min(place.priceLevel ?? 1, 4)];
  vec[13] = isLounge || /chill|mellow|relaxed|wine/.test(text) ? 0.72 : isClub ? 0.18 : isBar ? 0.60 : 0.48;
  vec[14] = /multicultural|diverse|international|caribbean|afro|latin/.test(text) ? 0.75 : 0.38;
  vec[15] = /neighborhood|local|community|institution/.test(text) ? 0.78 : 0.38;

  return vec;
}

export function buildUserVector(
  seedArtists: string[] = [],
  seedArtistGenres: Record<string, string[]> = {},
  seedVenueIds: string[] = [],
  customVenues: CustomSeedVenue[] = [],
): UserVector {
  const artistVecs = seedArtists
    .map((name) => ARTIST_PROFILES[name] ?? genresToVector(seedArtistGenres[name] || []))
    .filter((v): v is number[] => v !== null);

  const staticVenueVecs = seedVenueIds
    .map((id) => VENUE_PROFILES[id]?.vec)
    .filter((v): v is number[] => Boolean(v));

  const customVenueVecs = customVenues
    .map((v) => placesToVector(v as Parameters<typeof placesToVector>[0]))
    .filter(Boolean) as number[][];

  const allVecs = [...artistVecs, ...staticVenueVecs, ...customVenueVecs];
  return allVecs.length ? averageVectors(allVecs) : new Array(16).fill(0.5);
}

export function buildGroupVector(
  members: Array<{ seedArtists?: string[]; seedArtistGenres?: Record<string, string[]>; seedVenues?: string[] }> = [],
): UserVector {
  const memberVecs = members.map((m) =>
    buildUserVector(m.seedArtists || [], m.seedArtistGenres || {}, m.seedVenues || [])
  );
  return memberVecs.length ? averageVectors(memberVecs) : new Array(16).fill(0.5);
}

export function vectorMatchScore(venue: Venue, userVec: UserVector): number {
  const profile = VENUE_PROFILES[venue.id];
  if (!profile || !userVec) return 70;
  const sim = cosineSimilarity(userVec, profile.vec);
  return Math.round(Math.min(99, Math.max(50, sim * 100)));
}

export function rankVenues(venues: Venue[], userVec: UserVector): Venue[] {
  return [...venues].sort(
    (a, b) => vectorMatchScore(b, userVec) - vectorMatchScore(a, userVec)
  );
}
