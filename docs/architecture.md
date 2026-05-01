# VenueMatch — Architecture Design Document

> Version 1.0 · April 2026 · Confidential

---

## 1. Guiding Principles

1. **Mobile-first, iOS-ready.** Every interface decision assumes a phone screen first. The web app and a future React Native app share TypeScript types and business logic.
2. **Modular by feature.** Each product feature (Onboarding, Discovery, Tonight's Pick, Library, Groups) is a self-contained module — its own folder, types, API routes, and DB tables. Two engineers can work without stepping on each other.
3. **Frontend/backend separation.** The React app never calls Supabase directly. It calls an API layer that owns all DB logic. This makes the iOS transition a frontend swap, not a rewrite.
4. **Scalable by default, simple for now.** The architecture is designed to support a multi-sided marketplace (goers, venues, artists) and real-time features (Flare). We start simple and add complexity only when the surface warrants it.
5. **TypeScript end to end.** Shared types live in `packages/shared`. Breaking changes in the DB schema surface as compiler errors on both sides.

---

## 2. Repository Structure

```
venuematch/
├── frontend/                    # React 18 SPA (TypeScript + Vite)
│   ├── src/
│   │   ├── features/            # Feature modules (one folder per product feature)
│   │   │   ├── onboarding/
│   │   │   ├── discovery/
│   │   │   ├── tonights-pick/
│   │   │   ├── library/
│   │   │   ├── venue-detail/
│   │   │   └── profile/
│   │   ├── components/          # Shared UI primitives only (Button, Pill, etc.)
│   │   ├── hooks/               # Shared hooks (useAuth, useStore, etc.)
│   │   ├── lib/                 # External API clients (Spotify, iTunes, Places)
│   │   ├── store/               # Zustand store (UI state only — not DB state)
│   │   ├── router/              # React Router config
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                     # API layer (Supabase Edge Functions, Deno/TypeScript)
│   ├── functions/               # One Edge Function per domain
│   │   ├── auth/                # Auth helpers, token refresh
│   │   ├── venues/              # venues CRUD + enrichment
│   │   ├── users/               # user profile + vibe vector
│   │   ├── ratings/             # venue ratings
│   │   ├── recommendations/     # Tonight's Pick (Claude proxy)
│   │   ├── groups/              # group management
│   │   └── spotify-token/       # Spotify OAuth token exchange
│   ├── db/
│   │   ├── schema.sql           # Full Postgres schema
│   │   ├── migrations/          # Numbered migration files
│   │   └── seed.sql             # Curated venue seed data
│   └── supabase.ts              # Shared Supabase admin client
│
├── packages/
│   └── shared/                  # TypeScript types shared across frontend + backend
│       ├── types/
│       │   ├── venue.ts
│       │   ├── user.ts
│       │   ├── rating.ts
│       │   ├── recommendation.ts
│       │   ├── group.ts
│       │   └── api.ts           # Request/response envelope types
│       └── constants/
│           └── scoring.ts       # Scoring weights (single source of truth)
│
├── docs/                        # This folder
│   ├── architecture.md
│   ├── product-spec.md
│   └── transition.md
│
└── package.json                 # Workspace root (npm workspaces or pnpm)
```

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Client Layer                    │
│                                                     │
│  ┌──────────────────┐     ┌───────────────────┐    │
│  │   Web (React)    │     │  iOS (React Native │    │
│  │   Vite + TS      │     │   Expo) — future   │    │
│  └────────┬─────────┘     └─────────┬─────────┘    │
│           │                         │               │
│           └──────────┬──────────────┘               │
│                      │ HTTP / fetch                  │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────┐
│              API Layer (Supabase Edge Functions)     │
│                      │                              │
│  ┌───────────┐ ┌─────┴──────┐ ┌──────────────────┐ │
│  │  /venues  │ │   /users   │ │ /recommendations  │ │
│  │  /ratings │ │  /groups   │ │  (Claude proxy)   │ │
│  └─────┬─────┘ └─────┬──────┘ └────────┬─────────┘ │
│        │             │                  │            │
└────────┼─────────────┼──────────────────┼────────────┘
         │             │                  │
┌────────┼─────────────┼──────────────────┼────────────┐
│        │    Supabase (Postgres + Auth)   │            │
│        │             │                  │            │
│  ┌─────▼──────┐ ┌────▼──────┐ ┌────────▼──────┐    │
│  │   venues   │ │   users   │ │ user_ratings  │    │
│  │saved_venues│ │  groups   │ │  daily_recs   │    │
│  └────────────┘ └───────────┘ └───────────────┘    │
│                                                     │
│  Auth: Supabase Auth (email + Google OAuth)         │
│  Realtime: Supabase Realtime (Groups / Flare)       │
└─────────────────────────────────────────────────────┘
         │                    │
┌────────▼────┐     ┌─────────▼──────────────────────┐
│  Anthropic  │     │         External APIs           │
│  Claude API │     │  Spotify · iTunes · Google      │
│  (rec engine│     │  Places (called from frontend   │
│  server-side│     │  — no auth required server-side)│
└─────────────┘     └────────────────────────────────┘
```

---

## 4. Database Schema

All tables use UUIDs, `created_at`/`updated_at` timestamps, and Row-Level Security. The schema is the source of truth — TypeScript types in `packages/shared` are generated from it.

### 4.1 `users`
```sql
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  avatar_url    text,
  -- Vibe vector (4 dimensions, 0.0–5.0)
  music_score   numeric(3,2) default 0,
  energy_score  numeric(3,2) default 0,
  dance_score   numeric(3,2) default 0,
  demo_score    numeric(3,2) default 0,
  -- Onboarding
  onboarding_complete boolean default false,
  seed_venues   uuid[] default '{}',          -- refs to venues.id
  seed_artists  text[] default '{}',          -- artist names
  seed_artist_genres jsonb default '{}',      -- { artistName: [genre1, genre2] }
  custom_seed_venues jsonb default '[]',      -- [{ id, name, neighborhood, photo }]
  -- Preferences
  prefs         jsonb default '{}',           -- nights, purposes, radius, neighborhoods
  rated_count   integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### 4.2 `venues`
```sql
create table public.venues (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,      -- e.g. "nowadays-ridgewood"
  name              text not null,
  neighborhood      text not null,
  address           text,
  description       text,
  vibe_tags         text[] default '{}',
  music_genres      text[] default '{}',
  -- Scored dimensions (curated, 0.0–5.0)
  music_score       numeric(3,2) not null,
  energy_score      numeric(3,2) not null,
  dance_score       numeric(3,2) not null,
  demo_score        numeric(3,2) not null,
  crowd_desc        text,
  hours             text,
  img_color         text default '#1a1a2e',
  -- Google Places enrichment (populated by enrichment script)
  google_place_id   text,
  google_rating     numeric(2,1),
  review_count      integer default 0,
  photo_url         text,
  is_open_now       boolean,
  editorial_summary text,
  -- Status
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
-- Publicly readable
alter table public.venues enable row level security;
create policy "Venues are publicly readable"
  on venues for select using (is_active = true);
```

### 4.3 `user_venue_ratings`
```sql
create table public.user_venue_ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  venue_id   uuid not null references public.venues(id) on delete cascade,
  music      smallint check (music between 1 and 5),
  energy     smallint check (energy between 1 and 5),
  dance      smallint check (dance between 1 and 5),
  demo       smallint check (demo between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, venue_id)
);
```

### 4.4 `saved_venues`
```sql
create type venue_save_status as enum ('want_to_visit', 'visited');

create table public.saved_venues (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  venue_id   uuid not null references public.venues(id) on delete cascade,
  status     venue_save_status not null default 'want_to_visit',
  created_at timestamptz default now(),
  unique(user_id, venue_id)
);
```

### 4.5 `daily_recs`
```sql
create type rec_action as enum ('saved', 'not_tonight', 'visited', 'dismissed');

create table public.daily_recs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  venue_id    uuid not null references public.venues(id) on delete cascade,
  rec_date    date not null default current_date,
  match_score smallint,
  vibe        text,
  reason      text,
  user_action rec_action,
  context     jsonb default '{}',   -- tonight's answers + song
  created_at  timestamptz default now(),
  unique(user_id, rec_date)
);
```

### 4.6 `groups`
```sql
create table public.groups (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  code          text unique not null,       -- 6-char invite code
  created_by    uuid references public.users(id),
  created_at    timestamptz default now()
);

create table public.group_members (
  group_id   uuid references public.groups(id) on delete cascade,
  user_id    uuid references public.users(id) on delete cascade,
  joined_at  timestamptz default now(),
  primary key (group_id, user_id)
);
```

### 4.7 `venue_rejections` (replaces in-memory store)
```sql
create table public.venue_rejections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  venue_id    uuid not null references public.venues(id) on delete cascade,
  rejected_at timestamptz default now(),
  genres      text[] default '{}',
  vibe_tags   text[] default '{}'
);
```

### Future: `flares` (not built yet — schema reserved)
```sql
-- Placeholder for Friends Flare feature
-- create table public.flares (
--   id           uuid primary key default gen_random_uuid(),
--   user_id      uuid not null references public.users(id) on delete cascade,
--   lat          numeric(9,6) not null,
--   lng          numeric(9,6) not null,
--   venue_id     uuid references public.venues(id),
--   message      text,
--   expires_at   timestamptz not null,   -- flares are ephemeral (e.g. 4 hours)
--   created_at   timestamptz default now()
-- );
-- Realtime channel: flares:group_id=<uuid>
```

---

## 5. API Layer

All endpoints are Supabase Edge Functions (Deno + TypeScript). The frontend imports a typed API client that wraps `fetch`. There is no Supabase client in the frontend — all DB access flows through these endpoints.

### 5.1 Response envelope

```typescript
// packages/shared/types/api.ts
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };
```

### 5.2 Endpoints

| Method | Path | Function | Description |
|--------|------|----------|-------------|
| `GET` | `/venues` | `venues/list` | All active venues (with optional genre filter) |
| `GET` | `/venues/:id` | `venues/get` | Single venue with full detail |
| `GET` | `/users/me` | `users/me` | Current user profile + vibe vector |
| `PATCH` | `/users/me` | `users/update` | Update profile, prefs, seeds |
| `POST` | `/users/me/complete-onboarding` | `users/complete-onboarding` | Mark onboarding done, compute initial vibe vector |
| `GET` | `/ratings` | `ratings/list` | All ratings for current user |
| `PUT` | `/ratings/:venueId` | `ratings/upsert` | Create or update a venue rating |
| `GET` | `/saved` | `saved/list` | Current user's saved venues |
| `PUT` | `/saved/:venueId` | `saved/upsert` | Save or update save status |
| `DELETE` | `/saved/:venueId` | `saved/delete` | Unsave a venue |
| `GET` | `/recommendations/tonight` | `recommendations/tonight` | Get or generate today's rec |
| `POST` | `/recommendations/tonight/feedback` | `recommendations/feedback` | Save/reject/dismiss today's rec |
| `POST` | `/rejections/:venueId` | `rejections/create` | Reject a venue (penalty signal) |
| `GET` | `/groups` | `groups/list` | Groups current user belongs to |
| `POST` | `/groups` | `groups/create` | Create a group |
| `POST` | `/groups/join` | `groups/join` | Join group by invite code |
| `GET` | `/groups/:id/scores` | `groups/scores` | Blended vibe scores for a group |
| `POST` | `/spotify/token` | `spotify-token` | Exchange client credentials for Spotify token |

### 5.3 Frontend API client (TypeScript)

```typescript
// frontend/src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL; // Supabase Functions URL

async function apiFetch<T>(
  path: string,
  opts?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getToken()}`,
      ...opts?.headers,
    },
  });
  return res.json();
}

export const api = {
  venues: {
    list: (genre?: string) => apiFetch<Venue[]>(`/venues${genre ? `?genre=${genre}` : ''}`),
    get: (id: string) => apiFetch<Venue>(`/venues/${id}`),
  },
  users: { ... },
  ratings: { ... },
  recommendations: { ... },
  groups: { ... },
};
```

---

## 6. Authentication

**Now:** Supabase Auth with email/password (anonymous sessions allowed during onboarding).

**Next:** Google OAuth via Supabase Auth (single config change — no code changes required in the API layer).

```typescript
// Google OAuth is one flag in Supabase dashboard + one line in client:
supabase.auth.signInWithOAuth({ provider: 'google' });
```

**Session flow:**
1. User signs in → Supabase issues JWT
2. Frontend attaches JWT to every API request (`Authorization: Bearer <token>`)
3. Edge Functions verify JWT with `supabase.auth.getUser(token)`
4. RLS policies enforce that users can only access their own rows

**iOS:** Supabase Auth supports the same Google OAuth flow via `supabase-js` in React Native. No changes to the backend.

---

## 7. Scoring — Single Source of Truth

All match scoring weights live in `packages/shared/constants/scoring.ts`. Both the frontend (for real-time preview) and the backend (for recommendation generation) import from the same file. No drift between client and server scores.

```typescript
// packages/shared/constants/scoring.ts
export const SCORING = {
  BASE_MAX: 70,
  PURPOSE_MAX: 10,
  NEIGHBORHOOD_MAX: 5,
  GENRE_MAX: 8,
  POPULARITY_MAX: 7,
  REJECTION_PENALTY_STRONG: -20,
  REJECTION_PENALTY_WEAK: -10,
  NOVELTY_PENALTY_MAX: -10,
  NOVELTY_DECAY_DAYS: 7,
  RATING_WEIGHT: 0.6,
  SEED_WEIGHT: 0.4,
} as const;
```

---

## 8. External API Boundaries

These are called from the **frontend only** — they require no server-side auth beyond the token exchange.

| API | Called from | Caching strategy |
|-----|------------|-----------------|
| Google Places (photos, ratings, hours) | `frontend/src/lib/places.ts` | In-memory per page load (venues don't change intraday) |
| Spotify (artist search, top tracks) | `frontend/src/lib/spotify.ts` | Token cached in memory, refreshed on 401 |
| iTunes (preview URL fallback) | `frontend/src/lib/itunes.ts` | No cache needed (fast, cheap) |

**Google Places enrichment script** (run by colleague): A separate Node script pulls Place details for all curated venues and writes them into the `venues` table. Once this runs, the frontend reads `photo_url`, `google_rating`, etc. from the DB instead of calling Places on every page load. The `lib/places.ts` client still exists for the onboarding venue search flow.

---

## 9. State Management Strategy

| State type | Where it lives |
|-----------|---------------|
| Server state (venues, ratings, saved) | Fetched from API, cached in React Query (TBD) or simple useState |
| Auth state | Supabase Auth session (React context) |
| UI state (active tab, selected venue, map viewport) | Zustand (not persisted to DB) |
| Onboarding wizard progress | Zustand (persisted to localStorage until `complete-onboarding` is called) |

The Zustand store shrinks significantly post-transition: it only holds UI state, not user data. User data lives in the DB and is fetched via the API.

---

## 10. iOS Transition Path

The architecture is designed so the iOS transition is a **new app shell, not a rewrite**.

| Layer | Web | iOS |
|-------|-----|-----|
| TypeScript types | `packages/shared` | Same package (shared) |
| API calls | `frontend/src/lib/api.ts` | React Native app imports same client |
| Business logic (scoring) | `packages/shared/constants/scoring.ts` | Same package |
| UI components | React + Tailwind | React Native + NativeWind or StyleSheet |
| Navigation | React Router v6 | React Navigation |
| Auth | Supabase JS | Supabase JS (same SDK) |
| Maps | Leaflet | `react-native-maps` (MapKit on iOS) |
| State | Zustand | Zustand (same) |

**What stays:** All API endpoints, the database schema, auth, scoring constants, and TypeScript types.

**What changes:** UI rendering layer (HTML → React Native components), navigation, map library.

---

## 11. Future: Friends Flare Feature

**Concept:** A friend can drop a "flare" on the map showing they're at or headed to a venue. The map renders a pulsing ring around their location. Flares are ephemeral — they expire after 4 hours.

**Architecture impact (designed for now, built later):**

- `flares` table reserved in schema (see §4.7) — do not build yet
- Supabase Realtime channel `flares:group_id=<uuid>` — subscribe on map mount when user is in a group
- Map component receives an optional `flares: Flare[]` prop — render pulsing rings as an overlay layer above venue pins
- No changes to scoring, API, or auth layers

**Why it fits cleanly:** The map already knows about groups (`activeGroupId` in store). Subscribing to a Realtime channel on group activation is a single hook addition. The flare rendering is a new layer in `VenueMap` that doesn't touch existing marker logic.

---

## 12. Scalability Notes

The current architecture (Supabase Edge Functions + Postgres) handles the MVP comfortably. When the platform adds venue-side and artist-side flows, the extension points are:

- **New tables:** `venue_profiles`, `artists`, `events`, `bookings` — additive migrations, no existing tables change
- **New Edge Function domains:** `/events`, `/artists`, `/bookings` — isolated from goer-side functions
- **Scoring engine:** When ML-based scoring replaces the heuristic algorithm, it slots in behind the same `/recommendations/tonight` endpoint — the frontend sees no change
- **CDN for venue photos:** Replace `photo_url` with a Supabase Storage URL — one column change, no frontend logic changes
- **Horizontal scale:** Edge Functions scale automatically. If Postgres becomes a bottleneck, read replicas are a Supabase config change

---

*Document owner: Engineering · Last updated: April 2026*
