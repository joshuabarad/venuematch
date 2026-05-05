export interface VibeVector {
  music: number;
  energy: number;
  dance: number;
  demo: number;
  ratedCount?: number;
  seedArtists?: string[];
  seedArtistGenres?: Record<string, string[]>;
  seedVenues?: string[];
  customSeedVenues?: CustomSeedVenue[];
}

export interface UserPreferences {
  nights: string[];
  purposes: string[];
  travel_radius: string;
  neighborhoods: string[];
}

export interface CustomSeedVenue {
  id: string;
  name: string;
  neighborhood: string;
  photo?: string | null;
  address?: string;
  source?: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  // v2: Netflix-style user vector (set at end of onboarding step 4)
  vectors?: import('./venue').VenueVector | null;
  preferred_neighborhoods?: string[];
}

// 16-dimensional user preference vector derived from seed artists + venues (legacy fallback)
export type LegacyUserVector = number[];
/** @deprecated Use LegacyUserVector. Kept for backward compatibility. */
export type UserVector = LegacyUserVector;
