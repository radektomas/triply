-- Traveler profile: the personalization layer behind /onboarding.
--
-- Three pieces of durable state, all owned by the signed-in user and read/
-- written under their cookie-bound (RLS) client:
--
--   profiles.*            preferences captured by the onboarding wizard —
--                         vibes, per-person trip budget, home airport, usual
--                         travel party, and when the wizard was completed.
--   visited_places        "where I've been" — one row per place, with an
--                         optional photo stored in the private
--                         `visited-photos` storage bucket.
--   travel_windows        "when I'm free to travel" — date ranges. This is
--                         also the seam for the deal tracker: a future matcher
--                         joins incoming deals against these rows and notifies
--                         the owner. Nothing consumes them for that yet.
--
-- All three are cleared by app/profile/actions.ts deleteAccount (service role).


-- ── public.profiles ─────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists vibes                   text[]      not null default '{}',
  add column if not exists travel_budget_eur       integer,
  add column if not exists home_airport            text,
  add column if not exists home_city               text,
  add column if not exists travel_party            integer,
  add column if not exists onboarding_completed_at timestamptz;

-- Keep the envelope identical to the planner form / API clamp (100–2000 EUR
-- per person) so a stored budget can always be replayed into /api/trips.
alter table public.profiles
  drop constraint if exists profiles_travel_budget_eur_range;
alter table public.profiles
  add constraint profiles_travel_budget_eur_range
    check (travel_budget_eur is null or (travel_budget_eur between 100 and 2000));

alter table public.profiles
  drop constraint if exists profiles_travel_party_range;
alter table public.profiles
  add constraint profiles_travel_party_range
    check (travel_party is null or (travel_party between 1 and 10));

comment on column public.profiles.vibes is
  'Preferred trip vibes from the onboarding wizard (subset of ALLOWED_VIBES in app/api/trips/route.ts). First entry is the primary vibe.';
comment on column public.profiles.travel_budget_eur is
  'Usual per-person, whole-trip budget in EUR. Same [100,2000] envelope as the planner.';
comment on column public.profiles.home_airport is
  'IATA code of the home airport (lib/data/airports.ts).';
comment on column public.profiles.home_city is
  'City name of the home airport — what /api/trips receives as originCity.';
comment on column public.profiles.travel_party is
  'Usual number of travelers (1 solo, 2 couple, 4 family, 5 group).';
comment on column public.profiles.onboarding_completed_at is
  'Set when the user finishes /onboarding. NULL = never completed (profile page nudges).';


-- ── public.visited_places ───────────────────────────────────────────────────
create table if not exists public.visited_places (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  name          text        not null,
  country       text        not null default '',
  country_code  text        not null default '',
  lat           double precision,
  lng           double precision,
  -- Object path inside the `visited-photos` bucket: `<user_id>/<place id>.jpg`.
  -- NULL when the user added the place without a picture.
  photo_path    text,
  created_at    timestamptz not null default now(),
  constraint visited_places_name_len check (char_length(name) between 1 and 80)
);

create index if not exists idx_visited_places_user
  on public.visited_places (user_id, created_at desc);

alter table public.visited_places enable row level security;

drop policy if exists "visited_places select own" on public.visited_places;
create policy "visited_places select own"
  on public.visited_places for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "visited_places insert own" on public.visited_places;
create policy "visited_places insert own"
  on public.visited_places for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "visited_places update own" on public.visited_places;
create policy "visited_places update own"
  on public.visited_places for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "visited_places delete own" on public.visited_places;
create policy "visited_places delete own"
  on public.visited_places for delete to authenticated
  using (auth.uid() = user_id);


-- ── public.travel_windows ───────────────────────────────────────────────────
create table if not exists public.travel_windows (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  start_date  date        not null,
  end_date    date        not null,
  -- Optional free-text label ("Autumn break", "Between jobs").
  label       text,
  created_at  timestamptz not null default now(),
  constraint travel_windows_order check (end_date > start_date),
  constraint travel_windows_label_len check (label is null or char_length(label) <= 60)
);

-- The deal matcher will ask "which windows overlap this deal's dates?" —
-- indexed by start_date so that scan is cheap across every user.
create index if not exists idx_travel_windows_user
  on public.travel_windows (user_id, start_date);
create index if not exists idx_travel_windows_dates
  on public.travel_windows (start_date, end_date);

alter table public.travel_windows enable row level security;

drop policy if exists "travel_windows select own" on public.travel_windows;
create policy "travel_windows select own"
  on public.travel_windows for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "travel_windows insert own" on public.travel_windows;
create policy "travel_windows insert own"
  on public.travel_windows for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "travel_windows update own" on public.travel_windows;
create policy "travel_windows update own"
  on public.travel_windows for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "travel_windows delete own" on public.travel_windows;
create policy "travel_windows delete own"
  on public.travel_windows for delete to authenticated
  using (auth.uid() = user_id);


-- ── storage: visited-photos (PRIVATE) ───────────────────────────────────────
-- One private bucket, one folder per user (`<auth.uid()>/...`). The browser
-- uploads directly with the user's session; the server hands out short-lived
-- signed URLs for display. Never public: these are personal photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visited-photos',
  'visited-photos',
  false,
  5242880, -- 5 MB; the client downsizes to ~1600px JPEG before upload
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "visited-photos select own" on storage.objects;
create policy "visited-photos select own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'visited-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "visited-photos insert own" on storage.objects;
create policy "visited-photos insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'visited-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "visited-photos update own" on storage.objects;
create policy "visited-photos update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'visited-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "visited-photos delete own" on storage.objects;
create policy "visited-photos delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'visited-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
