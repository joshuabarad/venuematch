# VenueMatch — Transition Document

> MVP → Scalable Architecture · April 2026 · Confidential

This document describes exactly how to move from the current codebase to the target architecture defined in `architecture.md`. It is structured as a phased plan so two engineers can split work and stay unblocked.

---

## Current State Summary

| Dimension | Current state |
|-----------|--------------|
| Language | JavaScript (`.jsx`, `.js`) |
| Folder structure | Single `src/` with `components/`, `lib/`, `store/`, `data/` |
| DB calls | Supabase client called directly from components |
| State | Zustand store holds user data, ratings, saved venues, groups, and UI state |
| Auth | Supabase Auth (email, anonymous fallback) |
| API | One Edge Function (`get-rec`) for Claude; Spotify token via Vercel fn |
| Venues | Hardcoded in `src/data/venues.js` |
| Places enrichment | Called from frontend on every page load |
| TypeScript | None |

---

## Target State Summary

| Dimension | Target state |
|-----------|-------------|
| Language | TypeScript throughout (`frontend/`, `backend/`, `packages/shared/`) |
| Folder structure | `frontend/` · `backend/` · `packages/shared/` at monorepo root |
| DB calls | API layer only — frontend never touches Supabase directly |
| State | Zustand for UI state only; server state fetched via API |
| Auth | Supabase Auth + Google OAuth |
| API | Supabase Edge Functions per domain, typed with shared types |
| Venues | DB table (`venues`) seeded from `src/data/venues.js`; enriched by colleague's script |
| Places enrichment | Runs once via script → writes to DB; frontend reads from DB |
| TypeScript | End-to-end, types shared via `packages/shared` |

---

## Phases

---

### Phase 0: Monorepo Setup *(do this first, blocks everything)*

**Who:** Either engineer

**Goal:** Establish the folder structure and npm workspaces so both engineers can work in parallel.

**Steps:**

1. Create the root `package.json` with workspaces:

```json
{
  "name": "venuematch",
  "private": true,
  "workspaces": ["frontend", "backend", "packages/shared"]
}
```

2. Move current `src/`, `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `package.json` into `frontend/`

3. Move `supabase/` into `backend/`; rename `backend/supabase/functions` → `backend/functions`

4. Move `api/spotify-token.js` into `backend/functions/spotify-token/`

5. Create `packages/shared/` with `package.json`:

```json
{
  "name": "@venuematch/shared",
  "version": "0.0.1",
  "main": "index.ts"
}
```

6. Update `frontend/package.json` to add `"@venuematch/shared": "*"` as a dependency

7. Verify `npm install` works from root; verify `npm run dev` still works from `frontend/`

**Acceptance:** App runs identically at `localhost:5173`. Nothing visible changes.

---

### Phase 1: TypeScript Migration *(parallel with Phase 2)*

**Who:** Engineer A

**Goal:** Convert all `.jsx`/`.js` files to `.tsx`/`.ts` with real types. Start with shared types, then backend, then frontend.

#### Step 1.1 — Shared types

Create `packages/shared/types/` with the following files. These become the contract between frontend and backend.

```
packages/shared/types/
├── venue.ts
├── user.ts
├── rating.ts
├── recommendation.ts
├── group.ts
└── api.ts
```

**`venue.ts`:**
```typescript
export interface Venue {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  address?: string;
  description?: string;
  vibe_tags: string[];
  music_genres: string[];
  music_score: number;
  energy_score: number;
  dance_score: number;
  demo_score: number;
  crowd_desc?: string;
  hours?: string;
  img_color: string;
  google_rating?: number;
  review_count: number;
  photo_url?: string;
  is_open_now?: boolean;
  editorial_summary?: string;
}
```

**`user.ts`:**
```typescript
export interface VibeVector {
  music: number;
  energy: number;
  dance: number;
  demo: number;
}

export interface UserPreferences {
  nights: string[];
  purposes: string[];
  radius: string;
  neighborhoods: string[];
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  vibe_vector: VibeVector;
  onboarding_complete: boolean;
  seed_venues: string[];
  seed_artists: string[];
  seed_artist_genres: Record<string, string[]>;
  custom_seed_venues: CustomSeedVenue[];
  prefs: UserPreferences;
  rated_count: number;
}

export interface CustomSeedVenue {
  id: string;
  name: string;
  neighborhood: string;
  photo?: string;
}
```

**`rating.ts`:**
```typescript
export interface VenueRating {
  venue_id: string;
  music: number;
  energy: number;
  dance: number;
  demo: number;
}

export type SaveStatus = 'want_to_visit' | 'visited';

export interface SavedVenue {
  venue_id: string;
  status: SaveStatus;
}
```

**`recommendation.ts`:**
```typescript
export interface TonightAnswers {
  answers: string[];
  song?: { title: string; artist: string };
}

export interface DailyRec {
  venue_id: string;
  match_score: number;
  vibe: string;
  reason: string;
  user_action?: 'saved' | 'not_tonight' | 'visited' | 'dismissed';
}
```

**`api.ts`:**
```typescript
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } };
```

#### Step 1.2 — Add `tsconfig.json` to `frontend/`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@venuematch/shared/*": ["../packages/shared/*"]
    }
  },
  "include": ["src"]
}
```

#### Step 1.3 — Rename and type files

**Order that minimizes breakage:**

1. `src/lib/*.js` → `src/lib/*.ts` (no JSX, easiest start)
2. `src/store/index.js` → `src/store/index.ts`
3. `src/data/venues.js` → `src/data/venues.ts` (add `Venue[]` type annotation)
4. `src/components/ui/index.jsx` → `src/components/ui/index.tsx`
5. All remaining `.jsx` → `.tsx`, one component at a time

**Tip:** Run `tsc --noEmit` after each file. Fix errors before moving to the next file. Don't batch.

**Replace all `any` with real types from `@venuematch/shared`.** The goal is zero `any` in production code.

#### Step 1.4 — Update `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@venuematch/shared': '../packages/shared' }
  }
});
```

---

### Phase 2: Database & API Layer *(parallel with Phase 1)*

**Who:** Engineer B

**Goal:** Stand up the full DB schema, seed it, and write the Edge Functions.

#### Step 2.1 — Run the new schema

Run `backend/db/schema.sql` in the Supabase SQL editor. This creates all tables with RLS policies.

**If the current `users` and `user_venue_ratings` tables already exist:** write a migration that adds missing columns rather than dropping and recreating. See `backend/db/migrations/001_add_missing_columns.sql`.

#### Step 2.2 — Seed venues

Convert `src/data/venues.js` to a SQL seed file and run it:

```bash
# One-time: insert all curated venues into the venues table
psql $DATABASE_URL < backend/db/seed.sql
```

Or write a small script:

```typescript
// backend/scripts/seed-venues.ts
import { createClient } from '@supabase/supabase-js';
import { venues } from '../../frontend/src/data/venues'; // temporary import

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SERVICE_ROLE_KEY!);

for (const v of venues) {
  await supabase.from('venues').upsert({
    id: v.id,
    slug: v.id,   // use existing ID as slug for now
    name: v.name,
    neighborhood: v.neighborhood,
    // ... map all fields
  }, { onConflict: 'id' });
}
```

#### Step 2.3 — Write Edge Functions

Write one function per domain. Each follows the same pattern:

```typescript
// backend/functions/venues/index.ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify JWT
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { error: authError } = await supabase.auth.getUser(token);
  if (authError) return new Response(JSON.stringify({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }), { status: 401 });

  const { data, error } = await supabase.from('venues').select('*').eq('is_active', true);
  return new Response(JSON.stringify({ data, error }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Priority order:**
1. `venues/list` — unblocks all discovery UI
2. `users/me` (GET + PATCH) — unblocks profile + onboarding complete
3. `ratings/upsert` — unblocks Venue Detail ratings
4. `saved/upsert` + `saved/list` — unblocks Library
5. `recommendations/tonight` — moves Claude call from frontend to backend
6. `rejections/create` — moves rejection logic to backend
7. `groups/*` — lowest priority, existing local behavior continues

#### Step 2.4 — Deploy functions

```bash
supabase functions deploy venues
supabase functions deploy users
supabase functions deploy ratings
supabase functions deploy saved
supabase functions deploy recommendations
supabase functions deploy rejections
supabase functions deploy groups
supabase functions deploy spotify-token
```

Set secrets:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set SPOTIFY_CLIENT_ID=...
supabase secrets set SPOTIFY_CLIENT_SECRET=...
```

---

### Phase 3: Frontend API Client *(depends on Phase 1 + Phase 2)*

**Who:** Engineer A (after Phase 1 TypeScript is done)

**Goal:** Replace direct Supabase calls and Zustand server state with API client calls.

#### Step 3.1 — Write the typed API client

```typescript
// frontend/src/lib/api.ts
import type { ApiResponse, Venue, User, VenueRating, SavedVenue, DailyRec } from '@venuematch/shared/types';

const BASE = import.meta.env.VITE_API_URL;

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<ApiResponse<T>> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  });
  return res.json();
}

export const api = {
  venues: {
    list: (genre?: string) =>
      apiFetch<Venue[]>(`/venues${genre ? `?genre=${genre}` : ''}`),
    get: (id: string) => apiFetch<Venue>(`/venues/${id}`),
  },
  users: {
    me: () => apiFetch<User>('/users/me'),
    update: (body: Partial<User>) =>
      apiFetch<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
    completeOnboarding: () =>
      apiFetch<User>('/users/me/complete-onboarding', { method: 'POST' }),
  },
  ratings: {
    list: () => apiFetch<VenueRating[]>('/ratings'),
    upsert: (venueId: string, rating: Omit<VenueRating, 'venue_id'>) =>
      apiFetch<VenueRating>(`/ratings/${venueId}`, { method: 'PUT', body: JSON.stringify(rating) }),
  },
  saved: {
    list: () => apiFetch<SavedVenue[]>('/saved'),
    upsert: (venueId: string, status: SavedVenue['status']) =>
      apiFetch<SavedVenue>(`/saved/${venueId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    remove: (venueId: string) => apiFetch<void>(`/saved/${venueId}`, { method: 'DELETE' }),
  },
  recommendations: {
    tonight: (context?: object) =>
      apiFetch<DailyRec>(`/recommendations/tonight${context ? `?ctx=${encodeURIComponent(JSON.stringify(context))}` : ''}`),
    feedback: (action: DailyRec['user_action']) =>
      apiFetch<void>('/recommendations/tonight/feedback', { method: 'POST', body: JSON.stringify({ action }) }),
  },
  rejections: {
    create: (venueId: string, genres: string[], vibe_tags: string[]) =>
      apiFetch<void>(`/rejections/${venueId}`, { method: 'POST', body: JSON.stringify({ genres, vibe_tags }) }),
  },
};
```

#### Step 3.2 — Slim down the Zustand store

The Zustand store currently holds server state (user profile, ratings, saved venues, groups). After this phase, it holds **UI state only**:

```typescript
// frontend/src/store/index.ts (post-transition)
interface UIStore {
  // Navigation
  activeTab: 'discover' | 'library' | 'profile';
  setActiveTab: (tab: UIStore['activeTab']) => void;

  // Discovery
  activeVenueId: string | null;
  setActiveVenueId: (id: string | null) => void;
  genreFilter: string;
  setGenreFilter: (genre: string) => void;

  // Groups UI
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;

  // Onboarding (stays in Zustand until complete — then synced to DB)
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  draftProfile: Partial<User>;
  updateDraftProfile: (patch: Partial<User>) => void;
}
```

Server state (venues, ratings, user profile) moves to React component state or a lightweight fetching layer (React Query is a clean option but not required).

#### Step 3.3 — Migrate components one feature at a time

**Order:**
1. **Discovery** — replace `useStore().venues` with `api.venues.list()` fetch on mount
2. **Venue Detail** — replace `useStore().venueRatings` with `api.ratings.list()` + `api.ratings.upsert()`
3. **Library** — replace `useStore().savedVenues` with `api.saved.list()`
4. **Tonight's Pick** — replace `getTonightsRec()` direct Claude call with `api.recommendations.tonight()`
5. **Onboarding** — call `api.users.completeOnboarding()` on final step
6. **Profile** — replace store values with `api.users.me()`

**Keep local fallback for each feature until the API version is confirmed working in staging.** Remove fallback in the same PR that ships the API version.

---

### Phase 4: Auth Upgrade

**Who:** Either engineer · *can be done any time after Phase 0*

**Goal:** Add Google OAuth as a sign-in option.

#### Steps:

1. In Supabase dashboard: **Authentication → Providers → Google** → enable, paste Client ID + Secret from Google Cloud Console

2. In frontend, add a Google sign-in button:

```typescript
// frontend/src/features/onboarding/components/StepSignup.tsx
const handleGoogleSignIn = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};
```

3. Add a `/auth/callback` route that handles the OAuth redirect and redirects to home or onboarding.

4. The API layer needs no changes — JWTs from Google OAuth are validated by Supabase exactly like email JWTs.

**Note:** The Supabase client is the **only** place the frontend should use Supabase directly — only for auth session management. All data access goes through the API layer.

---

### Phase 5: Feature Folder Restructure

**Who:** Engineer A · *do this at the end of Phase 3 when components are already being touched*

**Goal:** Move from component-type folders to feature-module folders so engineers can own complete features.

**Before:**
```
src/components/
  onboarding/
  venue/
  recommendation/
  ui/
src/lib/
src/store/
src/data/
```

**After:**
```
src/features/
  onboarding/
    components/
    hooks/
    types.ts       (feature-local types if any)
    index.tsx      (feature entry point)
  discovery/
    components/
    hooks/
    scoring.ts     (match score computation)
    index.tsx
  tonights-pick/
    components/
    hooks/
    index.tsx
  library/
    components/
    hooks/
    index.tsx
  venue-detail/
    components/
    hooks/
    index.tsx
  profile/
    components/
    hooks/
    index.tsx
src/components/    # Shared UI primitives only (Button, Pill, etc.)
src/lib/           # External API clients (Spotify, iTunes, Places)
src/store/         # UI-only Zustand store
src/hooks/         # Shared hooks (useAuth, etc.)
```

Move files one feature at a time. Update imports. Run `tsc --noEmit` after each feature.

---

## Team Split

| Area | Engineer A | Engineer B |
|------|-----------|-----------|
| TypeScript migration | ✓ | |
| Frontend API client | ✓ | |
| Feature folder restructure | ✓ | |
| Google Auth UI | ✓ | |
| DB schema + migrations | | ✓ |
| Edge Functions (all) | | ✓ |
| Venue seed script | | ✓ |
| Google Places enrichment script | | ✓ |
| Supabase secrets + deploy | | ✓ |

**Coordination points** (must sync before proceeding):
- After Phase 0: confirm folder structure + workspace names
- After Step 1.1: shared types are the contract — both engineers freeze the type definitions before building against them
- Before Phase 3: API endpoints must be deployed and testable before frontend migration begins

---

## Environment Variables — New vs Old

| Variable | Status | Where used |
|----------|--------|-----------|
| `VITE_SUPABASE_URL` | Keep | Frontend (auth session only) |
| `VITE_SUPABASE_ANON_KEY` | Keep | Frontend (auth session only) |
| `VITE_API_URL` | **New** | Frontend → points to Supabase Functions base URL |
| `VITE_GOOGLE_PLACES_KEY` | Keep | Frontend (venue search in onboarding) |
| `VITE_ANTHROPIC_API_KEY` | **Remove from frontend** | Moved to Supabase secret |
| `SPOTIFY_CLIENT_ID` | Move to Supabase secret | Backend Edge Function |
| `SPOTIFY_CLIENT_SECRET` | Move to Supabase secret | Backend Edge Function |
| `SUPABASE_SERVICE_ROLE_KEY` | **New (backend only)** | Edge Functions (admin DB access) |

---

## What Does NOT Change

- Visual design (colors, typography, layout, animations)
- The matching algorithm logic (moves to `packages/shared/constants/scoring.ts`, same math)
- External API integrations (Spotify, iTunes, Google Places — same clients, same behavior)
- The curated venue dataset (same data, now in DB instead of a JS file)
- Supabase as the database (deepening, not replacing)

---

## Acceptance Checklist

Before declaring the transition complete:

- [ ] `frontend/` builds with zero TypeScript errors (`tsc --noEmit`)
- [ ] All API endpoints return correct data for authenticated requests
- [ ] Onboarding completes and writes to `users` table
- [ ] Match scores compute correctly and match pre-transition behavior
- [ ] Tonight's Pick returns a Claude recommendation via Edge Function
- [ ] Rating a venue updates `user_venue_ratings` and recalculates vibe vector
- [ ] Save/unsave works and persists across page reload
- [ ] Library shows correct saved/visited venues
- [ ] Google sign-in flow completes and lands on correct page
- [ ] App works with no localStorage data (fresh device, fresh Supabase session)
- [ ] No Supabase client import exists outside `src/hooks/useAuth.ts`

---

*Document owner: Engineering · Last updated: April 2026*
