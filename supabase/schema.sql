-- VenueMatch schema v2.0
-- Run this against your Supabase project via the SQL editor or migration tool.

create extension if not exists "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────────────────

create table if not exists users (
  id                     text primary key,
  email                  text unique not null,
  name                   text,
  vibe_vector            jsonb      default '{}',
  seed_venues            text[]     default '{}',
  seed_artists           text[]     default '{}',
  seed_artist_genres     jsonb      default '{}',
  custom_seed_venues     jsonb      default '[]',
  prefs                  jsonb      default '{}',
  -- v2: Netflix-style vector (genres[], vibe[4], cost 1-4)
  vectors                jsonb      default null,
  -- v2: preferred neighborhoods from onboarding step 2
  preferred_neighborhoods text[]    default '{}',
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- ── Venues ───────────────────────────────────────────────────────────────────

create table if not exists venues (
  id             text primary key,
  name           text not null,
  neighborhood   text,
  address        text,
  description    text,
  vibe_tags      text[]  default '{}',
  music_genres   text[]  default '{}',
  music_score    float   default 3,
  energy_score   float   default 3,
  dance_score    float   default 3,
  demo_score     float   default 3,
  crowd_desc     text,
  hours          text,
  img_color      text    default '#1a1a2e',
  visible        boolean default true,
  -- Google Places enrichment
  photo_url      text,
  google_rating  float,
  review_count   int,
  hours_json     jsonb,
  lat            float,
  lng            float,
  -- v2: raw review excerpts (up to 5 strings)
  reviews        text[]  default '{}',
  -- v2: overall Google rating stored as overall_score for scoring
  overall_score  float   default null,
  -- v2: Netflix-style vector (genres[], vibe[4], cost 1-4)
  vectors        jsonb   default null,
  created_at     timestamptz default now()
);

-- ── User–Venue ratings ───────────────────────────────────────────────────────

create table if not exists user_venue_ratings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text references users(id) on delete cascade,
  venue_id     text references venues(id),
  music_score  float not null check (music_score between 1 and 5),
  energy_score float not null check (energy_score between 1 and 5),
  dance_score  float not null check (dance_score between 1 and 5),
  demo_score   float not null check (demo_score between 1 and 5),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_id, venue_id)
);

-- ── Saved venues ─────────────────────────────────────────────────────────────

create table if not exists saved_venues (
  id         uuid primary key default uuid_generate_v4(),
  user_id    text references users(id) on delete cascade,
  venue_id   text references venues(id),
  status     text check (status in ('want_to_visit', 'visited')) default 'want_to_visit',
  created_at timestamptz default now(),
  unique (user_id, venue_id)
);

-- ── Daily recs ───────────────────────────────────────────────────────────────

create table if not exists daily_recs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text references users(id) on delete cascade,
  venue_id    text references venues(id),
  rec_date    date not null,
  match_score int,
  user_action text check (user_action in ('saved', 'not_tonight', 'visited', 'dismissed')),
  created_at  timestamptz default now()
);

-- ── Session vibes (v2) ───────────────────────────────────────────────────────
-- Stores the per-session "Where to Tonight?" answers and blended vector.

create table if not exists session_vibes (
  id          uuid primary key default gen_random_uuid(),
  user_id     text references users(id) on delete cascade,
  created_at  timestamptz default now(),
  -- { energy, intent, genre_mood, timing, cost_comfort }
  answers     jsonb not null,
  -- blended VenueVector for this session { genres[], vibe[4], cost }
  session_vec jsonb not null
);

-- ── Venue rejections ─────────────────────────────────────────────────────────

create table if not exists venue_rejections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text references users(id) on delete cascade,
  venue_id    text references venues(id),
  genres      text[]      default '{}',
  vibe_tags   text[]      default '{}',
  rejected_at timestamptz default now(),
  unique (user_id, venue_id)
);

-- ── Groups ───────────────────────────────────────────────────────────────────

create table if not exists groups (
  id         text primary key,
  name       text not null,
  code       text unique not null,
  created_by text references users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists group_members (
  id           uuid primary key default uuid_generate_v4(),
  group_id     text references groups(id) on delete cascade,
  user_id      text,
  display_name text,
  seed_venues  text[]  default '{}',
  seed_artists text[]  default '{}',
  joined_at    timestamptz default now()
);

-- ── Row-level security ───────────────────────────────────────────────────────

alter table users             enable row level security;
alter table user_venue_ratings enable row level security;
alter table saved_venues      enable row level security;
alter table daily_recs        enable row level security;
alter table session_vibes     enable row level security;
alter table venue_rejections  enable row level security;

create policy "users_own"         on users             for all using (id = auth.uid()::text);
create policy "ratings_own"       on user_venue_ratings for all using (user_id = auth.uid()::text);
create policy "saved_own"         on saved_venues       for all using (user_id = auth.uid()::text);
create policy "recs_own"          on daily_recs         for all using (user_id = auth.uid()::text);
create policy "sessions_own"      on session_vibes      for all using (user_id = auth.uid()::text);
create policy "rejections_own"    on venue_rejections   for all using (user_id = auth.uid()::text);
create policy "venues_public_read" on venues            for select using (visible = true);
