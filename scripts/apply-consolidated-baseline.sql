-- ═══════════════════════════════════════════════════════════════════════════
-- TRIPLY — CONSOLIDATED BASELINE
-- Paste this whole file into the Supabase SQL editor and run it once.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHY THIS EXISTS
-- The drift audit (docs/schema-drift-audit.md) found that the repo's migration
-- files were probably never executed: every table exists, but two policy
-- migrations had no effect and a seed migration's fixed-UUID rows are absent.
-- Applying the migration directory file-by-file now would be unsafe —
-- 20260709120000 uses bare `create table` and would ERROR on tables that
-- already exist, and its seed would inject mock rows into a dashboard holding
-- 95 real ones.
--
-- So instead of replaying history, this brings production to the INTENDED END
-- STATE in one pass.
--
-- SAFE UNDER EITHER HISTORY. Every statement is idempotent — IF NOT EXISTS,
-- DROP ... IF EXISTS, CREATE OR REPLACE, or an existence guard. If some
-- migrations did run, the corresponding statements are no-ops. Nothing here
-- drops a table, drops a column, or deletes a row.
--
-- Runs in a single transaction: the SQL editor wraps the script, so any error
-- rolls the whole thing back and you can re-run after fixing it.
--
-- ┌───────────────────────────────────────────────────────────────────────┐
-- │ DEPLOY THE APPLICATION CODE FIRST, THEN RUN THIS.                     │
-- │                                                                       │
-- │ Section 8 drops the browser's write path to analytics_events and      │
-- │ section 9 drops the email webhook trigger. Both are replaced by code  │
-- │ in this release. Run this against the OLD deployment and you silently │
-- │ lose analytics events and welcome emails until the code ships.        │
-- └───────────────────────────────────────────────────────────────────────┘
--
-- BEHAVIOUR CHANGES FOR THE 22 EXISTING USERS — see section 4 and the summary
-- at the end of this file. The short version: marketing followups stop for
-- everyone until they opt in. Nothing else user-visible changes.


-- ───────────────────────────────────────────────────────────────────────────
-- 1. Core tables (created by hand originally; recorded here for a fresh DB)
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                     uuid        not null,
  display_name           text,
  avatar_url             text,
  created_at             timestamptz not null default now(),
  email                  text,
  welcome_email_sent_at  timestamptz,
  constraint profiles_pkey primary key (id)
);

create table if not exists public.saved_destinations (
  id                uuid        not null default gen_random_uuid(),
  user_id           uuid        not null,
  destination       jsonb       not null,
  created_at        timestamptz not null default now(),
  reminder_sent_at  timestamptz,
  constraint saved_destinations_pkey primary key (id)
);


-- ───────────────────────────────────────────────────────────────────────────
-- 2. Additive columns — all verified already present in production
-- ───────────────────────────────────────────────────────────────────────────

-- Daily generation limits (was 20260622120000)
alter table public.profiles
  add column if not exists generations_today integer not null default 0,
  add column if not exists generations_reset_date date;

-- Email send-tracking (was 20260703120000)
alter table public.profiles
  add column if not exists welcome_sent_at timestamptz;
alter table public.saved_destinations
  add column if not exists followup_1_sent_at timestamptz,
  add column if not exists followup_2_sent_at timestamptz;


-- ───────────────────────────────────────────────────────────────────────────
-- 3. Indexes and constraints
-- The drift audit could NOT verify these through the REST API, so they are
-- (re)asserted here. Creating one that already exists is a no-op.
--
-- waitlist_emails unique(email) is load-bearing: app/api/waitlist/route.ts
-- relies on `on conflict (email) do nothing`. Without it, duplicate leads
-- accumulate silently and the upsert errors.
-- ───────────────────────────────────────────────────────────────────────────

create index if not exists idx_saved_destinations_followup1_pending
  on public.saved_destinations (created_at)
  where followup_1_sent_at is null;

create index if not exists idx_saved_destinations_followup2_pending
  on public.saved_destinations (created_at)
  where followup_2_sent_at is null;

create index if not exists analytics_events_event_name_idx on public.analytics_events (event_name);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at);
create index if not exists analytics_events_session_id_idx on public.analytics_events (session_id);

create index if not exists quick_picks_display_order_idx on public.quick_picks (display_order);

do $$
begin
  if to_regclass('public.waitlist_emails') is null then
    raise notice 'skip waitlist_emails unique(email) — table absent';
  elsif exists (
    select 1 from pg_constraint
    where conrelid = 'public.waitlist_emails'::regclass and contype = 'u'
  ) then
    raise notice 'waitlist_emails already has a unique constraint — leaving as is';
  else
    -- Only reachable if the constraint is genuinely missing. Will fail loudly
    -- if duplicate emails already exist, which is exactly what you want to know.
    alter table public.waitlist_emails
      add constraint waitlist_emails_email_key unique (email);
    raise notice 'ADDED waitlist_emails unique(email) — it was missing';
  end if;
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 4. Marketing consent  ⚠️  BEHAVIOUR CHANGE FOR EXISTING USERS
--
-- marketing_opt_in defaults FALSE and is deliberately NOT backfilled. Consent
-- was never collected from the existing 22 users, so it cannot be assumed —
-- that is the whole point. Effect: followup_1 / followup_2 stop going to
-- everyone until they opt in via the signup checkbox.
--
-- The welcome email is UNAFFECTED: it is classified transactional
-- (emails/classification.ts) and is not gated on consent.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists unsubscribed_at timestamptz;

create index if not exists idx_profiles_marketing_mailable
  on public.profiles (id)
  where marketing_opt_in is true and unsubscribed_at is null;

comment on column public.profiles.marketing_opt_in is
  'Explicit opt-in for marketing-class email (followup_1, followup_2). Default false; never backfilled.';
comment on column public.profiles.unsubscribed_at is
  'When the user unsubscribed from marketing email. Non-null suppresses all marketing-class sends.';


-- ───────────────────────────────────────────────────────────────────────────
-- 5. RLS enablement. Enabling RLS grants nothing — a table with RLS and no
--    policies is closed to anon and authenticated, and unaffected for the
--    service role. Section 7 then adds the policies that production actually
--    has.
-- ───────────────────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','saved_destinations','generation_history','analytics_events',
    'trips','quick_picks','waitlist_emails','content_ideas','content_results',
    'series_ledger','feedback','waitlist','shared_trips','favorites'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    else
      raise notice 'skip RLS on % — table absent', t;
    end if;
  end loop;
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 6. Remove policy names that exist only in the repo's migration files.
--    No-ops against production (they were never created there); they matter
--    for any database that DID replay the old migrations.
-- ───────────────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.quick_picks') is not null then
    drop policy if exists "anon read quick_picks" on public.quick_picks;
  end if;
  if to_regclass('public.profiles') is not null then
    drop policy if exists "users update own profile" on public.profiles;
  end if;
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 7. Policies — production's live set, transcribed verbatim.
--    Drop-then-create because Postgres has no CREATE POLICY IF NOT EXISTS.
--    End state is identical to the current one.
-- ───────────────────────────────────────────────────────────────────────────

-- profiles. Granted `to public` rather than `to authenticated`; safe because
-- auth.uid() is NULL for anon, so `NULL = id` is never TRUE. Verified
-- externally: the anon key returns 0 rows.
do $$
begin
  if to_regclass('public.profiles') is null then return; end if;

  drop policy if exists "Users can view own profile" on public.profiles;
  create policy "Users can view own profile"
    on public.profiles for select to public using (auth.uid() = id);

  drop policy if exists "Users can insert own profile" on public.profiles;
  create policy "Users can insert own profile"
    on public.profiles for insert to public with check (auth.uid() = id);

  -- NOTE: production's version has no WITH CHECK. Transcribed as-is rather
  -- than "improved" — adding one is a deliberate hardening change, not part of
  -- a reconciliation pass. See docs/schema-drift-audit.md.
  drop policy if exists "Users can update own profile" on public.profiles;
  create policy "Users can update own profile"
    on public.profiles for update to public using (auth.uid() = id);
end $$;

-- saved_destinations
do $$
begin
  if to_regclass('public.saved_destinations') is null then return; end if;

  drop policy if exists "Users manage own saved destinations - select" on public.saved_destinations;
  create policy "Users manage own saved destinations - select"
    on public.saved_destinations for select to public using (auth.uid() = user_id);

  drop policy if exists "Users manage own saved destinations - insert" on public.saved_destinations;
  create policy "Users manage own saved destinations - insert"
    on public.saved_destinations for insert to public with check (auth.uid() = user_id);

  drop policy if exists "Users manage own saved destinations - delete" on public.saved_destinations;
  create policy "Users manage own saved destinations - delete"
    on public.saved_destinations for delete to public using (auth.uid() = user_id);
end $$;

-- generation_history
do $$
begin
  if to_regclass('public.generation_history') is null then return; end if;

  drop policy if exists "Users manage own generation history - select" on public.generation_history;
  create policy "Users manage own generation history - select"
    on public.generation_history for select to public using (auth.uid() = user_id);

  drop policy if exists "Users manage own generation history - insert" on public.generation_history;
  create policy "Users manage own generation history - insert"
    on public.generation_history for insert to public with check (auth.uid() = user_id);

  drop policy if exists "Users manage own generation history - delete" on public.generation_history;
  create policy "Users manage own generation history - delete"
    on public.generation_history for delete to public using (auth.uid() = user_id);
end $$;

-- quick_picks — the LIVE policy, not the repo's differently-named one.
do $$
begin
  if to_regclass('public.quick_picks') is null then return; end if;

  drop policy if exists "Quick picks are viewable by everyone" on public.quick_picks;
  create policy "Quick picks are viewable by everyone"
    on public.quick_picks for select to public using (true);
end $$;

-- favorites — user_id is TEXT here, not uuid, hence the cast. Preserved as-is;
-- correcting the column type is a separate change (docs/schema-drift-audit.md).
do $$
begin
  if to_regclass('public.favorites') is null then return; end if;

  drop policy if exists "Users can read own favorites" on public.favorites;
  create policy "Users can read own favorites"
    on public.favorites for select to authenticated using ((auth.uid())::text = user_id);

  drop policy if exists "Users can insert own favorites" on public.favorites;
  create policy "Users can insert own favorites"
    on public.favorites for insert to authenticated with check ((auth.uid())::text = user_id);

  drop policy if exists "Users can delete own favorites" on public.favorites;
  create policy "Users can delete own favorites"
    on public.favorites for delete to authenticated using ((auth.uid())::text = user_id);
end $$;

-- shared_trips — `using (true)` permits full ENUMERATION, not just lookup by
-- an unguessable id. Currently harmless (0 rows, feature has no code
-- references). Kept only so this script does not silently change behaviour;
-- the recommendation is to drop the table. See docs/schema-drift-audit.md.
do $$
begin
  if to_regclass('public.shared_trips') is null then return; end if;

  drop policy if exists "Public can read shared trips" on public.shared_trips;
  create policy "Public can read shared trips"
    on public.shared_trips for select to public using (true);
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 8. Close the open write vectors.  ⚠️  DEPLOY CODE FIRST
--
-- analytics_events: replaced by POST /api/analytics/event (allow-listed event
--   names, validated properties, user_id from the auth cookie, per-session
--   rate limit, service-role insert). Running this before the code ships
--   means events are silently dropped — tracking is fire-and-forget.
--
-- feedback: ⚠️ NOT confirmed unused. Nothing in Triply writes this table, but
--   it has columns Triply never sends (nps, user_agent, trip_context) and
--   received two EMPTY rows on 2026-07-21. Something else writes it — almost
--   certainly the n8n feedback workflow. CHECK WHICH CREDENTIAL n8n USES
--   BEFORE RUNNING THIS. Service-role → no impact. Anon → feedback capture
--   breaks, and the fix is to move n8n to the service role, not to restore a
--   world-writable policy.
--
-- waitlist: legacy (bigint id, 0 rows). Superseded by waitlist_emails. Safe.
-- ───────────────────────────────────────────────────────────────────────────

do $$
begin
  if to_regclass('public.analytics_events') is not null then
    drop policy if exists "analytics_events_insert_public" on public.analytics_events;
  end if;
  if to_regclass('public.feedback') is not null then
    drop policy if exists "Anyone can insert feedback" on public.feedback;
  end if;
  if to_regclass('public.waitlist') is not null then
    drop policy if exists "Public can join waitlist" on public.waitlist;
  end if;
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 9. Functions and triggers
-- ───────────────────────────────────────────────────────────────────────────

-- Creates the profiles row on signup. Transcribed verbatim from production.
-- ON CONFLICT updates only `email`, so display_name, avatar_url and — crucially
-- — marketing_opt_in / unsubscribed_at are never clobbered by a re-run.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, display_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$function$;

-- Matched by the function it calls, not by name: the live trigger's name was
-- never captured, and guessing wrong would create a SECOND trigger.
do $$
begin
  if to_regclass('auth.users') is null then
    raise notice 'skip handle_new_user trigger — auth.users absent';
  elsif exists (
    select 1 from pg_trigger t join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and p.proname = 'handle_new_user' and not t.tgisinternal
  ) then
    raise notice 'handle_new_user trigger already present — leaving as is';
  else
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- Defensive: auto-enables RLS on every newly created table in `public`, so a
-- new table defaults to closed rather than readable by anyone holding the
-- public anon key. It grants nothing and does not retrofit existing tables —
-- a floor, not a guarantee.
create or replace function public.rls_auto_enable()
 returns event_trigger
 language plpgsql
 security definer
 set search_path to 'pg_catalog'
as $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public')
        AND cmd.schema_name NOT IN ('pg_catalog','information_schema')
        AND cmd.schema_name NOT LIKE 'pg_toast%'
        AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip %', cmd.object_identity;
     END IF;
  END LOOP;
END;
$function$;

do $$
begin
  if exists (select 1 from pg_event_trigger where evtfoid = 'public.rls_auto_enable'::regproc) then
    raise notice 'rls_auto_enable event trigger already present — leaving as is';
  else
    create event trigger rls_auto_enable_on_create_table
      on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
end $$;

-- Remove the email webhook trigger. Its definition embedded the shared secret
-- in plaintext, so the value lived in the catalog and in every backup.
-- Replaced by in-process sends (lib/email/lifecycle.ts).
--
-- MANUAL STEP AFTERWARDS: delete both Database Webhook entries in the Supabase
-- dashboard (Database → Webhooks). Dropping the trigger stops the calls, but
-- re-saving a webhook recreates it. Then rotate TRIPLY_EMAIL_SECRET.
drop trigger if exists "profiles-welcome-email" on public.profiles;
drop trigger if exists "saved-destination-email" on public.saved_destinations;
drop trigger if exists "saved_destinations-email" on public.saved_destinations;


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. VERIFICATION — read the four result sets below.
-- ═══════════════════════════════════════════════════════════════════════════

-- (a) Every column this script adds or asserts.
select 'column' as object_kind, table_name, column_name, data_type,
       column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in (
      'marketing_opt_in','unsubscribed_at','generations_today',
      'generations_reset_date','welcome_sent_at'))
    or (table_name = 'saved_destinations' and column_name in (
      'followup_1_sent_at','followup_2_sent_at'))
  )
order by table_name, column_name;
-- EXPECT 7 rows. Critically:
--   profiles.marketing_opt_in   boolean  default false  NOT NULL
--   profiles.unsubscribed_at    timestamptz             nullable

-- (a2) Every index this script creates.
select 'index' as object_kind, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_saved_destinations_followup1_pending',
    'idx_saved_destinations_followup2_pending',
    'analytics_events_event_name_idx',
    'analytics_events_created_at_idx',
    'analytics_events_session_id_idx',
    'quick_picks_display_order_idx',
    'idx_profiles_marketing_mailable')
order by indexname;
-- EXPECT 7 rows. A missing one means its table was absent.

-- (a3) The waitlist_emails unique constraint the upsert depends on.
select 'constraint' as object_kind, conname,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.waitlist_emails'::regclass and contype = 'u';
-- EXPECT at least 1 row containing UNIQUE (email).

-- (b) RLS on, and the open-insert policies gone.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('trips','analytics_events','feedback','waitlist',
                    'profiles','saved_destinations','generation_history',
                    'quick_picks','waitlist_emails')
order by c.relname;
-- EXPECT rls_enabled = true for all.
-- EXPECT policy_count = 0 for trips, analytics_events, feedback, waitlist,
--                           waitlist_emails
--        policy_count = 3 for profiles, saved_destinations, generation_history
--        policy_count = 1 for quick_picks

-- (b2) The resulting policy set in full, verbatim. This is the authoritative
-- "what did I end up with" answer — compare it against
-- supabase/migrations/20260722130000_policies_and_triggers_baseline.sql.
select tablename, policyname, roles, cmd,
       qual as using_expression, with_check as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- EXPECT: NO row where tablename is trips, analytics_events, feedback or
-- waitlist. Any such row means an open policy survived.

-- (b3) Explicit assertion for the three tables that must be fully closed.
select t.name as table_name,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = t.name) as policy_count,
       case
         when c.relrowsecurity
          and (select count(*) from pg_policies p
                where p.schemaname = 'public' and p.tablename = t.name) = 0
         then 'CLOSED — correct'
         else '*** STILL OPEN — INVESTIGATE ***'
       end as verdict
from (values ('trips'),('analytics_events'),('feedback'),('waitlist')) as t(name)
join pg_class c on c.relname = t.name
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public';
-- EXPECT all four to read 'CLOSED — correct'.

-- (c) No webhook trigger may survive with a secret in its definition.
select tgrelid::regclass::text as table_name, tgname
from pg_trigger
where not tgisinternal and pg_get_triggerdef(oid) ilike '%http_request%';
-- EXPECT 0 rows. Any row is a surviving webhook — drop it by its real name.

-- (d) Both defensive triggers present.
select 'handle_new_user' as object,
       count(*) filter (where true) as present
from pg_trigger t join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'auth.users'::regclass and p.proname = 'handle_new_user'
  and not t.tgisinternal
union all
select 'rls_auto_enable event trigger', count(*)
from pg_event_trigger where evtfoid = 'public.rls_auto_enable'::regproc;
-- EXPECT present = 1 for both.

-- ═══════════════════════════════════════════════════════════════════════════
-- AFTER RUNNING — verify from OUTSIDE the database. The SQL editor runs as
-- `postgres` and bypasses RLS, so it CANNOT confirm any of the above is
-- actually enforced. This is the mistake that made an earlier "fix" look
-- successful while 1,402 records stayed public.
--
--   curl -s -D- -o /dev/null "$SUPABASE_URL/rest/v1/trips?select=id&limit=1" \
--     -H "apikey: $ANON_KEY"            # expect Content-Range: */0
--
--   curl -s -o /dev/null -w "%{http_code}\n" -X POST \
--     "$SUPABASE_URL/rest/v1/analytics_events" -H "apikey: $ANON_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"event_name":"x","session_id":"y"}'   # expect 401/403, not 201
-- ═══════════════════════════════════════════════════════════════════════════
