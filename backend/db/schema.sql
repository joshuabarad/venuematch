-- VenueMatch schema
-- Run this in the Supabase SQL editor (safe to re-run)

create extension if not exists "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id                  text primary key,
  email               text unique not null,
  name                text,
  onboarding_complete boolean default false,
  music_score         numeric(3,2) default 3,
  energy_score        numeric(3,2) default 3,
  dance_score         numeric(3,2) default 3,
  demo_score          numeric(3,2) default 3,
  seed_venues         text[] default '{}',
  seed_artists        text[] default '{}',
  seed_artist_genres  jsonb default '{}',
  custom_seed_venues  jsonb default '[]',
  prefs               jsonb default '{}',
  rated_count         integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── Venues ────────────────────────────────────────────────────────────────────

create table if not exists public.venues (
  id                text primary key,
  name              text not null,
  neighborhood      text,
  address           text,
  description       text,
  vibe_tags         text[] default '{}',
  music_genres      text[] default '{}',
  music_score       numeric(3,2) default 3,
  energy_score      numeric(3,2) default 3,
  dance_score       numeric(3,2) default 3,
  demo_score        numeric(3,2) default 3,
  crowd_desc        text,
  hours             text,
  img_color         text default '#1a1a2e',
  google_place_id   text,
  google_rating     numeric(2,1),
  review_count      integer default 0,
  photo_url         text,
  is_open_now       boolean,
  editorial_summary text,
  visible           boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── Ratings ───────────────────────────────────────────────────────────────────

create table if not exists public.user_venue_ratings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null references public.users(id) on delete cascade,
  venue_id     text not null references public.venues(id) on delete cascade,
  music_score  numeric(3,2) not null check (music_score between 1 and 5),
  energy_score numeric(3,2) not null check (energy_score between 1 and 5),
  dance_score  numeric(3,2) not null check (dance_score between 1 and 5),
  demo_score   numeric(3,2) not null check (demo_score between 1 and 5),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(user_id, venue_id)
);

-- ── Saved Venues ──────────────────────────────────────────────────────────────

create table if not exists public.saved_venues (
  id         uuid primary key default uuid_generate_v4(),
  user_id    text not null references public.users(id) on delete cascade,
  venue_id   text not null references public.venues(id) on delete cascade,
  status     text not null default 'want_to_visit'
             check (status in ('want_to_visit', 'visited')),
  created_at timestamptz default now(),
  unique(user_id, venue_id)
);

-- ── Daily Recs ────────────────────────────────────────────────────────────────

create table if not exists public.daily_recs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null references public.users(id) on delete cascade,
  venue_id    text not null references public.venues(id) on delete cascade,
  rec_date    date not null default current_date,
  match_score integer,
  vibe        text,
  reason      text,
  user_action text check (user_action in ('saved', 'not_tonight', 'visited', 'dismissed')),
  context     jsonb default '{}',
  created_at  timestamptz default now(),
  unique(user_id, rec_date)
);

-- ── Venue Rejections ──────────────────────────────────────────────────────────

create table if not exists public.venue_rejections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null references public.users(id) on delete cascade,
  venue_id    text not null references public.venues(id) on delete cascade,
  genres      text[] default '{}',
  vibe_tags   text[] default '{}',
  rejected_at timestamptz default now()
);

-- ── Groups ────────────────────────────────────────────────────────────────────

create table if not exists public.groups (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  code       text unique not null,
  created_by text references public.users(id),
  created_at timestamptz default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   text not null references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table public.users              enable row level security;
alter table public.venues             enable row level security;
alter table public.user_venue_ratings enable row level security;
alter table public.saved_venues       enable row level security;
alter table public.daily_recs         enable row level security;
alter table public.venue_rejections   enable row level security;
alter table public.groups             enable row level security;
alter table public.group_members      enable row level security;

-- Drop existing policies before recreating (safe to re-run)
drop policy if exists "users_own"            on public.users;
drop policy if exists "venues_public_read"   on public.venues;
drop policy if exists "ratings_own"          on public.user_venue_ratings;
drop policy if exists "saved_own"            on public.saved_venues;
drop policy if exists "recs_own"             on public.daily_recs;
drop policy if exists "rejections_own"       on public.venue_rejections;
drop policy if exists "groups_member_read"   on public.groups;
drop policy if exists "groups_creator_write" on public.groups;
drop policy if exists "group_members_own"    on public.group_members;

create policy "users_own"          on public.users              for all using (id = auth.uid()::text);
create policy "venues_public_read" on public.venues             for select using (visible = true);
create policy "ratings_own"        on public.user_venue_ratings for all using (user_id = auth.uid()::text);
create policy "saved_own"          on public.saved_venues       for all using (user_id = auth.uid()::text);
create policy "recs_own"           on public.daily_recs         for all using (user_id = auth.uid()::text);
create policy "rejections_own"     on public.venue_rejections   for all using (user_id = auth.uid()::text);
create policy "group_members_own"  on public.group_members      for all using (user_id = auth.uid()::text);

create policy "groups_member_read" on public.groups
  for select using (
    id in (select group_id from public.group_members where user_id = auth.uid()::text)
  );
create policy "groups_creator_write" on public.groups
  for all using (created_by = auth.uid()::text);
