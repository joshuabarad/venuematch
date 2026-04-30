import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NYC_VENUES } from '../data/venues.js';
import { buildUserVector, buildGroupVector, vectorMatchScore } from '../lib/vectorRec.js';

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      onboardingStep: 0,
      onboardingComplete: false,
      prefs: { nights: [], purposes: [], travel_radius: 'borough', neighborhoods: [] },
      seedVenues: [],          // curated venue IDs
      customSeedVenues: [],    // [{id, name, neighborhood, photo}] from Google Places
      seedArtists: [],         // array of name strings (for compatibility)
      seedArtistGenres: {},    // { name: [genres] }
      venueRatings: {},
      savedVenues: {},
      tonightsRec: null,
      lastRecDate: null,
      tonightAnswers: { q1: null, q2: null, currentSong: '' },
      groups: [],
      activeGroupId: null,

      setUser: (user) => set({ user }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: 5 }),
      updatePrefs: (prefs) => set(s => ({ prefs: { ...s.prefs, ...prefs } })),

      toggleSeedVenue: (id) => set(s => ({
        seedVenues: s.seedVenues.includes(id)
          ? s.seedVenues.filter(x => x !== id)
          : s.seedVenues.length < 5 ? [...s.seedVenues, id] : s.seedVenues
      })),

      toggleCustomSeedVenue: (venue) => set(s => {
        const has = s.customSeedVenues.some(v => v.id === venue.id);
        const total = s.seedVenues.length + s.customSeedVenues.length;
        return {
          customSeedVenues: has
            ? s.customSeedVenues.filter(v => v.id !== venue.id)
            : total < 5 ? [...s.customSeedVenues, venue] : s.customSeedVenues,
        };
      }),

      toggleSeedArtist: (name, genres = []) => set(s => {
        const has = s.seedArtists.includes(name);
        const newArtists = has
          ? s.seedArtists.filter(x => x !== name)
          : s.seedArtists.length < 5 ? [...s.seedArtists, name] : s.seedArtists;
        const newGenres = { ...s.seedArtistGenres };
        if (has) delete newGenres[name];
        else if (genres.length) newGenres[name] = genres;
        return { seedArtists: newArtists, seedArtistGenres: newGenres };
      }),

      setVenueRating: (venueId, dim, val) => set(s => ({
        venueRatings: {
          ...s.venueRatings,
          [venueId]: { ...(s.venueRatings[venueId] || { music: 3, energy: 3, dance: 3, demo: 3 }), [dim]: val }
        }
      })),

      saveVenue: (venueId, status) => set(s => ({ savedVenues: { ...s.savedVenues, [venueId]: status } })),
      unsaveVenue: (venueId) => set(s => { const sv = { ...s.savedVenues }; delete sv[venueId]; return { savedVenues: sv }; }),

      setTonightsRec: (rec) => set({ tonightsRec: rec, lastRecDate: new Date().toDateString() }),
      updateTonightAnswers: (answers) => set(s => ({ tonightAnswers: { ...s.tonightAnswers, ...answers } })),

      createGroup: (name) => set(s => {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const group = {
          id: `g_${Date.now()}`,
          name,
          code,
          createdAt: Date.now(),
          members: [{
            id: 'me',
            name: s.user?.name?.split(' ')[0] || 'You',
            seedVenues: s.seedVenues,
            seedArtists: s.seedArtists,
          }],
        };
        return { groups: [...s.groups, group] };
      }),

      addGroupMember: (groupId, member) => set(s => ({
        groups: s.groups.map(g =>
          g.id === groupId ? { ...g, members: [...g.members, { id: `m_${Date.now()}`, ...member }] } : g
        ),
      })),

      removeGroupMember: (groupId, memberId) => set(s => ({
        groups: s.groups.map(g =>
          g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g
        ),
      })),

      deleteGroup: (groupId) => set(s => ({
        groups: s.groups.filter(g => g.id !== groupId),
        activeGroupId: s.activeGroupId === groupId ? null : s.activeGroupId,
      })),

      setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

      getGroupVibeVector: (groupId) => {
        const { groups } = get();
        const group = groups.find(g => g.id === groupId);
        if (!group || !group.members.length) return null;
        return buildGroupVector(group.members);
      },

      // Returns a 16-dim preference vector for Claude / Tonight's Pick context
      getVibeVector: () => {
        const { seedArtists, seedArtistGenres, seedVenues, customSeedVenues } = get();
        return { seedArtists, seedArtistGenres, seedVenues, customSeedVenues };
      },

      // Returns the raw 16-dim float array for vector similarity
      getVectorEmbedding: () => {
        const { seedArtists, seedArtistGenres, seedVenues } = get();
        return buildUserVector(seedArtists, seedArtistGenres, seedVenues);
      },

      getMatchScore: (venue) => {
        const { activeGroupId, groups, seedArtists, seedArtistGenres, seedVenues } = get();
        let userVec;
        if (activeGroupId) {
          const group = groups.find(g => g.id === activeGroupId);
          userVec = group ? buildGroupVector(group.members) : buildUserVector(seedArtists, seedArtistGenres, seedVenues);
        } else {
          userVec = buildUserVector(seedArtists, seedArtistGenres, seedVenues);
        }
        return vectorMatchScore(venue, userVec);
      },
    }),
    { name: 'venuematch-store', version: 1 }
  )
);
