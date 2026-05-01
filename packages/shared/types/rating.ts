export interface VenueRating {
  music: number;
  energy: number;
  dance: number;
  demo: number;
}

export type SaveStatus = 'want_to_visit' | 'visited';

export interface RejectedVenue {
  timestamp: number;
  genres: string[];
  vibe_tags: string[];
}
