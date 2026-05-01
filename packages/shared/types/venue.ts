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
}

export interface VenueCoords {
  [venueId: string]: [number, number]; // [lat, lng]
}
