# Features

What is actually built and visible to users in the current codebase.

---

## Authentication

### Email / Password Sign-Up & Sign-In
- Sign-up form: name, email, password → Supabase `auth.signUp()`
- After sign-up, a confirmation email is sent; user sees a "Check your email" screen
- Sign-in form: email + password → `auth.signInWithPassword()`

### Google OAuth
- Single "Continue with Google" button
- Calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Redirect-based flow; Supabase handles the OAuth exchange

### Session Persistence
- Auth state managed by `useAuth` hook via `onAuthStateChange`
- Zustand store is hydrated from the server on login (ratings, saves, rejections, profile)
- Store persisted to `localStorage` so state survives page refresh

### No-Auth Mode
- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, auth is skipped entirely
- User is created locally in Zustand with a `local_` prefixed ID
- All features work without a backend connection

---

## Onboarding (4 Steps)

A first-time funnel that builds the user's taste profile before showing any recommendations.

### Step 1 — Genres
- 9 genre tiles with emoji: Electronic, Hip-Hop, Rock, Oldies, Indie, Pop, Sing-Alongs, Jazz, Chill
- Pick up to 3
- Stored as `prefs.purposes`

### Step 2 — Neighborhoods
- Multi-select chips for 13 NYC neighborhoods
- Pick up to 3, or skip to see all of NYC
- Stored as `prefs.neighborhoods`

### Step 3 — This vs That (Head-to-Head)
- 3 rounds of venue vs venue
- User taps the one that appeals more
- Round 1: 2 random venues (filtered to selected neighborhoods if applicable)
- Rounds 2-3: previous winner vs the most energy-contrasting venue
- Final winner is added to `seedVenues`

### Step 4 — Ideal Night
- 12 chip options: Late night, Good music, Cocktails, Meet people, Dance, Low key, Artsy crowd, NYC underground, Rooftop, Live music, Queer-friendly, Date night
- Optional free-text field: "Describe your ideal night in your own words"
- On submit: Claude Haiku infers a `VenueVector` (genres, 4-dim vibe, cost 1-4)
- Vector is saved to `store.userVectors` and persisted to `users.vectors` in Supabase
- Progress bar shows step count

---

## Where to Tonight? (Session Prompt)

Shown once per day to returning users who have completed onboarding and have a stored `userVectors`.

- Full-screen prompt with 3 multiple-choice questions (picked deterministically from a bank of 5 by day)
- Question topics: energy level, group size/intent, genre mood, timing, cost comfort
- Each question has 3-5 options
- "Let's go" button: Claude Haiku blends tonight's answers with base profile into a `sessionVector` (session weighted 60%, base 40%)
- "Skip" button: discards and uses base profile
- Session resets daily (comparison by date string)

---

## Discovery Map

The primary screen after onboarding.

### Interactive Map
- Leaflet map centered on NYC
- One marker per venue (from static `venueCoords.ts`)
- **Marker color** reflects match score:
  - ≥92: brand purple (`#7c3aed`)
  - Lower scores: progressively grey
  - Active/selected venue: larger, glowing marker
- Dark/light tile layer switches with the app theme
- Tap a marker: scrolls to that venue card in the list

### Venue List
- Sorted by match score (highest first)
- Genre filter dropdown: All / Electronic / Hip-Hop & R&B / Jazz / Indie & Rock / Global / Experimental
- Group mode selector (Solo or active group name)
- Each card shows: photo or color gradient, venue name, neighborhood, match score badge, vibe tags
- Tap a card: opens VenueDetail overlay

### Google Places Enrichment
- On app load, `enrichCuratedVenues()` fetches photos, ratings, review counts, and "open now" status from Google Places
- Applied to the static `NYC_VENUES` array in-memory; not written to the database at runtime
- Venues without enrichment fall back to `img_color` gradient

---

## Venue Detail

Full-screen overlay opened from any venue card.

- Hero: venue photo (from Google Places) or gradient from `img_color`
- Match score badge (color-coded)
- Venue name, neighborhood, address
- Vibe tags
- Description text
- Metrics grid showing Music, Energy, Danceability, and Crowd match (1–5 scale)
- **Rating sliders**: user can rate each metric 1–5; ratings are saved to Zustand and synced to `user_venue_ratings` in Supabase
- Google rating and review count (if enriched)
- "Open now" / "Closed" status (if enriched)
- Back button, Save/unsave heart button

---

## Tonight's Pick

Accessed via the "Tonight's pick" button on the discovery screen. Claude picks one venue for you.

### Questions Phase
- 2 rotating multiple-choice questions about tonight's mood
- Questions rotate daily (deterministic by day)
- Optional song search: type an artist or song name, Spotify results appear

### Song Search
- Live search against Spotify API (debounced)
- Results show track name, artist, album art
- Hover a result to preview 30-second audio (via Spotify preview URL or iTunes fallback)
- Animated equalizer bars on active preview
- Selecting a song sets `tonightAnswers.currentSong` which Claude sees in the prompt

### Recommendation Result
- Venue card with photo/gradient
- Match score badge
- Claude-written 1-sentence reason explaining why this venue fits tonight
- Vibe label (e.g. "underground dance")
- Genre tags
- **Actions**:
  - "Save it" → adds to saved venues (`want_to_visit`)
  - "Not tonight" → records rejection (affects scoring for 7 days)
  - "Details" → opens full VenueDetail
  - Refresh icon → restarts question flow

---

## Saved Venues & Library

### Saving a Venue
- Heart icon on venue cards and VenueDetail overlay
- Two states: `want_to_visit` and `visited`
- Synced to `saved_venues` table in Supabase

### Library Tab
- **Saved** sub-tab: venues with `want_to_visit` status; count badge
- **Visited** sub-tab: venues the user has rated; count badge
- Tap any card to open VenueDetail

---

## Venue Ratings

Available in VenueDetail and the Library (visited venues).

- 4 dimensions: **Music** (quality of music curation), **Energy** (vibe intensity), **Danceability**, **Crowd match** (how well the crowd fits the user)
- Scale: 1–5, displayed as a slider
- Ratings saved to `venueRatings{}` in Zustand and `user_venue_ratings` in Supabase
- Ratings feed into the legacy 16-dim recommendation engine (contribute to user vibe vector)

---

## Groups (Collaborative Recommendations)

### Creating a Group
- Enter a group name
- A 6-character alphanumeric code is generated (e.g. `X7KP2M`)
- Group creator ("You") is added as the first member with their seed venues

### Adding Members
- Add members by name
- Assign seed venues to each member (up to 5)
- Members are stored locally in `store.groups` (not synced to Supabase in current build)

### Removing Members & Deleting Groups
- Individual members can be removed
- Groups can be deleted; `activeGroupId` clears automatically

### Group Recommendations
- Set a group as "active" from the discovery screen group selector
- `getMatchScore()` uses `buildGroupVector()` which averages all members' seed venue vectors
- Discovery list reranks based on the blended group vibe

### Copy Code
- "Copy code" button puts the group join code on the clipboard for sharing

---

## Profile Editing

Available from the Profile tab on the main screen.

- **Display name**: shown; not editable in current UI
- **Seed venues**: view and manage curated venue seeds
- **Seed artists**: search and add artists via Spotify; genres are stored
- **Nights out**: multi-select (Thursday/Friday/Saturday/Sunday/Other)
- **Going for**: multi-select purposes (Dancing, Live music, Low-key drinks, Discovering artists, Date night, Group outing)
- **Travel radius**: radio select — My neighborhood only / Anywhere in my borough / Anywhere in NYC
- **Preferred neighborhoods**: multi-select chips (same list as onboarding Step 2)
- **Taste fingerprint**: read-only display of the 16-dim vector with dimension labels and bar chart
- **Theme toggle**: Dark ↔ Light mode
- **Log out**: signs out of Supabase, clears session state

---

## Light / Dark Mode

- Toggle available in the Profile tab
- `store.theme` is `'dark'` by default
- Switching adds/removes the `light` class on `<html>`
- Map tile layer switches between dark and light Stadia map tiles
- All UI uses CSS variables scoped to `:root` vs `.light`
- Preference persisted to `localStorage` via Zustand

---

## What Is Not Yet Built

These features are in the product spec but not implemented in the current codebase:

- Supabase venues table is not populated — all venue data is the 47-venue static array in `data/venues.ts`
- `venueCoords.ts` has coordinates for venues v1–v25 only; v26–v47 do not appear on the map
- The v2 Netflix scoring only activates if `venue.vectors` is set — no venues currently have this field since the enrichment pipeline (`scripts/fetch-venues.mjs`) has not been run against the Supabase venues table
- Groups are client-side only (not synced to `groups`/`group_members` tables)
- `session_vibes` table exists in schema but answers are not written to it — the session vector is stored only in Zustand
