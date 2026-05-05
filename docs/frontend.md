# Frontend

> Stack: React + TypeScript · Zustand · Vite · TailwindCSS · Leaflet

---

## App Entry Flow

`frontend/src/App.tsx` controls top-level routing. On every render it checks four things in order:

1. **Auth loading** — shows a spinner while `useAuth` resolves the Supabase session
2. **No session** (Supabase configured) — renders `<AuthPage />`
3. **Onboarding incomplete** — renders `<Onboarding />`
4. **Session prompt** — if `userVectors` exists and `sessionDate` ≠ today's date string, renders `<SessionVibePrompt />` once per day
5. **Main app** — renders `<HomePage />` (discovery, library, groups tabs), or `<VenueDetail />` as a full-screen overlay when a venue is selected

---

## State Management

All state lives in a single Zustand store at `frontend/src/store/index.ts`, persisted to `localStorage` under key `venuematch-store` (version 2).

### State slices

| Slice | Key fields | Purpose |
|---|---|---|
| User | `user`, `onboardingComplete`, `onboardingStep`, `prefs` | Identity and preferences |
| Taste seeds | `seedVenues[]`, `seedArtists[]`, `customSeedVenues[]`, `seedArtistGenres{}` | Legacy 16-dim inputs |
| v2 vectors | `userVectors` (VenueVector), `sessionVector`, `sessionDate` | Netflix-style scoring inputs |
| Ratings & saves | `venueRatings{}`, `savedVenues{}` | User engagement signals |
| Feedback | `rejectedVenues{}`, `viewedVenues{}` | Scoring penalties |
| Tonight | `tonightsRec`, `tonightAnswers`, `lastRecDate` | Tonight's Pick feature |
| Groups | `groups[]`, `activeGroupId` | Collaborative recs |
| Theme | `theme` (`'dark'` \| `'light'`) | UI preference |

### Key computed methods

**`getMatchScore(venue)`** — returns a 0-100 score. Uses Netflix scoring if `venue.vectors` and `userVectors` both exist; falls back to 16-dim cosine similarity otherwise. Applies rejection and novelty penalties in both paths.

**`getVibeVector()`** — averages user's `venueRatings` across music/energy/dance/demo; includes seed metadata.

**`getGroupVibeVector(groupId)`** — for each group member, averages their seed venues' 4-dim scores, then averages across all members.

### Server sync

`frontend/src/hooks/useServerSync.ts` fires once on login. It calls the `/users`, `/ratings`, `/saved`, and `/rejections` endpoints and calls `store.syncFromServer()` to hydrate Zustand from the server.

---

## Pages & Data Sources

### AuthPage — `features/auth/index.tsx`

| Element | Data source |
|---|---|
| Sign-up form | Supabase `auth.signUp()` |
| Sign-in form | Supabase `auth.signInWithPassword()` |
| Google OAuth | Supabase `auth.signInWithOAuth({ provider: 'google' })` |
| Email confirm screen | Shown after sign-up; no data needed |

---

### Onboarding — `features/onboarding/index.tsx`

4-step funnel gated by `store.onboardingStep`. Each step writes to the store and optionally to Supabase.

| Step | What user does | Where data goes |
|---|---|---|
| 0 – Signup | Enter name | `store.setUser()` + `supabase.from('users').upsert()` |
| 1 – Genres | Pick ≤3 genres from 9 tiles | `store.updatePrefs({ purposes })` |
| 2 – Neighborhoods | Pick ≤3 neighborhoods | `store.updatePrefs({ neighborhoods })` |
| 3 – This vs That | 3 head-to-head venue picks | `store.toggleSeedVenue()` (winning venue ID) |
| 4 – Ideal Night | Chips + free text → Claude | `store.setUserVectors()` + `supabase.from('users').update({ vectors })` |

The Step 3 match-up logic picks venues from `NYC_VENUES` filtered by selected neighborhoods. Round 1 is random; rounds 2-3 compare the previous winner against the most contrastive venue (sorted by `|energy_score diff|`).

Step 4 calls `inferUserVector()` in `lib/claude.ts`, which sends all onboarding signals to Claude Haiku and returns a `VenueVector`. A hardcoded genre-to-vibe fallback is used if the API call fails.

---

### SessionVibePrompt — `features/session/SessionVibePrompt.tsx`

Shown once per day for returning users who have completed onboarding and have a `userVectors`.

| Element | Data source |
|---|---|
| 3 questions | Rotated from bank of 5 (deterministic by `Math.floor(Date.now() / 86400000)`) |
| "Let's go" action | Calls `inferSessionVector()` in `lib/claude.ts` → `store.setSessionVector()` |
| "Skip" action | Calls `store.clearSession()` → proceeds with base vector |

The 5 question topics: energy level, group size/intent, genre mood, timing, cost comfort.

---

### HomePage / Discovery — `features/discovery/index.tsx`

Three tabs rendered inside the main layout.

#### Discover tab

| Element | Data source |
|---|---|
| Venue list | `NYC_VENUES` filtered by selected genre + sorted by `store.getMatchScore()` |
| Map markers | `venueCoords.ts` (static lat/lng) + match scores for color |
| Genre filter | Local state; filters `venue.music_genres` |
| Group selector | `store.groups` + `store.activeGroupId` |
| Tonight's Pick button | Opens `<TonightsRec />` modal |
| Google enrichment (photos, rating, open now) | `lib/places.ts → enrichCuratedVenues()` (fetched once, cached) |

**VenueMap** (`discovery/components/VenueMap.tsx`) uses Leaflet. Tile URL switches between dark/light based on `store.theme`. Markers are coloured on a purple-to-grey gradient: purple (`#7c3aed`) for scores ≥92, stepping down to grey for lower scores.

#### Library tab

Rendered from `features/library/index.tsx`.

| Element | Data source |
|---|---|
| Saved venues | `Object.keys(store.savedVenues)` filtered for `status === 'want_to_visit'` |
| Visited venues | `Object.keys(store.venueRatings)` |
| Venue cards | Looked up from `NYC_VENUES` by ID |

#### Groups tab

Rendered from `features/groups/index.tsx`. All data from `store.groups` (in-memory, persisted to localStorage). No server sync for groups in the current build.

---

### VenueDetail — `features/venue-detail/index.tsx`

Full-screen overlay opened from any venue card.

| Element | Data source |
|---|---|
| Hero image | `venue.photo` (Google Places, if enriched) or `venue.img_color` gradient |
| Name, address, tags | `venue` object from `NYC_VENUES` |
| Match score badge | `store.getMatchScore(venue)` |
| Metric sliders (Music, Energy, Dance, Crowd) | Read from `store.venueRatings[venue.id]`; updates call `store.setVenueRating()` + `api.upsertRating()` |
| Google rating / review count | `venue.googleRating`, `venue.reviewCount` (from Places enrichment) |
| Open now | `venue.isOpenNow` (from Places enrichment) |
| View tracking | `store.trackVenueView(venue.id)` called on mount |

---

### TonightsRec — `features/tonights-pick/index.tsx`

Modal accessed via "Tonight's Pick" button.

| Phase | What happens | Data source |
|---|---|---|
| Questions | 2 rotating multiple-choice + song search | Local state |
| Song search | `lib/spotify.ts` (Spotify API via `spotify-token` edge function) + `lib/itunes.ts` audio preview | Spotify API |
| Loading | Spinner shown | — |
| Result | Venue card + Claude-written reason + score | `claude.getTonightsRec()` → Anthropic API or `get-rec` edge function |
| Actions | Save → `store.saveVenue()` + `api.upsertSaved()` / Not tonight → `store.rejectVenue()` + `api.createRejection()` | Zustand + API |

---

### Profile — `features/profile/index.tsx`

| Element | Data source / action |
|---|---|
| Taste fingerprint | `store.getVibeVector()` + `VECTOR_DIMS` labels from `venueProfiles.ts` |
| Seed venues/artists | `store.seedVenues`, `store.seedArtists` |
| Preferences (nights, purposes, radius, neighborhoods) | `store.prefs`; edits call `store.updatePrefs()` |
| Theme toggle | `store.theme` / `store.setTheme()` |
| Logout | `supabase.auth.signOut()` |

---

## UI Component Library

`frontend/src/components/ui/index.tsx` exports:

- `Button` — variants: `primary` (brand-purple), `secondary` (glass), `ghost`; sizes: `sm`, `md`, `lg`
- `Pill` — active/inactive toggle pill
- `ProgressBar` — step/total fraction bar
- `SectionHeader` — section label
- `RatingSlider` — 1-5 star/dot slider used in VenueDetail

---

## Theme

CSS variables (dark by default). Light mode activated by adding class `light` to `<html>`. TailwindCSS `glass` utility applies a frosted-glass background. Brand color: `#7c3aed` (brand-purple).

---

## Data Files (Static)

| File | Contents |
|---|---|
| `data/venues.ts` | 47 curated NYC venues (`NYC_VENUES[]`), `NEIGHBORHOODS[]`, `NIGHT_TYPES[]` |
| `data/venueCoords.ts` | Lat/lng pairs for each venue ID (used by Leaflet map) |
| `data/venueProfiles.ts` | 16-dim numeric vectors per venue + per artist; `VECTOR_DIMS` label array |
