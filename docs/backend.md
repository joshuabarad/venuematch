# Backend

> Stack: Supabase (PostgreSQL + Auth + Edge Functions) · Deno runtime for functions

There is no separate Node/Express server. All backend logic runs as Supabase Edge Functions (Deno). The frontend calls these via `lib/api.ts`.

---

## Connections & API Keys

All connection details come from Vite environment variables set in `.env`:

| Variable | Used for |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL; base URL for all API and edge function calls |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key; used to initialize the Supabase JS client |
| `VITE_ANTHROPIC_API_KEY` | Direct Anthropic API access (fallback when Supabase functions not deployed) |
| `VITE_GOOGLE_PLACES_KEY` | Google Places API (venue enrichment — photos, ratings, open status) |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify API (track search, artist genres) |
| `VITE_SPOTIFY_CLIENT_SECRET` | Spotify API secret |

`lib/supabase.ts` creates the client:
```ts
export const supabase = VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY
  ? createClient(url, key)
  : null;
export const isSupabaseEnabled = supabase !== null;
```

The `isSupabaseEnabled` flag gates all auth flows and server sync throughout the app.

---

## Authentication

Supabase Auth handles identity. Two providers are supported:

| Provider | Flow |
|---|---|
| Email + password | `supabase.auth.signUp()` / `signInWithPassword()` |
| Google OAuth | `supabase.auth.signInWithOAuth({ provider: 'google' })` |

`useAuth.ts` subscribes to `supabase.auth.onAuthStateChange` and exposes `{ session, user, loading }` to the app. Row-Level Security on all tables uses `auth.uid()` to enforce per-user data access.

---

## API Client — `lib/api.ts`

All server mutations go through `lib/api.ts`, which prefixes every call with `${VITE_SUPABASE_URL}/functions/v1`. Requests include the user's JWT from `supabase.auth.getSession()` as a Bearer token.

### Endpoints

#### Users
| Method | Path | What it does |
|---|---|---|
| GET | `/users` | Fetch current user profile (seed venues, artists, prefs, vectors) |
| PATCH | `/users` | Update user profile fields |
| POST | `/users/complete-onboarding` | Mark onboarding done; persist final state |

#### Ratings
| Method | Path | What it does |
|---|---|---|
| GET | `/ratings` | List all ratings for the logged-in user |
| PUT | `/ratings/:venueId` | Upsert a venue rating (music, energy, dance, demo) |

#### Saved Venues
| Method | Path | What it does |
|---|---|---|
| GET | `/saved` | List saved venues with status |
| PUT | `/saved/:venueId` | Upsert save status (`want_to_visit` or `visited`) |
| DELETE | `/saved/:venueId` | Remove a saved venue |

#### Recommendations
| Method | Path | What it does |
|---|---|---|
| GET | `/recommendations/tonight` | Fetch tonight's recommendation (passes prompt, user receives DailyRec JSON) |
| POST | `/recommendations/feedback` | Record user action on a rec (saved/not_tonight/visited/dismissed) |

#### Rejections
| Method | Path | What it does |
|---|---|---|
| POST | `/rejections` | Record a venue rejection (stores genres + vibe_tags for penalty tracking) |
| GET | `/rejections` | List recent rejections |

#### Groups
| Method | Path | What it does |
|---|---|---|
| GET | `/groups` | List user's groups |
| POST | `/groups` | Create group (returns code) |
| POST | `/groups/join` | Join group by code |
| DELETE | `/groups/:id` | Delete a group |

---

## Supabase Edge Functions

Located at `supabase/functions/`. Each is a Deno module. The frontend does not call Supabase tables directly — all writes go through these functions.

| Function | Purpose |
|---|---|
| `get-rec` | Receives a Claude prompt from the client; proxies to Anthropic API; returns `DailyRec` JSON |
| `claude-infer` | General-purpose Claude proxy; used by `inferUserVector` and `inferSessionVector` |
| `spotify-token` | Returns a client-credentials Spotify access token (keeps secret off client) |
| `users` | CRUD for user profile rows |
| `ratings` | CRUD for `user_venue_ratings` |
| `saved` | CRUD for `saved_venues` |
| `recommendations` | Records `daily_recs` rows and feedback |
| `rejections` | Records `venue_rejections` rows |
| `venues` | Reads `venues` table; optionally runs enrichment |
| `groups` | Manages `groups` and `group_members` tables |
| `_shared` | Shared Deno utilities (CORS headers, auth helpers) |

---

## Google Places API — `lib/places.ts`

Used to enrich the static `NYC_VENUES` array at runtime with live data.

**`enrichCuratedVenues(venues)`**
- Calls `https://places.googleapis.com/v1/places:searchText` for each venue name
- Fetches fields: `photos`, `rating`, `userRatingCount`, `currentOpeningHours`, `editorialSummary`
- Merges results back into venue objects as `photo`, `googleRating`, `reviewCount`, `isOpenNow`, `editorialSummary`
- Result is cached in a module-level variable so it only runs once per session

**`searchVenues(query)`**
- Used during onboarding custom venue search
- Returns `CustomSeedVenue[]` with `id`, `name`, `neighborhood`, `photo`, `address`, `source: 'google'`

**Fields requested from Places API:**
- `displayName.text` → `name`
- `shortFormattedAddress` → `address`
- `rating` → `googleRating`
- `userRatingCount` → `reviewCount`
- `currentOpeningHours.openNow` → `isOpenNow`
- `photos[0]` → photo URL (via `https://places.googleapis.com/v1/{name}/media`)
- `editorialSummary.text` → `editorialSummary`

---

## Spotify API — `lib/spotify.ts` + `lib/itunes.ts`

Used only in the Tonight's Pick flow for the song search input.

**Token**: Fetched from the `spotify-token` edge function (client credentials, not user OAuth).

**`searchTracks(query)`** — searches `https://api.spotify.com/v1/search?type=track`; returns `SpotifyTrack[]`

**`getArtistGenres(artistId)`** — fetches `https://api.spotify.com/v1/artists/{id}`; returns `genres[]`

**`lib/itunes.ts`** — used for audio previews (`preview_url` from Spotify is often null); falls back to iTunes Search API.

---

## Database Schema

### `users`
```
id                      text PK   (= auth.uid()::text)
email                   text UNIQUE NOT NULL
name                    text
vibe_vector             jsonb     (legacy)
seed_venues             text[]    (legacy)
seed_artists            text[]    (legacy)
seed_artist_genres      jsonb     (legacy)
custom_seed_venues      jsonb     (legacy)
prefs                   jsonb     { nights, purposes, travel_radius, neighborhoods }
vectors                 jsonb     { genres: string[], vibe: [n,n,n,n], cost: 1-4 }  ← v2
preferred_neighborhoods text[]    ← v2
created_at              timestamptz
updated_at              timestamptz
```

### `venues`
```
id            text PK
name          text NOT NULL
neighborhood  text
address       text
description   text
vibe_tags     text[]
music_genres  text[]
music_score   float   (1-5)
energy_score  float
dance_score   float
demo_score    float
crowd_desc    text
hours         text
img_color     text
visible       boolean default true
photo_url     text
google_rating float
review_count  int
hours_json    jsonb
lat           float
lng           float
reviews       text[]  (up to 5 excerpts)
overall_score float   (= google_rating, used by scoring engine)
vectors       jsonb   { genres, vibe[4], cost }  ← v2 (populated by enrichment script)
created_at    timestamptz
```

### `user_venue_ratings`
```
id           uuid PK
user_id      text → users(id)
venue_id     text → venues(id)
music_score  float  CHECK 1-5
energy_score float  CHECK 1-5
dance_score  float  CHECK 1-5
demo_score   float  CHECK 1-5
created_at   timestamptz
updated_at   timestamptz
UNIQUE (user_id, venue_id)
```

### `saved_venues`
```
id        uuid PK
user_id   text → users(id)
venue_id  text → venues(id)
status    text  CHECK IN ('want_to_visit', 'visited')  default 'want_to_visit'
created_at timestamptz
UNIQUE (user_id, venue_id)
```

### `daily_recs`
```
id          uuid PK
user_id     text → users(id)
venue_id    text → venues(id)
rec_date    date
match_score int
user_action text CHECK IN ('saved', 'not_tonight', 'visited', 'dismissed')
created_at  timestamptz
```

### `session_vibes`  *(v2)*
```
id          uuid PK
user_id     text → users(id)
answers     jsonb   { energy, intent, genre_mood, timing, cost_comfort }
session_vec jsonb   VenueVector { genres[], vibe[4], cost }
created_at  timestamptz
```

### `venue_rejections`
```
id          uuid PK
user_id     text → users(id)
venue_id    text → venues(id)
genres      text[]
vibe_tags   text[]
rejected_at timestamptz
UNIQUE (user_id, venue_id)
```

### `groups`
```
id         text PK
name       text NOT NULL
code       text UNIQUE
created_by text → users(id)
created_at timestamptz
```

### `group_members`
```
id           uuid PK
group_id     text → groups(id)
user_id      text
display_name text
seed_venues  text[]
seed_artists text[]
joined_at    timestamptz
```

---

## Row-Level Security

All tables except `venues` have RLS enabled. Policies use `auth.uid()::text = user_id` (or `id` for the users table). `venues` has a public-read policy filtering on `visible = true`.

---

## Venue Pipeline (scripts)

These are offline Node.js scripts, not part of the running app.

**`scripts/fetch-venues.mjs`** — monthly data collection:
1. Searches Google Places for bars/clubs/music venues across East Village, Lower East Side, West Village
2. Fetches full details per place (description, hours, price level, reviews)
3. Calls Claude Haiku per venue to derive `vectors` JSON
4. Outputs `data/venues-raw.csv`

**`scripts/enrich-venues.mjs`** — standalone enrichment:
- Reads an existing CSV
- Calls Claude Haiku for any rows missing `vectors`
- Outputs enriched CSV
- Does not re-fetch Google Places

Required env vars for scripts: `VITE_GOOGLE_PLACES_KEY`, `ANTHROPIC_API_KEY`
