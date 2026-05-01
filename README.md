# VenueMatch

> Personalized NYC nightlife discovery — learn your taste, rank every venue, pick tonight's spot with AI.

VenueMatch is a React SPA that builds a taste DNA from your favorite venues and artists, then ranks NYC clubs and bars by how well they match you. A nightly **Tonight's Pick** feature sends your profile + tonight's mood to Claude, which chooses and explains the single best venue for the night.

---

## Core Loop

```
Onboarding → Taste DNA built → Venues ranked by match score → Tonight's AI Pick
```

1. **Onboarding** — pick 5 seed venues + 5 seed artists to define your taste
2. **Discover** — browse all NYC venues ranked by your personal match score
3. **Tonight's Pick** — answer 2 mood questions, optionally add a song; Claude picks your night
4. **Feedback** — save or reject recommendations; rejections penalize similar vibes for 7 days

---

## Features

### Onboarding (5-step wizard)
- Name + email signup
- Preferences: nights out, purposes (dancing, live music, low-key, date night, etc.), travel radius, neighborhoods
- Seed venues: pick from curated list or search Google Places
- Seed artists: Spotify search with hover audio preview (iTunes fallback)
- Calibration: rate 3 seed venues across 4 dimensions to tune the algorithm

### Discover
- Venue list ranked by personal match score (0–100)
- Interactive Leaflet map with purple pin markers
- Full and compact card layouts with match badge

### Tonight's Pick
- 2 context questions (mood, solo vs group — rotate daily by day of week)
- Optional song search ("what's on repeat?") with Spotify preview on hover
- Claude generates one recommendation: venue + 1-line reason + match score (70–98)
- Feedback: Save / Reject / View Full Details

### Library
- Save venues as "want to visit" or "visited"
- Persisted to Supabase

### Venue Detail
- Photo hero (Google Places or color gradient fallback)
- Vibe tags, crowd description, hours
- 4-metric bar charts: Music, Energy, Danceability, Crowd Match
- Rate your own experience to improve future recommendations

---

## Matching Algorithm

Computed in `frontend/src/lib/claude.ts`. Returns 0–100.

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Base taste match | 70 | Euclidean distance across 4 dims (music, energy, dance, demo) vs user's taste vector |
| Purpose boost | 10 | +8 for dancing/low-key/live music match; +5 for artist discovery or date night |
| Neighborhood affinity | 5 | +5 if venue is in preferred neighborhoods |
| Genre affinity | 8 | +3 per seed artist genre match, capped at 8 |
| Popularity boost | 7 | Google rating × log(review count) |
| Rejection penalty | −20 / −10 | Penalize genres/vibes from venues rejected in last 7 days |
| Novelty penalty | −10–0 | Temporal decay for recently viewed venues (full at <1 day, 0 after 7 days) |

The **taste vector** blends seed venue implicit signal (prior) with explicit user ratings — ratings weighted at 0.6 once the user has rated venues, otherwise 100% seed-based.

---

## Tonight's Pick — Claude Flow

`frontend/src/lib/claude.ts → getTonightsRec()`

1. Filter discovery pool: all venues not in seed set
2. Score pool with `getMatchScore()`, take top 15 candidates
3. Build prompt with: taste vector, seed artists + genres, purposes, neighborhoods, rejection context, tonight's mood answers, top 15 candidates with full metadata
4. Call Claude via Supabase Edge Function (`backend/functions/recommendations/`)
5. Parse JSON response: `{ venueId, reason, matchScore, vibe }`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion 11 |
| State | Zustand 4 (UI state only) |
| Routing | React Router v6 |
| Map | Leaflet 1.9 |
| Icons | Lucide React |
| Backend | Supabase (Postgres + Deno Edge Functions) |
| AI | Anthropic Claude (`claude-sonnet-4-5`) |
| Deployment | Vercel (frontend) + Supabase (backend) |

---

## APIs Used

| API | Purpose | Auth |
|-----|---------|------|
| **Anthropic Claude** | Tonight's Pick recommendation engine | Server-side key via Supabase Edge Function; `VITE_ANTHROPIC_API_KEY` for local dev fallback |
| **Spotify Web API** | Artist search, top tracks, genre enrichment | `SPOTIFY_CLIENT_ID/SECRET` via `spotify-token` Edge Function |
| **iTunes Search API** | Audio preview fallback (Spotify removed preview_urls in 2024) | Public — no auth |
| **Google Places** | Venue photo, rating, review count, hours; custom venue search in onboarding | `VITE_GOOGLE_PLACES_KEY` |
| **Supabase** | Postgres DB, Auth, Edge Function runtime | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |

---

## Architecture

```
Browser (React SPA)
├── Zustand store (UI state only — no DB state)
│   └── Active tab, selected venue, map viewport, onboarding wizard progress
│
├── features/              # One folder per product feature
│   ├── auth/              # Sign in / sign up / Google OAuth
│   ├── onboarding/        # 5-step taste calibration wizard
│   ├── discovery/         # Venue list + Leaflet map
│   ├── tonights-pick/     # AI recommendation flow
│   ├── library/           # Saved / visited venues
│   ├── venue-detail/      # Full venue info + ratings
│   ├── groups/            # Group blended taste scores
│   └── profile/           # Taste breakdown + preferences
│
├── lib/api.ts             # Typed fetch client → Supabase Edge Functions
├── lib/supabase.ts        # Supabase client (auth only)
├── lib/places.ts          # Google Places API (onboarding search + enrichment)
├── lib/spotify.ts         # Spotify artist search + token management
├── lib/itunes.ts          # iTunes Search API fallback
├── lib/audio.ts           # HTML5 Audio preview singleton
└── lib/claude.ts          # Matching algorithm + Claude prompt builder

Supabase (Backend)
├── PostgreSQL
│   ├── users
│   ├── venues
│   ├── user_venue_ratings
│   ├── saved_venues
│   ├── daily_recs
│   ├── venue_rejections
│   └── groups / group_members
├── Row-Level Security on all user tables
└── Edge Functions (backend/functions/)
    ├── venues/            # Venue list + detail
    ├── users/             # User profile + vibe vector
    ├── ratings/           # Venue ratings
    ├── saved/             # Saved venues
    ├── recommendations/   # Tonight's Pick (Claude proxy)
    ├── rejections/        # Rejection penalty signal
    ├── groups/            # Group management + blended scores
    ├── spotify-token/     # Spotify client credentials exchange
    └── get-rec/           # Legacy Claude proxy (superseded by recommendations/)
```

---

## Project Structure

```
venuematch/
├── frontend/                    # React 18 SPA (TypeScript + Vite)
│   └── src/
│       ├── features/            # Feature modules
│       │   ├── auth/
│       │   ├── onboarding/
│       │   ├── discovery/
│       │   ├── tonights-pick/
│       │   ├── library/
│       │   ├── venue-detail/
│       │   ├── groups/
│       │   └── profile/
│       ├── components/          # Shared UI primitives (Button, Pill, etc.)
│       ├── hooks/               # useAuth, useServerSync
│       ├── lib/                 # API client + external service wrappers
│       ├── store/               # Zustand (UI state only)
│       └── main.tsx
│
├── backend/                     # Supabase Edge Functions (Deno + TypeScript)
│   ├── functions/
│   │   ├── venues/
│   │   ├── users/
│   │   ├── ratings/
│   │   ├── saved/
│   │   ├── recommendations/
│   │   ├── rejections/
│   │   ├── groups/
│   │   ├── spotify-token/
│   │   └── get-rec/
│   └── db/
│       └── schema.sql
│
├── packages/
│   └── shared/                  # TypeScript types shared across frontend + backend
│       └── types/
│           ├── venue.ts
│           ├── user.ts
│           ├── rating.ts
│           ├── recommendation.ts
│           └── group.ts
│
├── supabase/                    # Supabase CLI config + deployed functions mirror
│   ├── config.toml
│   └── functions/               # Deployed copies (mirrors backend/functions/)
│
├── docs/
│   ├── architecture.md          # Full system architecture
│   ├── product-spec.md          # Product requirements
│   └── transition.md            # Migration from old JS codebase
│
└── package.json                 # npm workspaces root
```

---

## Database Schema

| Table | Key Fields |
|-------|-----------|
| `users` | `id`, `email`, `display_name`, `music_score`, `energy_score`, `dance_score`, `demo_score`, `seed_venues[]`, `seed_artists[]`, `prefs` |
| `venues` | `id`, `slug`, `name`, `neighborhood`, `vibe_tags[]`, `music_genres[]`, four score columns (0–5), `google_rating`, `photo_url` |
| `user_venue_ratings` | `user_id`, `venue_id`, `music`, `energy`, `dance`, `demo` (1–5) |
| `saved_venues` | `user_id`, `venue_id`, `status` (`want_to_visit` or `visited`) |
| `daily_recs` | `user_id`, `venue_id`, `rec_date`, `match_score`, `reason`, `user_action` |
| `venue_rejections` | `user_id`, `venue_id`, `rejected_at`, `genres[]`, `vibe_tags[]` |
| `groups` | `id`, `name`, `code` (6-char invite), `created_by` |
| `group_members` | `group_id`, `user_id` |

All user-owned tables are protected by Row-Level Security (`auth.uid()` policies).

---

## Setup & Development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `VITE_GOOGLE_PLACES_KEY` | Google Cloud Console → Maps Platform → Places API |
| `VITE_ANTHROPIC_API_KEY` | console.anthropic.com — local dev fallback only |
| `SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard |

### 3. Supabase setup

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Run schema in Supabase SQL editor (or via CLI)
supabase db push

# Set secrets for Edge Functions
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set SPOTIFY_CLIENT_ID=...
supabase secrets set SPOTIFY_CLIENT_SECRET=...

# Deploy Edge Functions
supabase functions deploy venues users ratings saved recommendations rejections groups spotify-token
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:5173
```

### 5. Build

```bash
npm run build     # outputs to frontend/dist/
npm run preview   # preview production build
```

---

## Deployment

### Vercel

`vercel.json` is pre-configured. Add all `.env.local` variables as Vercel environment variables.

```bash
vercel --prod
```

### Supabase Edge Functions

```bash
supabase functions deploy venues users ratings saved recommendations rejections groups spotify-token
```

Functions read secrets from Supabase (`ANTHROPIC_API_KEY`, `SPOTIFY_CLIENT_ID/SECRET`) — never exposed to the client.

### Google OAuth (Auth setup)

1. Enable Google provider in [Supabase Auth settings](https://supabase.com/dashboard/project/_/auth/providers)
2. Create OAuth credentials in Google Cloud Console → add redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID + Secret into Supabase
4. Add your site URL + `<origin>/auth/callback` to Supabase redirect allowlist
