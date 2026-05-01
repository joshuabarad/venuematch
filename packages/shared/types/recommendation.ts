export interface TonightAnswers {
  q1: string | null;
  q2: string | null;
  currentSong: string;
}

export interface DailyRec {
  venueId: string;
  matchScore: number;
  vibe: string;
  reason: string;
}

export type RecAction = 'saved' | 'not_tonight' | 'visited' | 'dismissed';

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  preview_url: string | null;
  image: string | null;
  imageLg: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  image: string | null;
  popularity: number;
}
