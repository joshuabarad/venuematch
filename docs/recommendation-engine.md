# Recommendation Engine

The recommendation engine has two modes that coexist in the codebase. Which one runs for a given venue depends on whether that venue has been enriched with a `vectors` field.

---

## Mode 1 — Netflix-Style Scoring (v2, primary path)

**File**: `frontend/src/lib/netflixRec.ts`

Runs when: `venue.vectors` is non-null AND `store.userVectors` is set (i.e. user has completed the v2 onboarding).

### Formula

```
score (0–100) =
  0.35 × genre_jaccard
+ 0.30 × vibe_cosine
+ 0.15 × cost_alignment
+ 0.10 × neighborhood_match
+ 0.10 × quality_score
− rejection_penalty
− novelty_penalty
```

All five components produce a 0–1 value. Multiply the weighted sum by 100 to get the raw 0–100 score, then subtract penalties and clamp to [0, 100].

### Component functions

**`jaccardSimilarity(a, b)`** — `|intersection| / |union|` on genre string arrays (case-insensitive).
Example: `["techno","house"]` vs `["techno","jazz"]` = 1/3 ≈ 0.333

**`vibeCosineSimilarity(a, b)`** — cosine similarity on two `[number, number, number, number]` vibe vectors.
Both vectors are non-negative (0–1 per dimension), so result is always 0–1.

**`costAlignment(userCost, venueCost)`** — `1 − |userCost − venueCost| / 3`.
Max gap is 3 (cost 1 vs cost 4), giving a score of 0. Exact match = 1.

**`neighborhoodMatch(neighborhood, preferred, sessionMode)`**
- Returns `1.0` if the venue's neighborhood is in the user's preferred list
- Returns `0.5` as the baseline otherwise
- Returns `0.5` always during session mode (tonight = go anywhere)

**`qualityScore(overallScore)`** — `overallScore / 5.0`. Falls back to `0.5` if no rating is available.
`overallScore` comes from `venue.overall_score` (set by enrichment pipeline = Google rating).

### Penalties

**Rejection penalty** — looks at `rejectedVenues` entries from the last 7 days:
- Collects all genres and vibe_tags from recent rejections
- If 2+ of the candidate venue's genres match rejected genres, OR 2+ of its vibe_tags match rejected tags → **−20**
- If the combined genre + tag overlap is ≥2 → **−10**
- Otherwise → **0**

**Novelty penalty** — based on `viewedVenues[venue.id]` timestamp:
- Viewed today (< 1 day ago) → **−10**
- Viewed 1–3 days ago → **−5**
- Viewed 3–7 days ago → **−2**
- Not recently viewed → **0**

### Session mode

When a `sessionVector` exists and `sessionDate === today`, the effective vector blended for scoring is:

```
effective.genres = union(userVectors.genres, sessionVector.genres)
effective.vibe[i] = lerp(userVectors.vibe[i], sessionVector.vibe[i], 0.6)
effective.cost = sessionVector.cost
```

That is: genres are additive, vibe is 60% session-weighted, and cost is overridden by the session.
Neighborhood match is disabled in session mode (returns baseline 0.5).

---

## Mode 2 — Legacy 16-Dim Cosine Similarity (fallback)

**File**: `frontend/src/lib/vectorRec.ts`

Runs when: `venue.vectors` is null or `store.userVectors` is null (i.e. venue not yet pipeline-enriched, or user completed old onboarding flow).

### Vector space

Each venue and user is represented as a 16-dimensional vector. Dimensions (from `VECTOR_DIMS` in `venueProfiles.ts`):

1. music_curation
2. energy
3. dance
4. late_night
5. underground
6. electronic
7. rnb_hiphop
8. jazz_world
9. live_music
10. queer
11. intimate
12. outdoor
13. exclusive
14. chill
15. diverse
16. local

Venue vectors are hardcoded in `data/venueProfiles.ts` (one row per curated venue).

### Building the user vector

**`buildUserVector(seedArtists, seedArtistGenres, seedVenues, customSeedVenues)`**

1. **Artist contribution** — looks up each `seedArtist` name in `ARTIST_PROFILES` (hardcoded in `venueProfiles.ts`). Uses genre-based heuristics to map unknown artists via `genresToVector()`.
2. **Seed venue contribution** — looks up each `seedVenueId` in `VENUE_PROFILES`.
3. **Custom venue contribution** — runs `placesToVector()` on Google Places data (checks name, types, and editorial summary for keywords to set dimensions).
4. **Blending** — if both ratings and seeds exist: `userVec = 0.6 × ratingVec + 0.4 × seedVec`. Seed-only users use seed vector directly.

**`buildGroupVector(members)`** — calls `buildUserVector` for each group member and averages the resulting vectors.

### Scoring

**`vectorMatchScore(venue, userVec)`** — cosine similarity, scaled to **[50, 99]**:
```
cosine = dot(venueVec, userVec) / (|venueVec| × |userVec|)
score = 50 + cosine × 49
```
Output is always 50–99 (never 0 for a partial mismatch).

### Penalties applied in store (not in vectorRec.ts)

The legacy path also applies the same rejection and novelty penalties inside `store.getMatchScore()`, after calling `vectorMatchScore`. Plus a neighborhood affinity bonus of +3 for venues in the user's preferred neighborhoods (capped at 99).

---

## Tonight's Pick — Claude-Powered Rec

**File**: `frontend/src/lib/claude.ts` → `getTonightsRec()`

This is the single-venue "recommendation of the night" flow, distinct from the scored venue list. It uses Claude (Sonnet or Haiku) as the decision-maker.

### How it works

1. Runs `buildUserVector()` to produce a 16-dim vector
2. Filters `NYC_VENUES` to the discovery pool (excludes seed venues, excludes `isOpenNow === false`)
3. Sorts discovery pool by `vectorMatchScore`, takes top 15
4. Serializes the top 15 venues as a short JSON list
5. Builds a prompt that includes:
   - Seed venue names (DO NOT recommend these — use to understand taste)
   - 16-dim taste fingerprint (first 8 dims shown)
   - Seed artists with their genres
   - `prefs.purposes` (tonight's goals)
   - `prefs.neighborhoods` (preferred areas)
   - Recent rejection context (genres and vibes to avoid)
   - Tonight's mood (`answers.q1`, `answers.q2`, optional `currentSong`)
6. Sends to Claude via:
   - Supabase `get-rec` edge function (if `VITE_SUPABASE_URL` set)
   - Direct Anthropic API (if `VITE_ANTHROPIC_API_KEY` set)
7. Parses the JSON response into `DailyRec { venueId, reason, matchScore, vibe }`
8. **Fallback**: if Claude fails, returns the top-scored venue from step 3 with a generated reason

### Model used

- Primary: `claude-sonnet-4-20250514`
- Enrichment (inferUserVector, inferSessionVector): `claude-haiku-4-20250514`

---

## User Vector Inference (Onboarding)

**`inferUserVector()`** in `lib/claude.ts`

Called at the end of onboarding Step 4. Sends all onboarding signals to Claude Haiku:
- Selected genres (from Step 1)
- Preferred neighborhoods (from Step 2)
- Head-to-head winning venue with its full metadata (from Step 3)
- Ideal night chips + free-text description (from Step 4)

Claude returns `{ genres: string[], vibe: [n,n,n,n], cost: 1-4 }`.

Values are clamped: vibe dimensions to [0, 1], cost rounded to nearest integer in [1, 4].

**Fallback** (if Claude is unavailable): uses a hardcoded genre-to-vibe mapping table:

| Genre | energy | underground | social | dance |
|---|---|---|---|---|
| electronic | 0.8 | 0.7 | 0.4 | 0.8 |
| hip-hop | 0.7 | 0.4 | 0.7 | 0.5 |
| rock | 0.7 | 0.5 | 0.4 | 0.3 |
| jazz | 0.3 | 0.6 | 0.5 | 0.2 |
| indie | 0.5 | 0.6 | 0.5 | 0.3 |
| pop | 0.6 | 0.2 | 0.7 | 0.6 |
| chill | 0.2 | 0.4 | 0.4 | 0.2 |

---

## Session Vector Inference (Where to Tonight?)

**`inferSessionVector(answers, baseVector)`** in `lib/claude.ts`

Called when returning user completes the nightly "Where to Tonight?" prompt.

Sends tonight's question answers + the user's stored base `VenueVector` to Claude Haiku. Claude returns a raw session vector. That raw vector is immediately blended with the base via `blendSessionVector()`.

**Result is stored in** `store.sessionVector` and `store.sessionDate`. It is cleared when the user clicks "Skip" or on the next day.

---

## Vibe Dimensions Reference

The 4-dim `vibe` array is shared between users and venues (v2 only):

| Index | Dimension | 0.0 means | 1.0 means |
|---|---|---|---|
| 0 | energy | mellow lounge | high-energy club |
| 1 | underground | mainstream / commercial | underground / alternative |
| 2 | social | focused listening crowd | mixer / meetup crowd |
| 3 | dance | standing bar | dance-floor focus |

---

## Data Flow Summary

```
User opens app
  └─ onboardingComplete?
       No  → 4-step onboarding
                └─ Step 4: inferUserVector() → store.userVectors (VenueVector)
       Yes → sessionDate = today?
               No  → SessionVibePrompt
                        └─ inferSessionVector() → store.sessionVector
               Yes → skip
  └─ Discovery map/list
        forEach venue:
          venue.vectors exists AND store.userVectors set?
            Yes → netflixMatchScore() [Mode 1]
            No  → vectorMatchScore() [Mode 2 fallback]
          Apply rejection + novelty penalties
          Sort descending → rendered list + map gradient
```
