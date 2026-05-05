export type { Venue, VenueCoords, VenueVector } from './types/venue';
export type { VibeVector, UserPreferences, CustomSeedVenue, AppUser, UserVector, LegacyUserVector } from './types/user';
export type { VenueRating, SaveStatus, RejectedVenue } from './types/rating';
export type {
  TonightAnswers,
  DailyRec,
  RecAction,
  SpotifyTrack,
  SpotifyArtist,
} from './types/recommendation';
export type { GroupMember, Group } from './types/group';

export const SCORING = {
  // Legacy 4-dim scoring (fallback when venue.vectors is null)
  BASE_MAX: 70,
  PURPOSE_MAX: 10,
  NEIGHBORHOOD_MAX: 5,
  GENRE_MAX: 8,
  POPULARITY_MAX: 7,
  REJECTION_PENALTY_STRONG: -20,
  REJECTION_PENALTY_WEAK: -10,
  NOVELTY_PENALTY_MAX: -10,
  NOVELTY_DECAY_DAYS: 7,
  RATING_WEIGHT: 0.6,
  SEED_WEIGHT: 0.4,
  // v2: Netflix-style weights (used when venue.vectors is populated)
  GENRE_WEIGHT: 0.35,
  VIBE_WEIGHT: 0.30,
  COST_WEIGHT: 0.15,
  NEIGHBORHOOD_WEIGHT: 0.10,
  QUALITY_WEIGHT: 0.10,
} as const;
