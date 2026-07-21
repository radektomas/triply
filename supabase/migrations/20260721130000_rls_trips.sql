-- Lock down public.trips.
--
-- Audited 2026-07-21: the anon key — which ships in every browser bundle —
-- could read all 642 rows of this table, and a signed-in user could too. Each
-- row holds a full trip generation: the submitted form input (budget, origin
-- city, dates, traveller count, vibe, free-text destination) and the complete
-- AI result. No user_id, so it is not directly identifying, but it is an
-- enumerable history of what every visitor has searched for.
--
-- Nothing in the browser needs it. Verified against the codebase: every read
-- and write of `trips` goes through the SERVICE-ROLE client
-- (app/api/trips/route.ts, lib/data/getTripById.ts, both importing
-- @/lib/supabase), which bypasses RLS entirely. The results and trip-detail
-- pages are server-rendered and hand the data down as props.
--
-- So: RLS on, and deliberately NO policies. anon and authenticated get zero
-- rows; the server keeps full access. Same pattern as waitlist_emails
-- (20260622140000) and the content tables (20260709120000).
--
-- Retention for this table is enforced separately by /api/cron/retention,
-- keyed on the expires_at column (default now() + 30 days).

alter table public.trips enable row level security;

-- Belt and braces: if a permissive policy was ever added by hand in the
-- dashboard, drop it, otherwise enabling RLS above achieves nothing. Named
-- variants only — Postgres has no "drop all policies" and we must not guess at
-- names we haven't seen. Run scripts/introspect-schema.sql (section 6) and add
-- any others found.
drop policy if exists "anon read trips" on public.trips;
drop policy if exists "public read trips" on public.trips;
drop policy if exists "Enable read access for all users" on public.trips;
