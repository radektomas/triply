-- Deal watches: "email me when a good price shows up for this place".
--
-- Written from the profile dashboard when a user taps "Watch prices" on one
-- of their picks. This is the demand side of the deal tracker: the future
-- matcher joins an incoming deal (destination + travel dates) against
--   deal_watches      → who cares about this place
--   travel_windows    → and is free on those dates
-- and emails the overlap. Nothing consumes it for that yet.
--
-- Cleared by app/profile/actions.ts deleteAccount (service role).

create table if not exists public.deal_watches (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  name              text        not null,
  country           text        not null default '',
  country_code      text        not null default '',
  -- Where the pick came from, so the dashboard can deep-link back to the
  -- generated trip. Both nullable: a watch may outlive the 30-day trip cache.
  destination_id    text,
  trip_id           uuid,
  notify_email      boolean     not null default true,
  created_at        timestamptz not null default now(),
  last_notified_at  timestamptz,
  constraint deal_watches_name_len check (char_length(name) between 1 and 80),
  constraint deal_watches_country_len check (char_length(country) <= 80)
);

-- One watch per place per user, case-insensitive.
create unique index if not exists uq_deal_watches_user_place
  on public.deal_watches (user_id, lower(name), lower(country));

-- Matcher lookups: "everyone watching <country>" / "<city>".
create index if not exists idx_deal_watches_country_code
  on public.deal_watches (country_code)
  where notify_email;
create index if not exists idx_deal_watches_name
  on public.deal_watches (lower(name))
  where notify_email;

alter table public.deal_watches enable row level security;

drop policy if exists "deal_watches select own" on public.deal_watches;
create policy "deal_watches select own"
  on public.deal_watches for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "deal_watches insert own" on public.deal_watches;
create policy "deal_watches insert own"
  on public.deal_watches for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "deal_watches update own" on public.deal_watches;
create policy "deal_watches update own"
  on public.deal_watches for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "deal_watches delete own" on public.deal_watches;
create policy "deal_watches delete own"
  on public.deal_watches for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.deal_watches is
  'Places a user wants price alerts for. Demand side of the deal tracker; matched against travel_windows.';
