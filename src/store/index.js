import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      onboardingStep: 0,
      onboardingComplete: false,
      prefs: { nights: [], purposes: [], travel_radius: 'borough', neighborhoods: [] },
      seedVenues: [],
      seedArtists: [],
      venueRatings: {},
      savedVenues: {},
      tonightsRec: null,
      lastRecDate: null,
      tonightAnswers: { q1: null, q2: null, currentSong: '' },

      setUser: (user) => set({ user }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      completeOnboarding: () => set({ onboardingComplete: true, onboardingStep: 5 }),
      updatePrefs: (prefs) => set(s => ({ prefs: { ...s.prefs, ...prefs } })),

      toggleSeedVenue: (id) => set(s => ({
        seedVenues: s.seedVenues.includes(id)
          ? s.seedVenues.filter(x => x !== id)
          : s.seedVenues.length < 5 ? [...s.seedVenues, id] : s.seedVenues
      })),

      toggleSeedArtist: (id) => set(s => ({
        seedArtists: s.seedArtists.includes(id)
          ? s.seedArtists.filter(x => x !== id)
          : s.seedArtists.length < 5 ? [...s.seedArtists, id] : s.seedArtists
      })),

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

      getVibeVector: () => {
        const { venueRatings, seedArtists, seedVenues } = get();
        const ratings = Object.values(venueRatings);
        if (ratings.length === 0) return { music: 3, energy: 3, dance: 3, demo: 3 };
        const avg = (key) => ratings.reduce((s, r) => s + (r[key] || 3), 0) / ratings.length;
        return { music: avg('music'), energy: avg('energy'), dance: avg('dance'), demo: avg('demo'), seedArtists, seedVenues };
      },

      getMatchScore: (venue) => {
        const v = get().getVibeVector();
        const dims = ['music_score', 'energy_score', 'dance_score', 'demo_score'];
        const keys = ['music', 'energy', 'dance', 'demo'];
        let score = 0;
        dims.forEach((d, i) => { const u = v[keys[i]] || 3; score += 1 - Math.abs(u - venue[d]) / 5; });
        return Math.round((score / dims.length) * 100);
      },
    }),
    { name: 'venuematch-store', version: 1 }
  )
);
