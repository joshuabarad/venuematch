/**
 * Shared vector sub-model used by both Venue and AppUser.
 * Enables the Netflix-style 5-component match score.
 */
export interface VenueVector {
  /** Genre tags, e.g. ["techno", "house", "electronic"] */
  genres: string[];
  /**
   * 4-dim vibe: [energy, underground, social, dance]
   * Each dimension is 0–1.
   * energy:     0 = mellow lounge  → 1 = high-energy club
   * underground:0 = mainstream     → 1 = underground/alternative
   * social:     0 = listening crowd→ 1 = mixer/meetup crowd
   * dance:      0 = standing bar   → 1 = dance-floor focus
   */
  vibe: [number, number, number, number];
  /** Cost scale: 1 = free/cheap, 2 = moderate, 3 = pricier, 4 = high-end */
  cost: number;
}

export interface Venue {
  id: string;
  name: string;
  neighborhood: string;
  address?: string;
  description?: string;
  vibe_tags: string[];
  music_genres: string[];
  music_score: number;
  energy_score: number;
  dance_score: number;
  demo_score: number;
  crowd_desc?: string;
  hours?: string;
  img_color: string;
  // Google Places enrichment (populated at runtime)
  photo?: string | null;
  googleRating?: number | null;
  reviewCount?: number;
  isOpenNow?: boolean | null;
  editorialSummary?: string | null;
  // v2: Netflix-style vectors (populated by enrichment pipeline)
  vectors?: VenueVector | null;
  overall_score?: number | null;
}

export interface VenueCoords {
  [venueId: string]: [number, number]; // [lat, lng]
}
