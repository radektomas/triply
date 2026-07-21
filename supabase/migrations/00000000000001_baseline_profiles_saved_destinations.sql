-- BASELINE: public.profiles and public.saved_destinations
--
-- Both tables were created by hand in the Supabase dashboard, so every later
-- migration in this repo ALTERs a table with no CREATE in version control — a
-- fresh database built from migrations alone would fail on the first ALTER.
-- This file supplies the missing starting point.
--
-- Numbered 00000000000001 so it sorts before every existing migration
-- (20260516120000_quick_picks.sql onwards). Everything is IF NOT EXISTS, so
-- applying it to the live database is a no-op.
--
-- ── PROVENANCE ──────────────────────────────────────────────────────────────
-- Columns, types, defaults, NOT NULL and primary keys below were introspected
-- from the live database via the PostgREST OpenAPI schema (GET /rest/v1/) on
-- 2026-07-21 and reflect production exactly.
--
-- The column set here is the table as it existed BEFORE this repo's ALTER
-- migrations ran; the later migrations add the rest. That layering is
-- corroborated by production's physical column order, which matches
-- baseline → 20260622120000 → 20260703120000 → 20260721120000 exactly.
--
-- ── NOT REPRODUCED HERE (could not be introspected) ─────────────────────────
-- The OpenAPI schema does not expose foreign keys into non-exposed schemas
-- (e.g. auth.users), indexes, triggers, CHECK constraints, or RLS policies.
-- Those are listed as commented-out blocks at the foot of this file rather
-- than guessed at, because a baseline that invents constraints is worse than
-- one that admits the gap. Run scripts/introspect-schema.sql against the live
-- database and uncomment/correct the blocks to finish the job.

-- ── public.profiles ─────────────────────────────────────────────────────────
-- One row per account, keyed by auth.users.id. Written on first sign-in by
-- app/auth/callback/route.ts and components/auth/AuthModal.tsx.
create table if not exists public.profiles (
  id                     uuid        not null,
  display_name           text,
  avatar_url             text,
  created_at             timestamptz not null default now(),
  email                  text,
  -- LEGACY / DRIFT: present in production, referenced by no migration and no
  -- application code. Superseded by welcome_sent_at (added in
  -- 20260703120000_email_followups.sql). Reproduced so the baseline is
  -- faithful; safe to drop once confirmed unused — see the report.
  welcome_email_sent_at  timestamptz,
  constraint profiles_pkey primary key (id)
);

-- ── public.saved_destinations ───────────────────────────────────────────────
-- A destination a user saved from a results grid or trip page, stored as the
-- full destination jsonb plus a __context deep-link back to the trip.
create table if not exists public.saved_destinations (
  id                uuid        not null default gen_random_uuid(),
  user_id           uuid        not null,
  destination       jsonb       not null,
  created_at        timestamptz not null default now(),
  -- LEGACY / DRIFT: present in production, referenced by no migration and no
  -- application code. Predates the followup_1/followup_2 stamps added in
  -- 20260703120000_email_followups.sql (cf. the unused src/emails/savedReminder.js).
  reminder_sent_at  timestamptz,
  constraint saved_destinations_pkey primary key (id)
);


-- ─────────────────────────────────────────────────────────────────────────────
-- PENDING VERIFICATION — do not uncomment until confirmed against production
-- with scripts/introspect-schema.sql. These are the Supabase conventions and
-- what the application code implies, NOT observed facts.
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Foreign keys (inferred from code: both columns hold auth.users.id):
--
--   alter table public.profiles
--     add constraint profiles_id_fkey
--     foreign key (id) references auth.users (id) on delete cascade;
--
--   alter table public.saved_destinations
--     add constraint saved_destinations_user_id_fkey
--     foreign key (user_id) references auth.users (id) on delete cascade;
--
-- Index (implied by every read path filtering on user_id):
--
--   create index if not exists idx_saved_destinations_user_id
--     on public.saved_destinations (user_id);
--
-- Row Level Security. Behavioural evidence from an anon-key probe on
-- 2026-07-21: both tables returned HTTP 200 with zero rows while the
-- service-role client saw 22 and 16 rows respectively, which means RLS is
-- enabled and no policy grants the anon role SELECT. The exact policy set —
-- including whether an `authenticated` policy scopes rows to auth.uid() — is
-- NOT established. 20260622130000_profiles_update_policy.sql adds an UPDATE
-- policy on profiles and explicitly declines to enable RLS, implying RLS was
-- already on.
--
--   alter table public.profiles enable row level security;
--   alter table public.saved_destinations enable row level security;
--   -- ...plus the SELECT/INSERT/DELETE policies as they exist in production.
