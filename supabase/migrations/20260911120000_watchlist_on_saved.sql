-- Watchlist = saved destinations.
--
-- Saving a place (the heart on results cards, trip pages and the dashboard)
-- is the same wish as "tell me when it gets cheap", so the two are merged:
-- every saved destination is on the user's watchlist and gets deal alerts
-- unless they mute it. This replaces the short-lived deal_watches table from
-- 20260910120000 (never held real data).
--
-- The deal matcher reads: saved_destinations where deal_alerts, joined to
-- travel_windows for the dates. Destination name/country live in the
-- `destination` jsonb (->>'name', ->>'country', ->>'countryCode').

alter table public.saved_destinations
  add column if not exists deal_alerts boolean not null default true;

comment on column public.saved_destinations.deal_alerts is
  'Email the owner when a good price appears for this place during one of their travel_windows. Default on; the dashboard lets them mute per place.';

-- Matcher scan: "everyone with alerts on", then filter by place in jsonb.
create index if not exists idx_saved_destinations_alerts
  on public.saved_destinations (user_id)
  where deal_alerts;

-- The mute toggle is the first UPDATE the app makes on this table; the
-- baseline only had select/insert/delete policies.
drop policy if exists "Users manage own saved destinations - update" on public.saved_destinations;
create policy "Users manage own saved destinations - update"
  on public.saved_destinations for update to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Retire the separate watch table. CASCADE drops its policies and indexes.
drop table if exists public.deal_watches cascade;
