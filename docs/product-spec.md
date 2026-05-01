# VenueMatch — Product Specification

> Version 1.0 · April 2026 · Confidential

---

## Vision

VenueMatch answers one question: **where should I go tonight?**

It is a taste-learning recommendation engine for NYC nightlife. It learns what you like from the venues and artists you already know, then ranks every venue in its catalog by how well it matches you — and once a night, puts a single AI-powered pick in front of you with a one-line reason.

The long-term product is a three-sided marketplace connecting goers, venues, and artists. The MVP tests the goer-side discovery hypothesis: that curated, taste-matched recommendations feel meaningfully better than Google or Instagram, without requiring venue participation or real-time data.

---

## The Problem

> "The most accurate places are on socials — but posting them leads to overcrowding. The best bars may not want to be put on socials to preserve the vibe."

People in New York who want to dance or discover live music have no reliable way to find the right venue. Discovery is fragmented across Google (inaccurate), Instagram (optimized for virality, not fit), and word-of-mouth (slow, biased). The bars best suited to a given crowd often have no social presence by design.

This is a **signal alignment problem**, not a data problem. Enough information exists — it is just noisy, public-facing, and optimized for reach rather than fit.

---

## Target User (v1)

**Primary:** NYC resident, 22–35, goes out 1–3x/month to dance or hear live music. Has strong opinions about venue vibe but finds discovery exhausting. Knows a handful of venues they love; wants to find more like them without trial and error.

**Secondary:** Small friend groups (2–5 people) who need to agree on a spot that works for everyone's taste.

---

## Product Scope — Current MVP

The MVP is live-first on **web** (venuematch.vercel.app) with a mobile-first responsive layout. An iOS app is the next platform target.

**In scope:**
- Onboarding (taste calibration)
- Discovery (map + ranked list)
- Tonight's Pick (AI recommendation)
- Venue Detail (info + ratings)
- Library (saved/visited)
- Profile (vibe breakdown)
- Groups (blended taste, local device only for now)

**Out of scope for now:**
- Venue-side intake (venues managing their own profiles)
- Artist-side marketplace
- Real-time event programming ("who's DJing this Friday")
- Cross-device group sync
- Friends Flare (location sharing on map)
- Neighborhood/borough map filtering
- Push notifications

---

## Feature Modules

Each module is independently ownable. One engineer can work on Tonight's Pick while another works on Groups without conflicts.

---

### Module 1: Onboarding

**Purpose:** Cold-start the user's taste profile from venues and artists they already know. Onboarding data is pure taste signal — seed venues are never shown as recommendations.

**Owner:** TBD

**Steps:**

| Step | What happens | Key interaction |
|------|-------------|----------------|
| 1. Account | Email + display name, or Google sign-in | Form → Supabase Auth |
| 2. Preferences | Nights (Fri/Sat/weeknights), purposes (dancing, live music, low-key, date night, discover artists), radius, neighborhoods | Multi-select pills |
| 3. Seed venues | Pick up to 5 venues you already love | Curated grid + Google Places search |
| 4. Seed artists | Pick up to 5 artists that define your music taste | Spotify search with hover audio preview; iTunes fallback |
| 5. Calibration | Rate 3 of your seed venues on 4 dimensions (1–5 sliders) | Sliders: Music, Energy, Danceability, Crowd Match |

**On complete:**
- Call `POST /users/me/complete-onboarding`
- Server computes initial vibe vector from seed venue scores + calibration ratings
- User lands on Discover

**Completion criteria:** All 5 steps done. Steps 3–5 require minimum 1 selection each before advancing.

**TypeScript types used:** `User`, `SeedVenue`, `Artist`, `Preferences`

**DB writes:** `users` (seeds, prefs, vibe vector), `user_venue_ratings` (calibration ratings)

---

### Module 2: Discovery

**Purpose:** Browse all venues ranked by personal match score. The primary navigation surface.

**Owner:** TBD

**Layout (mobile):**
- Full-screen map (65% viewport height) with venue pin markers
- Scrollable ranked list below (35%)
- Genre filter pills above the list (All, Electronic, Hip-Hop & R&B, Jazz, Indie & Rock, Global, Experimental)
- Tonight's Pick button floats in the top right

**Layout (web/tablet):**
- Map on left (65% width), ranked list on right (35%)
- Same genre filter bar above list

**Map behavior:**
- Purple pins for all venues
- Tapping a pin scrolls the list to that venue and opens a mini card
- Active pin: larger, lighter purple, glow
- Genre filter hides non-matching pins and list items simultaneously

**Match score:**
- Each venue card shows a colored badge (green ≥85%, purple ≥70%, gray <70%)
- Score is computed client-side from the user's vibe vector (fetched from DB on load)
- Score updates in real time as users rate venues (no reload needed)

**Data sources:**
- Venues: `GET /venues` (from DB — includes `photo_url` from Places enrichment)
- Match scores: computed in `frontend/src/features/discovery/scoring.ts` using weights from `packages/shared/constants/scoring.ts`

**TypeScript types used:** `Venue`, `MatchScore`, `GenreFilter`

---

### Module 3: Venue Detail

**Purpose:** Full information view for a single venue. Entry point for rating a venue you've visited.

**Owner:** TBD

**Triggered by:** Tapping a venue card, map pin, library item, or Tonight's Pick result

**Content:**
- Hero photo (or color gradient fallback)
- Name, neighborhood, address
- Match score badge
- Vibe tags
- Description
- 4-dimension bar charts: Music, Energy, Danceability, Crowd Match
- Music genres (pills)
- Crowd description
- Hours
- Google rating + review count (if available)
- "Save" button (heart) → toggles `saved_venues` status

**Rate this venue (if visited):**
- 4 sliders (Music, Energy, Danceability, Crowd Match) — pre-filled with user's existing rating if present
- Auto-saves on change (debounced 500ms) → `PUT /ratings/:venueId`
- Rating recalculates vibe vector immediately (client-side preview, server persists)

**TypeScript types used:** `Venue`, `UserRating`, `SaveStatus`

**DB writes:** `user_venue_ratings`, `saved_venues`

---

### Module 4: Tonight's Pick

**Purpose:** Once-a-night, context-aware AI recommendation. The highest-signal, highest-delight feature.

**Owner:** TBD

**Flow:**

```
Questions phase → Loading phase → Result phase → Feedback
```

**Questions phase:**
- 2 multi-choice questions (rotate daily by day of week, 4 question sets)
  - e.g. "What kind of night?" → Dancing hard / Chill vibes / Something in between
  - e.g. "Who are you going with?" → Flying solo / Small crew / Big group
- Optional: "What's on repeat right now?" — Spotify track search with hover preview
- "Get tonight's pick" CTA

**Loading phase:**
- Spinner + "Matching your vibe to NYC…"
- Calls `GET /recommendations/tonight`
  - If today's rec exists in DB: returns it immediately (no Claude call)
  - If not: builds prompt → calls Claude via Edge Function → stores result → returns

**Result phase:**
- Venue photo + name + neighborhood
- Match score badge (70–98)
- 1-line reason (italicized)
- Vibe tag (2–3 words)
- Actions: **Save** / **Not tonight** / **Full details**

**Feedback actions:**
- **Save:** `PUT /saved/:venueId` + `POST /recommendations/tonight/feedback { action: 'saved' }`
- **Not tonight:** `POST /rejections/:venueId` + `POST /recommendations/tonight/feedback { action: 'not_tonight' }` → rejection penalty applied to future scoring for 7 days
- **Full details:** Opens Venue Detail modal

**Daily reset:** Same pick is returned for the same `user_id` + `rec_date`. Refreshes at midnight.

**Claude prompt includes:**
- User's vibe vector (music, energy, dance, demo out of 5)
- Seed venue names (for taste DNA context — not candidates)
- Seed artists + their genres
- Stated purposes + neighborhoods
- Rejection context (genres/vibes to avoid from last 7 days)
- Tonight's answers + song (if provided)
- Top 15 scored candidates with full venue metadata

**TypeScript types used:** `DailyRec`, `TonightAnswers`, `RecFeedback`

**DB reads/writes:** `daily_recs`, `venue_rejections`, `saved_venues`

---

### Module 5: Library

**Purpose:** Personal collection of saved and visited venues.

**Owner:** TBD

**Two tabs:**
- **Want to visit** — hearted venues (status: `want_to_visit`)
- **Visited** — rated venues (status: `visited`)

**Layout:** Compact venue cards, sorted by most recently saved/rated. Tapping opens Venue Detail.

**Data source:** `GET /saved` → returns venues with their save status

**TypeScript types used:** `SavedVenue`, `VenueSaveStatus`

---

### Module 6: Profile

**Purpose:** Visualize taste profile. Manage account.

**Owner:** TBD

**Content:**
- Display name + avatar
- 4 vibe dimensions as progress bars (music, energy, danceability, crowd match)
- Seed venues list (with photos)
- Seed artists list
- Ratings count
- "Edit preferences" → navigates back to onboarding preferences step
- Sign out

**Data source:** `GET /users/me`

**TypeScript types used:** `User`, `VibeVector`

---

### Module 7: Groups

**Status:** Holding layer — UI exists, cross-device sync not yet built.

**Current behavior (local only):**
- Create a named group with an invite code
- Add friends by manually selecting their seed venues on the same device
- View blended group vibe profile
- Switch global context to "Group mode" → all venue scoring re-ranks against blended signal

**Next phase:**
- Cross-device sync: members join by entering invite code on their own device
- Group members' vibe vectors fetched from DB and blended server-side
- `GET /groups/:id/scores` returns pre-computed group match scores

**TypeScript types used:** `Group`, `GroupMember`, `GroupVibeVector`

**DB:** `groups`, `group_members`

---

## Future Features (Roadmap)

### Friends Flare (Map)

A friend drops a "flare" on the map showing where they are or where they're headed. The map renders a pulsing ring at that location. Flares are ephemeral (expire after 4 hours).

**User story:** "I want to see when a friend is at a venue I'd like, without having to text everyone in the group chat."

**Design notes:**
- Flare is tied to a group context — only visible to group members
- Appears as an overlay layer on the map, above venue pins
- Pulsing animation (CSS keyframes or Lottie) to signal real-time presence
- Supabase Realtime channel: `flares:group_id=<uuid>`
- Schema stub already reserved (see architecture doc §4.7)
- Requires: location permission, group membership, flare creation UI (3-tap flow)

**Platform:** iOS-first (location permission UX is native and trusted on iOS)

### Venue-Side Intake

Venues claim their profile, control their description, opt in/out of discovery. Enables:
- Venue-verified hours and event programming
- Tonight-specific signals ("DJ Koze is here tonight")
- Venue visibility controls (prevent unwanted virality)

### Artist Marketplace

DJs and musicians list their sound and availability. Venues browse genre-matched artists. Booking flows. This is the full three-sided marketplace vision.

### Enhanced Feedback Signals

Beyond star ratings:
- Check-in (I went here tonight) → boosts signal confidence
- Photo uploads → visual vibe confirmation
- Time-of-visit context → calibrate energy scores differently for Fri vs Sun

---

## Non-Goals (Permanent)

- We are not building a review site (Yelp already exists)
- We are not building a ticketing platform
- We are not building a social network (no follows, no public profiles, no feed)
- We are not going national before NYC is right

---

## Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Onboarding completion rate | >60% of users who start |
| Tonight's Pick engagement | >40% of active users use it in first week |
| Save or not-tonight on rec | >70% of users who see a rec take an action |
| Return rate (D7) | >30% |
| "Felt right" qualitative feedback | Majority say better than Google/IG |

---

*Document owner: Product · Last updated: April 2026*
