export type { Venue, VenueCoords } from './types/venue';
export type { VibeVector, UserPreferences, CustomSeedVenue, AppUser } from './types/user';
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
} as const;
