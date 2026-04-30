import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NYC_VENUES } from '../data/venues.js';

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
      rejectedVenues: {},   // { [venueId]: { timestamp, genres, vibe_tags } }
      viewedVenues: {},     // { [venueId]: timestamp (ms) }
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

      rejectVenue: (venue) => set(s => ({
        rejectedVenues: {
          ...s.rejectedVenues,
          [venue.id]: { timestamp: Date.now(), genres: venue.music_genres, vibe_tags: venue.vibe_tags },
        },
      })),

      trackVenueView: (venueId) => set(s => ({
        viewedVenues: { ...s.viewedVenues, [venueId]: Date.now() },
      })),

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
        const memberVectors = group.members.map(member => {
          const seeded = NYC_VENUES.filter(v => (member.seedVenues || []).includes(v.id));
          if (!seeded.length) return { music: 3, energy: 3, dance: 3, demo: 3 };
          const avg = key => seeded.reduce((s, v) => s + v[key], 0) / seeded.length;
          return { music: avg('music_score'), energy: avg('energy_score'), dance: avg('dance_score'), demo: avg('demo_score') };
        });
        const avg = key => memberVectors.reduce((s, v) => s + v[key], 0) / memberVectors.length;
        return { music: avg('music'), energy: avg('energy'), dance: avg('dance'), demo: avg('demo') };
      },

      getVibeVector: () => {
        const { venueRatings, seedArtists, seedVenues, seedArtistGenres, customSeedVenues } = get();
        const ratings = Object.values(venueRatings);
        const ratedCount = ratings.length;
        const avg = (key) => ratedCount > 0
          ? ratings.reduce((s, r) => s + (r[key] || 3), 0) / ratedCount
          : 3;
        return { music: avg('music'), energy: avg('energy'), dance: avg('dance'), demo: avg('demo'), ratedCount, seedArtists, seedArtistGenres, seedVenues, customSeedVenues };
      },

      getMatchScore: (venue) => {
        const { activeGroupId, getGroupVibeVector, getVibeVector, prefs, seedArtistGenres, rejectedVenues, viewedVenues } = get();
        const v = activeGroupId ? (getGroupVibeVector(activeGroupId) || getVibeVector()) : getVibeVector();

        // 1. Base 4-dim taste match scaled to 0–70
        const dims = ['music_score', 'energy_score', 'dance_score', 'demo_score'];
        const keys = ['music', 'energy', 'dance', 'demo'];
        let raw = 0;
        dims.forEach((d, i) => { const u = v[keys[i]] || 3; raw += 1 - Math.abs(u - venue[d]) / 5; });
        const base = (raw / dims.length) * 70;

        // 2. Purpose boost (0–10)
        const purposes = prefs?.purposes || [];
        let purposeBoost = 0;
        if (purposes.includes('dancing') && venue.dance_score >= 4) purposeBoost += 8;
        if (purposes.includes('low_key') && venue.energy_score <= 2.5) purposeBoost += 8;
        if (purposes.includes('live_music') && venue.music_genres.some(g => ['jazz','blues','folk','acoustic','rock','indie'].some(k => g.toLowerCase().includes(k)))) purposeBoost += 8;
        if (purposes.includes('discover_artists') && venue.music_score >= 4) purposeBoost += 5;
        if (purposes.includes('date_night') && venue.demo_score >= 4) purposeBoost += 5;
        purposeBoost = Math.min(purposeBoost, 10);

        // 3. Neighborhood affinity (0–5)
        const neighborhoodBoost = (prefs?.neighborhoods?.length && prefs.neighborhoods.includes(venue.neighborhood)) ? 5 : 0;

        // 4. Genre affinity from seed artists (0–8)
        const allSeedGenres = Object.values(seedArtistGenres || {}).flat().map(g => g.toLowerCase());
        const venueGenres = venue.music_genres.map(g => g.toLowerCase());
        const genreOverlapCount = venueGenres.filter(g => allSeedGenres.some(sg => sg.includes(g) || g.includes(sg))).length;
        const genreBoost = Math.min(genreOverlapCount * 3, 8);

        // 5. Popularity boost from Google Places (0–7)
        const popularityBoost = venue.googleRating
          ? Math.round((venue.googleRating / 5) * Math.min(Math.log10((venue.reviewCount || 1) + 1) / Math.log10(500), 1) * 7)
          : 0;

        // 6. Rejection penalty: −10 or −20 for venues similar to recent "not tonight" picks
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = Object.values(rejectedVenues || {}).filter(r => r.timestamp > sevenDaysAgo);
        const rGenres = new Set(recent.flatMap(r => r.genres));
        const rTags = new Set(recent.flatMap(r => r.vibe_tags));
        const gOverlap = venueGenres.filter(g => rGenres.has(g)).length;
        const tOverlap = (venue.vibe_tags || []).filter(t => rTags.has(t)).length;
        const rejectionPenalty = (gOverlap >= 2 || tOverlap >= 2) ? 20 : (gOverlap + tOverlap >= 2 ? 10 : 0);

        // 7. Novelty penalty: recently viewed venues ranked lower (decays over 7 days)
        const lastViewed = viewedVenues?.[venue.id];
        const daysSince = lastViewed ? (Date.now() - lastViewed) / (1000 * 60 * 60 * 24) : 999;
        const noveltyPenalty = daysSince < 1 ? 10 : daysSince < 3 ? 5 : daysSince < 7 ? 2 : 0;

        return Math.max(0, Math.min(100, Math.round(base + purposeBoost + neighborhoodBoost + genreBoost + popularityBoost - rejectionPenalty - noveltyPenalty)));
      },
    }),
    { name: 'venuematch-store', version: 2 }
  )
);
