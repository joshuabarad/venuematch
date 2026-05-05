import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NYC_VENUES } from '../data/venues';
import { buildUserVector, buildGroupVector, vectorMatchScore } from '../lib/vectorRec';
import type {
  Venue,
  AppUser,
  UserPreferences,
  CustomSeedVenue,
  VenueRating,
  SaveStatus,
  RejectedVenue,
  TonightAnswers,
  DailyRec,
  Group,
  GroupMember,
  VibeVector,
} from '@venuematch/shared';

interface StoreState {
  // User
  user: AppUser | null;
  onboardingStep: number;
  onboardingComplete: boolean;
  prefs: UserPreferences;

  // Taste seeds
  seedVenues: string[];
  customSeedVenues: CustomSeedVenue[];
  seedArtists: string[];
  seedArtistGenres: Record<string, string[]>;

  // Ratings & saves
  venueRatings: Record<string, VenueRating>;
  savedVenues: Record<string, SaveStatus>;

  // Recommendations
  tonightsRec: DailyRec | null;
  lastRecDate: string | null;
  tonightAnswers: TonightAnswers;

  // Feedback signals
  rejectedVenues: Record<string, RejectedVenue>;
  viewedVenues: Record<string, number>;

  // Groups
  groups: Group[];
  activeGroupId: string | null;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Actions
  setUser: (user: AppUser) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  updatePrefs: (prefs: Partial<UserPreferences>) => void;

  toggleSeedVenue: (id: string) => void;
  toggleCustomSeedVenue: (venue: CustomSeedVenue) => void;
  toggleSeedArtist: (name: string, genres?: string[]) => void;

  setVenueRating: (venueId: string, dim: keyof VenueRating, val: number) => void;
  saveVenue: (venueId: string, status: SaveStatus) => void;
  unsaveVenue: (venueId: string) => void;

  setTonightsRec: (rec: DailyRec) => void;
  updateTonightAnswers: (answers: Partial<TonightAnswers>) => void;

  rejectVenue: (venue: Venue) => void;
  trackVenueView: (venueId: string) => void;

  createGroup: (name: string) => void;
  addGroupMember: (groupId: string, member: Omit<GroupMember, 'id'> & { id?: string }) => void;
  removeGroupMember: (groupId: string, memberId: string) => void;
  deleteGroup: (groupId: string) => void;
  setActiveGroup: (groupId: string | null) => void;

  // Server sync — hydrates store from API response on login
  syncFromServer: (payload: {
    userData: Record<string, unknown> | null;
    ratings: Array<{ venue_id: string; music_score: number; energy_score: number; dance_score: number; demo_score: number }>;
    saved: Array<{ venue_id: string; status: SaveStatus }>;
    rejections: Array<{ venue_id: string; genres: string[]; vibe_tags: string[]; rejected_at: string }>;
  }) => void;

  // Computed
  getGroupVibeVector: (groupId: string) => VibeVector | null;
  getVibeVector: () => VibeVector;
  getMatchScore: (venue: Venue) => number;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      onboardingStep: 0,
      onboardingComplete: false,
      prefs: { nights: [], purposes: [], travel_radius: 'borough', neighborhoods: [] },
      seedVenues: [],
      customSeedVenues: [],
      seedArtists: [],
      seedArtistGenres: {},
      venueRatings: {},
      savedVenues: {},
      tonightsRec: null,
      lastRecDate: null,
      tonightAnswers: { q1: null, q2: null, currentSong: '' },
      theme: 'dark' as 'dark' | 'light',
      rejectedVenues: {},
      viewedVenues: {},
      groups: [],
      activeGroupId: null,

      setTheme: (theme) => set({ theme }),
      setUser: (user) => set({ user }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: 5 }),
      updatePrefs: (prefs) => set((s) => ({ prefs: { ...s.prefs, ...prefs } })),

      toggleSeedVenue: (id) =>
        set((s) => ({
          seedVenues: s.seedVenues.includes(id)
            ? s.seedVenues.filter((x) => x !== id)
            : s.seedVenues.length < 5
            ? [...s.seedVenues, id]
            : s.seedVenues,
        })),

      toggleCustomSeedVenue: (venue) =>
        set((s) => {
          const has = s.customSeedVenues.some((v) => v.id === venue.id);
          const total = s.seedVenues.length + s.customSeedVenues.length;
          return {
            customSeedVenues: has
              ? s.customSeedVenues.filter((v) => v.id !== venue.id)
              : total < 5
              ? [...s.customSeedVenues, venue]
              : s.customSeedVenues,
          };
        }),

      toggleSeedArtist: (name, genres = []) =>
        set((s) => {
          const has = s.seedArtists.includes(name);
          const newArtists = has
            ? s.seedArtists.filter((x) => x !== name)
            : s.seedArtists.length < 5
            ? [...s.seedArtists, name]
            : s.seedArtists;
          const newGenres = { ...s.seedArtistGenres };
          if (has) delete newGenres[name];
          else if (genres.length) newGenres[name] = genres;
          return { seedArtists: newArtists, seedArtistGenres: newGenres };
        }),

      setVenueRating: (venueId, dim, val) =>
        set((s) => ({
          venueRatings: {
            ...s.venueRatings,
            [venueId]: {
              ...(s.venueRatings[venueId] || { music: 3, energy: 3, dance: 3, demo: 3 }),
              [dim]: val,
            },
          },
        })),

      saveVenue: (venueId, status) =>
        set((s) => ({ savedVenues: { ...s.savedVenues, [venueId]: status } })),

      unsaveVenue: (venueId) =>
        set((s) => {
          const sv = { ...s.savedVenues };
          delete sv[venueId];
          return { savedVenues: sv };
        }),

      setTonightsRec: (rec) =>
        set({ tonightsRec: rec, lastRecDate: new Date().toDateString() }),

      updateTonightAnswers: (answers) =>
        set((s) => ({ tonightAnswers: { ...s.tonightAnswers, ...answers } })),

      rejectVenue: (venue) =>
        set((s) => ({
          rejectedVenues: {
            ...s.rejectedVenues,
            [venue.id]: {
              timestamp: Date.now(),
              genres: venue.music_genres,
              vibe_tags: venue.vibe_tags,
            },
          },
        })),

      trackVenueView: (venueId) =>
        set((s) => ({
          viewedVenues: { ...s.viewedVenues, [venueId]: Date.now() },
        })),

      createGroup: (name) =>
        set((s) => {
          const code = Math.random().toString(36).slice(2, 8).toUpperCase();
          const group: Group = {
            id: `g_${Date.now()}`,
            name,
            code,
            createdAt: Date.now(),
            members: [
              {
                id: 'me',
                name: s.user?.name?.split(' ')[0] || 'You',
                seedVenues: s.seedVenues,
                seedArtists: s.seedArtists,
              },
            ],
          };
          return { groups: [...s.groups, group] };
        }),

      addGroupMember: (groupId, member) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: [...g.members, { id: `m_${Date.now()}`, ...member }] }
              : g
          ),
        })),

      removeGroupMember: (groupId, memberId) =>
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
              : g
          ),
        })),

      deleteGroup: (groupId) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== groupId),
          activeGroupId: s.activeGroupId === groupId ? null : s.activeGroupId,
        })),

      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

      syncFromServer: ({ userData, ratings, saved, rejections }) => {
        const patch: Partial<StoreState> = {};

        if (userData) {
          if (userData.onboarding_complete) patch.onboardingComplete = userData.onboarding_complete as boolean;
          if (userData.name) patch.user = { ...(get().user ?? { id: '', email: '' }), name: userData.name as string };
          if (userData.seed_venues) patch.seedVenues = userData.seed_venues as string[];
          if (userData.seed_artists) patch.seedArtists = userData.seed_artists as string[];
          if (userData.seed_artist_genres) patch.seedArtistGenres = userData.seed_artist_genres as Record<string, string[]>;
          if (userData.custom_seed_venues) patch.customSeedVenues = userData.custom_seed_venues as CustomSeedVenue[];
          if (userData.prefs) patch.prefs = userData.prefs as UserPreferences;
        }

        if (ratings.length > 0) {
          const venueRatings: Record<string, VenueRating> = {};
          for (const r of ratings) {
            venueRatings[r.venue_id] = { music: r.music_score, energy: r.energy_score, dance: r.dance_score, demo: r.demo_score };
          }
          patch.venueRatings = venueRatings;
        }

        if (saved.length > 0) {
          const savedVenues: Record<string, SaveStatus> = {};
          for (const s of saved) savedVenues[s.venue_id] = s.status;
          patch.savedVenues = savedVenues;
        }

        if (rejections.length > 0) {
          const rejectedVenues: Record<string, RejectedVenue> = {};
          for (const r of rejections) {
            rejectedVenues[r.venue_id] = { timestamp: new Date(r.rejected_at).getTime(), genres: r.genres, vibe_tags: r.vibe_tags };
          }
          patch.rejectedVenues = rejectedVenues;
        }

        set(patch);
      },

      getGroupVibeVector: (groupId) => {
        const { groups } = get();
        const group = groups.find((g) => g.id === groupId);
        if (!group || !group.members.length) return null;
        const memberVectors = group.members.map((member) => {
          const seeded = NYC_VENUES.filter((v) =>
            (member.seedVenues || []).includes(v.id)
          );
          if (!seeded.length) return { music: 3, energy: 3, dance: 3, demo: 3 };
          const avg = (key: keyof Venue) =>
            seeded.reduce((s, v) => s + (v[key] as number), 0) / seeded.length;
          return {
            music: avg('music_score'),
            energy: avg('energy_score'),
            dance: avg('dance_score'),
            demo: avg('demo_score'),
          };
        });
        const avg = (key: 'music' | 'energy' | 'dance' | 'demo') =>
          memberVectors.reduce((s, v) => s + v[key], 0) / memberVectors.length;
        return { music: avg('music'), energy: avg('energy'), dance: avg('dance'), demo: avg('demo') };
      },

      getVibeVector: () => {
        const { venueRatings, seedArtists, seedVenues, seedArtistGenres, customSeedVenues } =
          get();
        const ratings = Object.values(venueRatings);
        const ratedCount = ratings.length;
        const avg = (key: keyof VenueRating) =>
          ratedCount > 0
            ? ratings.reduce((s, r) => s + (r[key] || 3), 0) / ratedCount
            : 3;
        return {
          music: avg('music'),
          energy: avg('energy'),
          dance: avg('dance'),
          demo: avg('demo'),
          ratedCount,
          seedArtists,
          seedArtistGenres,
          seedVenues,
          customSeedVenues,
        };
      },

      getMatchScore: (venue) => {
        const {
          activeGroupId,
          seedArtists,
          seedArtistGenres,
          seedVenues,
          customSeedVenues,
          groups,
          prefs,
          rejectedVenues,
          viewedVenues,
        } = get();

        // Build 16-dim user vector (or group average)
        const userVec = activeGroupId
          ? (() => {
              const group = groups.find((g) => g.id === activeGroupId);
              return group
                ? buildGroupVector(group.members)
                : buildUserVector(seedArtists, seedArtistGenres, seedVenues, customSeedVenues);
            })()
          : buildUserVector(seedArtists, seedArtistGenres, seedVenues, customSeedVenues);

        // Base cosine similarity score (50–99)
        let score = vectorMatchScore(venue, userVec);

        // Neighborhood affinity bonus
        if (prefs?.neighborhoods?.length && prefs.neighborhoods.includes(venue.neighborhood)) {
          score = Math.min(99, score + 3);
        }

        // Rejection penalty
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = Object.values(rejectedVenues || {}).filter((r) => r.timestamp > sevenDaysAgo);
        const rGenres = new Set(recent.flatMap((r) => r.genres));
        const rTags   = new Set(recent.flatMap((r) => r.vibe_tags));
        const venueGenres = venue.music_genres.map((g) => g.toLowerCase());
        const gOverlap = venueGenres.filter((g) => rGenres.has(g)).length;
        const tOverlap = (venue.vibe_tags || []).filter((t) => rTags.has(t)).length;
        const rejectionPenalty = gOverlap >= 2 || tOverlap >= 2 ? 20 : gOverlap + tOverlap >= 2 ? 10 : 0;

        // Novelty penalty
        const lastViewed = viewedVenues?.[venue.id];
        const daysSince = lastViewed ? (Date.now() - lastViewed) / (1000 * 60 * 60 * 24) : 999;
        const noveltyPenalty = daysSince < 1 ? 10 : daysSince < 3 ? 5 : daysSince < 7 ? 2 : 0;

        return Math.max(0, Math.min(100, score - rejectionPenalty - noveltyPenalty));
      },
    }),
    { name: 'venuematch-store', version: 2 }
  )
);
