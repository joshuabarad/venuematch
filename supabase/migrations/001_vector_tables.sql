-- Run this in your Supabase SQL editor to enable vector-based recommendations.
-- Requires the pgvector extension (available on all Supabase projects).

-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Venue embeddings
--    dim=16 for mock vectors; change to dim=1536 when switching to OpenAI embeddings.
create table if not exists venue_embeddings (
  venue_id    text primary key,
  embedding   vector(16),
  sources     jsonb,          -- which data sources were used (google, ra, structured)
  model       text default 'mock-v1',
  updated_at  timestamptz default now()
);

-- Fast ANN index (ivfflat for cosine similarity)
create index if not exists venue_embeddings_ivfflat
  on venue_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- 3. User interactions — every signal we collect per user per venue
create table if not exists user_interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  venue_id    text not null,
  type        text not null,  -- 'view' | 'save' | 'not_tonight' | 'visit' | 'rate'
  value       float not null, -- +1.0 positive, -0.5 weak negative, -1.0 strong negative
  metadata    jsonb,          -- e.g. { rating: 4, note: "great DJ" }
  created_at  timestamptz default now()
);

create index if not exists user_interactions_user_id on user_interactions (user_id);
create index if not exists user_interactions_venue_id on user_interactions (venue_id);

-- 4. User embeddings — derived preference vector, updated on each interaction
create table if not exists user_embeddings (
  user_id     uuid primary key references auth.users on delete cascade,
  embedding   vector(16),
  interaction_count int default 0,
  updated_at  timestamptz default now()
);

-- 5. Helper: find top N venues for a user by cosine similarity
--    Usage: select * from match_venues_for_user('user-uuid', 10);
create or replace function match_venues_for_user(p_user_id uuid, p_limit int default 10)
returns table (venue_id text, similarity float)
language sql stable as $$
  select
    ve.venue_id,
    1 - (ve.embedding <=> ue.embedding) as similarity
  from venue_embeddings ve
  cross join user_embeddings ue
  where ue.user_id = p_user_id
  order by ve.embedding <=> ue.embedding
  limit p_limit;
$$;

-- 6. Helper: update a user's embedding after a new interaction
--    Applies a weighted running average: new = old * decay + venue_vec * weight
create or replace function update_user_embedding(
  p_user_id  uuid,
  p_venue_id text,
  p_weight   float  -- positive or negative signal strength
)
returns void language plpgsql as $$
declare
  v_venue_emb vector(16);
  v_user_emb  vector(16);
  v_count     int;
  decay       float := 0.85;
begin
  select embedding into v_venue_emb from venue_embeddings where venue_id = p_venue_id;
  if v_venue_emb is null then return; end if;

  select embedding, interaction_count into v_user_emb, v_count
  from user_embeddings where user_id = p_user_id;

  if v_user_emb is null then
    -- First interaction: initialise with venue vector
    insert into user_embeddings (user_id, embedding, interaction_count)
    values (p_user_id, v_venue_emb, 1)
    on conflict (user_id) do update
      set embedding = excluded.embedding, interaction_count = 1, updated_at = now();
  else
    -- Weighted running average
    update user_embeddings
    set
      embedding = (v_user_emb * decay + v_venue_emb * (1 - decay) * p_weight),
      interaction_count = v_count + 1,
      updated_at = now()
    where user_id = p_user_id;
  end if;
end;
$$;
