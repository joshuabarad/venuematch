# VenueMatch — Full Redesign: Product + Technical Spec

> Version 2.0 · May 2026

---

## Context

VenueMatch is being redesigned around two core ideas:

1. A **new onboarding flow** (4 steps) that uses AI enrichment to build a user taste profile with shared vector sub-models
2. **"Where to Tonight"** promoted from a side feature to the primary session entry point — replacing the current generic discovery tab as the app's main value proposition

The Netflix-style matching algorithm ties both together: venues and users share the same `Vectors` sub-model (`genres[]`, `vibe[4]`, `cost`), enabling interpretable, tunable match scores.

---

## Part 1 — Product Spec

### 1.1 Features to Keep (unchanged)

- Interactive map with gradient-colored dots by match score
- Light / Dark mode toggle
- Venue cards with match score badges
- Google OAuth authentication
- User ratings on vibe dimensions (sliders in venue detail)

### 1.2 Primary UX Change: "Where to Tonight"

Currently a floating modal button ("Tonight's pick"). The new design makes it the **first thing a returning user sees on each new session**.

**Return-session flow:**

1. User opens app after completing onboarding
2. Before the discovery map loads, a full-screen prompt shows **3 multiple-choice questions** about tonight's vibe
3. Questions can include an open-ended "anything else?" text field
4. Answers adjust the match scores for that session (temporary, not persisted to profile)
5. User lands on the discovery map with recommendations already sorted for tonight

**Tonight questions (rotating, 3 per session):**

- Energy level: Chill / Moderate / High energy
- Vibe intent: Solo / Date night / Friend group / Big group
- Genre mood: (user's top genres + "Surprise me")
- Timing: Getting there early / Late night / Doesn't matter
- Cost comfort: Whatever / Budget night / Spending freely

These answers create a **session vector** that temporarily blends with the base user vector for scoring.

### 1.3 New Onboarding (4 Steps)

**Step 1 — Top Genres**

- Show 9 genre tiles: Rock, Oldies, Hip-Hop, Electronic, Indie, Pop, Sing-Alongs, Jazz, Chill
- User picks **up to 3**
- Each genre maps to vibe vector adjustments (e.g. Electronic → energy↑, underground↑, dance↑)

**Step 2 — Neighborhood Preference**

- Show NYC neighborhoods as selectable chips
- Multi-select up to 3
- Used as a soft filter (not enforced during "Where to Tonight" session)

**Step 3 — This vs That (3 head-to-head rounds)**

- Show 2 venues side-by-side from the selected neighborhood(s); user picks one
- Round 2: Winner vs a venue with similar top identifying factors
- Round 3: If same winner again → test against a dissimilar venue; if upset → find similar to new winner
- Final winner's vectors are extracted as the **seed vector** for the user
- Each choice adds ±adjustment to genre, vibe, and cost dimensions

**Step 4 — AI Ideal Night Description**

- Multi-select chips: "Late night", "Good music", "Cocktails", "Meet people", "Dance", "Low key", "Artsy crowd", "NYC underground"
- Optional free-text: "Describe your ideal night in your own words"
- Claude infers `{ genres: string[], vibe: [0-1, 0-1, 0-1, 0-1], cost: 1-4 }` from all onboarding signals
- Saves as `User.vectors` to Supabase

---

## Part 2 — Data Models

### 2.1 Shared Vector Sub-model

```typescript
interface VenueVector {
  genres: string[];                           // e.g. ["techno", "house", "electronic"]
  vibe: [number, number, number, number];     // [energy, underground, social, dance] 0–1
  cost: number;                               // 1–4
}
```

**Vibe dimensions:**

| Index | Dim | 0 = | 1 = |
|-------|-----|-----|-----|
| 0 | `energy` | mellow lounge | high-energy club |
| 1 | `underground` | mainstream/commercial | underground/alternative |
| 2 | `social` | focused listening crowd | mixer/meetup crowd |
| 3 | `dance` | seated/standing bar | dance-floor focus |

**Cost scale:**

| Value | Meaning |
|-------|---------|
| 1 | Free / no cover, cheap drinks |
| 2 | Moderate ($10–20 cover, regular bar prices) |
| 3 | Pricier ($20–40 cover, cocktail prices) |
| 4 | High-end (bottle service, expensive tickets) |

### 2.2 Supabase Schema Changes

**`users` table — add columns:**

```sql
preferred_neighborhoods TEXT[]  DEFAULT '{}',
vectors                 JSONB   DEFAULT NULL
-- shape: { genres: string[], vibe: [n,n,n,n], cost: number }
```

**`venues` table — add columns:**

```sql
reviews       TEXT[]  DEFAULT '{}',
overall_score FLOAT   DEFAULT NULL,
vectors       JSONB   DEFAULT NULL
-- shape: { genres: string[], vibe: [n,n,n,n], cost: number }
```

**New table: `session_vibes`**

```sql
CREATE TABLE session_vibes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  answers     JSONB NOT NULL,
  -- { energy, intent, genre_mood, timing, cost_comfort }
  session_vec JSONB NOT NULL
  -- blended VenueVector for this session
);
ALTER TABLE session_vibes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own session_vibes" ON session_vibes
  USING (auth.uid() = user_id);
```

### 2.3 How Each Field Is Populated

| Field | Source | When |
|-------|--------|------|
| `User.name` | Onboarding step 1 (auth or input) | Once |
| `User.email` | Google OAuth / input | Once |
| `User.preferred_neighborhoods` | Onboarding step 2 | Once + editable |
| `User.vectors.genres` | Claude inference from all onboarding signals | End of step 4 |
| `User.vectors.vibe` | Claude inference from step 3 winner + step 4 description | End of step 4 |
| `User.vectors.cost` | Claude inference from step 3 venue price levels + step 4 text | End of step 4 |
| `Venue.name / address / photo / hours / rating / reviews` | Google Places API | Weekly script |
| `Venue.overall_score` | `googleRating` from Places API | Weekly script |
| `Venue.vectors.genres` | Claude inference from reviews + description + tags | Weekly script |
| `Venue.vectors.vibe` | Claude inference from reviews + description + price + type | Weekly script |
| `Venue.vectors.cost` | `price_level` from Places + review mentions | Weekly script |
| `session_vibes.session_vec` | Claude blends tonight answers with user base vector | Each session |

---

## Part 3 — Matching Algorithm

### 3.1 Formula

```
match_score (0–100) =
  0.35 × genre_jaccard      — |intersection| / |union| of genre arrays
+ 0.30 × vibe_cosine        — cosine similarity on 4-dim vibe vector
+ 0.15 × cost_alignment     — 1 − |user.cost − venue.cost| / 3
+ 0.10 × neighborhood_match — 1.0 if in preferred list, 0.5 otherwise
+ 0.10 × quality_score      — venue.overall_score / 5.0
− rejection_penalty         — −20 (strong genre/vibe overlap) or −10 (weak)
− novelty_penalty           — −10/<1day, −5/<3days, −2/<7days
```

All five raw components are 0–1; sum × 100 before penalties = 0–100 score.

### 3.2 Session Mode Override

When a "Where to Tonight" session vector exists:

```
effective.genres = union(base.genres, session.genres)   // additive
effective.vibe   = lerp(base.vibe, session.vibe, 0.6)   // 60% session-weighted
effective.cost   = session.cost ?? base.cost
```

Neighborhood match is **disabled** during session mode (tonight = go anywhere).

### 3.3 Backward Compatibility

If `venue.vectors` is null (not yet pipeline-enriched), fall back to the existing 16-dim cosine similarity. Gradual migration — no big-bang required.

---

## Part 4 — Technical Implementation Plan

### Phase 1: Shared Types + Scoring Constants

**Files:** `packages/shared/types/venue.ts`, `packages/shared/types/user.ts`, `packages/shared/index.ts`

- Add `VenueVector` interface (shared shape for user and venue)
- Add `vectors?: VenueVector` and `overall_score?: number` to `Venue`
- Add `vectors?: VenueVector` and `preferred_neighborhoods?: string[]` to `AppUser`
- Rename current `UserVector = number[]` → `LegacyUserVector` (used by 16-dim fallback)
- Add Netflix weights to `SCORING`:

```typescript
GENRE_WEIGHT: 0.35,
VIBE_WEIGHT: 0.30,
COST_WEIGHT: 0.15,
NEIGHBORHOOD_WEIGHT: 0.10,
QUALITY_WEIGHT: 0.10,
```

### Phase 2: `frontend/src/lib/netflixRec.ts` (new file)

Pure, testable scoring functions:

```typescript
export function jaccardSimilarity(a: string[], b: string[]): number
export function vibeCosineSimilarity(a: [n,n,n,n], b: [n,n,n,n]): number
export function costAlignment(userCost: number, venueCost: number): number
export function neighborhoodMatch(neighborhood: string, preferred: string[]): number
export function qualityScore(overallScore: number | undefined): number
export function netflixMatchScore(
  userVec: VenueVector,
  venue: Venue,
  preferredNeighborhoods: string[],
  rejectedVenues: Record<string, RejectedVenue>,
  viewedVenues: Record<string, number>,
  isSessionMode?: boolean
): number
export function blendSessionVector(base: VenueVector, session: VenueVector): VenueVector
```

### Phase 3: Store Update (`frontend/src/store/index.ts`)

- Add `userVectors: VenueVector | null` state
- Add `sessionVector: VenueVector | null` state
- Add `setUserVectors`, `setSessionVector`, `clearSession` actions
- Update `getMatchScore`: use `netflixMatchScore` when `venue.vectors` exists, 16-dim cosine otherwise
- Update `syncFromServer` to hydrate `userVectors` from server

### Phase 4: Claude Inference (`frontend/src/lib/claude.ts`)

**`inferUserVector()`**
- Input: selected genres (step 1), neighborhoods (step 2), winning venue from head-to-head (step 3), ideal night chips + free text (step 4)
- Returns `{ genres: string[], vibe: [n,n,n,n], cost: 1-4 }` as JSON
- Called at end of onboarding step 4

**`inferSessionVector()`**
- Input: tonight's 3 question answers + base user vector
- Returns: blended `VenueVector` for the session
- Called when returning user completes "Where to Tonight" questions

### Phase 5: Onboarding Redesign (`frontend/src/features/onboarding/index.tsx`)

Replace 5-step flow with 4 steps:

- **`StepGenres`** — 9 genre tiles, pick up to 3
- **`StepNeighborhoods`** — neighborhood chip multi-select
- **`StepHeadToHead`** — 3 adaptive venue vs venue rounds with bracket logic
- **`StepIdealNight`** — chip multi-select + free text → Claude inference → `setUserVectors`

### Phase 6: Session Prompt + Discovery Promotion

**`SessionVibePrompt` component** (new, shown on app open):

- 3 question cards (swipeable or stacked)
- After answering: `inferSessionVector()` → `setSessionVector()` → proceed to map
- "Skip" goes directly to map using base profile
- Map uses effective vector (blended if session exists)
- Header: "Reset tonight" button clears session and re-prompts

**`frontend/src/features/tonights-pick/index.tsx`:**

- Remove question phase (moved to session prompt)
- Result phase: show **top 3** recommendations instead of 1

### Phase 7: DB Schema Migration (`supabase/schema.sql`)

See schema changes in Part 2.2 above.

### Phase 8: Venue Pipeline (`scripts/fetch-venues.mjs`)

After Google Places fetch per venue:

1. Collect up to 5 review excerpts → `reviews[]`
2. Set `overall_score = googleRating`
3. Call Claude Haiku with name, description, tags, reviews, price_level → returns `vectors` JSON
4. Write to output CSV + `venues.ts` static file

New standalone script: `scripts/enrich-venues.mjs` (runs enrichment on existing CSV without re-fetching Places).

---

## Part 5 — Implementation Order

1. Shared types + scoring constants
2. `netflixRec.ts` pure functions
3. Store update
4. Onboarding redesign
5. Claude inference functions
6. Session prompt / "Where to Tonight" promotion
7. DB schema migration
8. Venue pipeline enrichment

---

## Part 6 — Critical Files

| File | Change |
|------|--------|
| `packages/shared/types/venue.ts` | Add `VenueVector`, update `Venue` |
| `packages/shared/types/user.ts` | Update `AppUser`, rename `UserVector` |
| `packages/shared/index.ts` | Add Netflix weights to `SCORING` |
| `frontend/src/lib/netflixRec.ts` | NEW — pure scoring functions |
| `frontend/src/store/index.ts` | Dual-mode `getMatchScore`, session state |
| `frontend/src/lib/claude.ts` | Add `inferUserVector`, `inferSessionVector` |
| `frontend/src/features/onboarding/index.tsx` | Full redesign (4 steps) |
| `frontend/src/features/discovery/index.tsx` | Session prompt, session-mode map |
| `frontend/src/features/tonights-pick/index.tsx` | Top-3 results, remove question phase |
| `supabase/schema.sql` | New columns + `session_vibes` table |
| `scripts/fetch-venues.mjs` | Claude enrichment per venue |
| `scripts/enrich-venues.mjs` | NEW — standalone enrichment script |

---

## Part 7 — Verification

1. `cd frontend && npx tsc --noEmit` — zero type errors
2. `jaccardSimilarity(["techno","house"], ["techno","jazz"]) === 0.333`
3. Complete 4-step onboarding → `userVectors` non-null in Zustand devtools
4. Answer tonight questions → map reorders venues vs. skipping session
5. Venue without `vectors` still renders a score (16-dim fallback path)
6. After onboarding, `users` row in Supabase has `vectors` JSONB + `preferred_neighborhoods`
7. `node scripts/fetch-venues.mjs` → output CSV has `vectors` column with valid JSON

---

## Backlog

- Spotify API: `User.genres` from listening history, artist URL/name
- Collaborative filtering: users with similar vectors → "people like you also liked"
- Venue vector drift: re-run enrichment if >30 days since last update
