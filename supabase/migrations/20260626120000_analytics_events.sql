-- Product analytics event log powering the activation funnel
-- (landing_view → trip_form_started → trip_generated → account_created →
-- email_captured) and the internal /admin/funnel dashboard.
--
-- WRITES: the public client (anon or authenticated) inserts rows directly from
-- the browser via lib/analytics.ts — analytics needs anonymous, pre-signup
-- logging, so RLS has an INSERT policy open to both roles. Identity backfill
-- and all reads run through the SERVICE-ROLE client (lib/supabase.ts), which
-- bypasses RLS. There is intentionally NO select/update/delete policy for the
-- public roles: clients can append events but can never read or mutate the log
-- (the funnel dashboard reads server-side with the service role only).
create table if not exists public.analytics_events (
  id          uuid primary key default gen_random_uuid(),
  event_name  text not null,
  session_id  text not null,
  -- Nullable: anonymous pre-signup events have no user. On account_created we
  -- backfill this column for the session's prior rows (see lib/analytics.ts →
  -- /api/analytics/identify). ON DELETE SET NULL keeps the event history even
  -- if the auth user is later removed.
  user_id     uuid references auth.users(id) on delete set null,
  properties  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- Funnel queries filter by event_name + created_at window; identity backfill
-- and per-session lookups filter by session_id.
create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_created_at_idx  on public.analytics_events (created_at);
create index if not exists analytics_events_session_id_idx  on public.analytics_events (session_id);

alter table public.analytics_events enable row level security;

-- Anonymous + authenticated clients may APPEND events (client-side logging).
-- No USING clause / no other policies → they can never read, update, or delete.
drop policy if exists "analytics_events_insert_public" on public.analytics_events;
create policy "analytics_events_insert_public"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (true);
