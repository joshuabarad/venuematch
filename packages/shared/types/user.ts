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
}
