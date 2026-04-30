# VenueMatch — Frontend

NYC nightlife discovery app that learns your taste and recommends venues for tonight.

---

## Purpose

VenueMatch is a React single-page application that helps users find NYC nightlife venues that match their music taste and vibe. During onboarding the user selects seed venues and artists; the app builds a taste profile from those choices and uses it to rank every venue in the database. A "Tonight's pick" feature sends the profile and the user's current mood to Claude, which picks and explains the single best venue for the night.

Core flows:
- **Onboarding** — collect name, seed venues (from curated list or Google Places search), and seed artists (Spotify/iTunes search)
- **Discover** — split map/list view of all venues ranked by taste-match score, filterable by genre
- **Library** — saved venues split into "want to visit" and "visited" lists
- **Groups** — create groups with friends to find venues that work for the whole group
- **Tonight's pick** — AI-powered single recommendation based on taste profile + tonight's mood questions

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 18 |
| Build | Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand (persisted to localStorage) |
| Routing | React Router v6 |
| Map | Leaflet |
| Icons | Lucide React |
| Database client | `@supabase/supabase-js` |

---

## Setup

### 1. Install dependencies

```bash
cd venuematch
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values:

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `VITE_ANTHROPIC_API_KEY` | console.anthropic.com — only needed if not using Supabase Edge Functions |
| `VITE_GOOGLE_PLACES_KEY` | Google Cloud Console → Maps → Places API |
| `SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer Dashboard — only needed for Vercel deployment |

`VITE_ANTHROPIC_API_KEY` is a fallback for local dev without Supabase. In production, the Supabase Edge Function handles Claude calls so the key never reaches the browser.

`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` are used by the `api/spotify-token.js` Vercel serverless function, not the Vite build, so they do **not** need the `VITE_` prefix.

### 3. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### 4. Build for production

```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

### 5. Deploy to Vercel

The `vercel.json` at the root configures Vite as the framework and adds a catch-all rewrite so React Router handles all routes client-side. Push to your connected Vercel project or run:

```bash
vercel --prod
```

Add all `.env.local` variables as Vercel environment variables in the project dashboard.

---

## Project structure

```
src/
  App.jsx                        # Root: onboarding gate → home → venue detail
  main.jsx                       # React entry point
  store/index.js                 # Zustand store — user profile, saved venues, groups
  pages/
    HomePage.jsx                 # Discover / Library / Groups tabs + modals
    LibraryPage.jsx              # Saved venues (want-to-visit + visited)
    GroupsPage.jsx               # Group management + group match score
    ProfilePage.jsx              # Edit profile, view taste breakdown
  components/
    onboarding/
      Onboarding.jsx             # Multi-step onboarding flow
      VenueSearch.jsx            # Seed venue picker (curated list + Google Places)
      ArtistSearch.jsx           # Seed artist picker (Spotify + iTunes)
    venue/
      VenueCard.jsx              # Compact venue card with match score
      VenueDetail.jsx            # Full venue detail sheet
      VenueMap.jsx               # Leaflet map with venue markers
    recommendation/
      TonightsRec.jsx            # Tonight's pick UI (mood questions → AI result)
    ui/
      BottomNav.jsx              # Mobile bottom navigation
      index.jsx                  # Shared UI primitives
  lib/
    claude.js                    # Taste scoring + Claude prompt + recommendation logic
    supabase.js                  # Supabase client + user/venue/rating helpers
    places.js                    # Google Places API — venue photo/rating enrichment
    spotify.js                   # Spotify search for artists + token management
    itunes.js                    # iTunes Search API fallback for artists
    audio.js                     # Audio preview playback helpers
  data/
    venues.js                    # Curated NYC venue dataset
    venueCoords.js               # Latitude/longitude for map markers
```
