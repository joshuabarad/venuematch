# VenueMatch — Backend

Supabase project powering auth, the database, and the Claude recommendation edge function.

---

## Purpose

The backend has two responsibilities:

1. **Database + auth** — Supabase Postgres stores users, venues, ratings, saved venues, and daily recommendations. Row-level security (RLS) policies enforce that users can only read and write their own data. Venues are publicly readable.

2. **Claude proxy (Edge Function)** — The `get-rec` Deno edge function forwards prompts to the Anthropic API. Running the call server-side keeps the Anthropic API key out of the browser bundle and allows the key to be stored as a Supabase secret.

---

## Tech stack

| Layer | Tool |
|---|---|
| Platform | Supabase (hosted Postgres + Edge Functions) |
| Edge runtime | Deno (Supabase Edge Functions) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Auth | Supabase Auth (anonymous + email) |

---

## Database schema

Run `supabase/schema.sql` against your Supabase project to create all tables and policies.

### Tables

| Table | Purpose |
|---|---|
| `users` | User profile, taste vector (`vibe_vector`), seed venues, seed artists |
| `venues` | Curated NYC venue data with vibe scores across four dimensions (music, energy, dance, demo) |
| `user_venue_ratings` | Per-user ratings for each dimension on visited venues; used to refine the taste vector |
| `saved_venues` | Bookmarked venues with status (`want_to_visit` or `visited`) |
| `daily_recs` | Log of tonight's-pick recommendations and user actions (`saved`, `visited`, `not_tonight`, `dismissed`) |

### Row-level security

All user-owned tables (`users`, `user_venue_ratings`, `saved_venues`, `daily_recs`) are protected by RLS policies that restrict access to the row's owner via `auth.uid()`. The `venues` table is publicly readable.

---

## Edge Function: `get-rec`

**Location:** `supabase/functions/get-rec/index.ts`

**Endpoint:** `POST {SUPABASE_URL}/functions/v1/get-rec`

**Request body:**
```json
{ "prompt": "<full Claude prompt string>" }
```

**Response:**
```json
{ "text": "<Claude's raw text response>" }
```

The function forwards the prompt to `https://api.anthropic.com/v1/messages` using the `ANTHROPIC_API_KEY` secret and returns the first content block as `text`. The frontend (`src/lib/claude.js`) parses the JSON embedded in that text.

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note your **Project URL** and **anon key** from Settings → API.

### 2. Apply the schema

In the Supabase dashboard open the SQL editor and run the contents of `supabase/schema.sql`. This creates all tables, enables RLS, and sets up the security policies.

### 3. Set the Anthropic API key as a secret

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Or add it in the Supabase dashboard under Settings → Edge Functions → Secrets.

### 4. Deploy the edge function

Install the Supabase CLI if you haven't:

```bash
brew install supabase/tap/supabase
```

Link your project and deploy:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy get-rec
```

### 5. Wire up the frontend

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the frontend's `.env.local`. The frontend will automatically route Claude calls through the edge function when `VITE_SUPABASE_URL` is present.

---

## Vercel serverless function: `api/spotify-token.js`

This is a Node.js Vercel function (not part of Supabase) that lives in the same repo for convenience. It exchanges Spotify client credentials for a short-lived access token so the secret never reaches the browser.

**Endpoint:** `POST /api/spotify-token`

**Environment variables required on Vercel:**
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

The frontend (`src/lib/spotify.js`) calls this endpoint when running in production (Vercel) and falls back to direct Spotify calls in local dev if the credentials are unavailable.
