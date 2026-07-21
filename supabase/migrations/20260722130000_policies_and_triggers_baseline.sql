-- BASELINE: RLS policies, handle_new_user, and the rls_auto_enable event
-- trigger, as they exist in production.
--
-- Introspected from pg_policies / pg_get_functiondef on 2026-07-22 and
-- transcribed verbatim — expressions, role grants and policy names are copied
-- exactly, not rewritten to taste. Where the live definition differs from what
-- would be written from first principles, the difference is preserved and
-- called out in a comment rather than silently "fixed"; correcting them is a
-- separate, deliberate change.
--
-- IDEMPOTENCE: Postgres has no CREATE POLICY IF NOT EXISTS, so each policy is
-- dropped-then-created (the pattern already used by
-- 20260622130000_profiles_update_policy.sql). The end state is identical to the
-- current one, so applying this against production is a no-op in effect, though
-- each policy is momentarily recreated inside the transaction.
--
-- Tables with no CREATE TABLE anywhere in this repo (favorites, feedback,
-- waitlist, shared_trips) are wrapped in existence guards, so a database built
-- from migrations alone skips them instead of failing.
--
-- Scope: Triply-owned tables only. Policies belonging to Loro, the shop,
-- Darkomat and the cold-call tool are deliberately NOT versioned here — see
-- docs/shared-db-policies-reference.md.


-- ── public.profiles ─────────────────────────────────────────────────────────
-- Granted `to public` rather than `to authenticated`. That is broader than it
-- looks safe, but the qual carries it: for an anonymous request auth.uid() is
-- NULL, `NULL = id` evaluates to NULL, and NULL is not TRUE, so no rows match.
-- Verified externally on 2026-07-21 — the anon key returns 0 rows.
-- NOTE: there is no DELETE policy. Account deletion (app/profile/actions.ts)
-- runs on the service-role client, which bypasses RLS, so this is consistent.
do $$
begin
  if to_regclass('public.profiles') is null then
    raise notice 'skip profiles — table absent';
    return;
  end if;

  drop policy if exists "Users can view own profile" on public.profiles;
  create policy "Users can view own profile"
    on public.profiles for select to public
    using (auth.uid() = id);

  drop policy if exists "Users can insert own profile" on public.profiles;
  create policy "Users can insert own profile"
    on public.profiles for insert to public
    with check (auth.uid() = id);

  -- NOTE: production has exactly ONE update policy on profiles — this one.
  -- The policy created by 20260622130000_profiles_update_policy.sql
  -- ("users update own profile", lower-case, `to authenticated`) does NOT
  -- exist in production: that migration was never applied. See the drift
  -- audit. Its absence is harmless only because this policy covers the same
  -- ground.
  --
  -- Dropping the repo-only name as well, so a database built from migrations
  -- converges on production's SINGLE update policy instead of ending up with
  -- two. On production this line is a no-op (the policy is not there).
  drop policy if exists "users update own profile" on public.profiles;

  drop policy if exists "Users can update own profile" on public.profiles;
  create policy "Users can update own profile"
    on public.profiles for update to public
    using (auth.uid() = id);
end $$;


-- ── public.saved_destinations ───────────────────────────────────────────────
do $$
begin
  if to_regclass('public.saved_destinations') is null then
    raise notice 'skip saved_destinations — table absent';
    return;
  end if;

  drop policy if exists "Users manage own saved destinations - select" on public.saved_destinations;
  create policy "Users manage own saved destinations - select"
    on public.saved_destinations for select to public
    using (auth.uid() = user_id);

  drop policy if exists "Users manage own saved destinations - insert" on public.saved_destinations;
  create policy "Users manage own saved destinations - insert"
    on public.saved_destinations for insert to public
    with check (auth.uid() = user_id);

  drop policy if exists "Users manage own saved destinations - delete" on public.saved_destinations;
  create policy "Users manage own saved destinations - delete"
    on public.saved_destinations for delete to public
    using (auth.uid() = user_id);
end $$;


-- ── public.generation_history ───────────────────────────────────────────────
-- No UPDATE policy: history rows are append-only from the app's perspective.
do $$
begin
  if to_regclass('public.generation_history') is null then
    raise notice 'skip generation_history — table absent';
    return;
  end if;

  drop policy if exists "Users manage own generation history - select" on public.generation_history;
  create policy "Users manage own generation history - select"
    on public.generation_history for select to public
    using (auth.uid() = user_id);

  drop policy if exists "Users manage own generation history - insert" on public.generation_history;
  create policy "Users manage own generation history - insert"
    on public.generation_history for insert to public
    with check (auth.uid() = user_id);

  drop policy if exists "Users manage own generation history - delete" on public.generation_history;
  create policy "Users manage own generation history - delete"
    on public.generation_history for delete to public
    using (auth.uid() = user_id);
end $$;


-- ── public.analytics_events ─────────────────────────────────────────────────
-- RECORDED FOR COMPLETENESS, DELIBERATELY NOT RECREATED.
--
-- Production carries:
--   analytics_events_insert_public | {anon,authenticated} | INSERT | with check (true)
--
-- That is an open, unvalidated write endpoint on a public table: anyone with
-- the anon key could insert unlimited rows with any event_name, any properties
-- and an arbitrary user_id. It is dropped by
-- 20260722120000_analytics_events_lock_insert.sql, which runs BEFORE this
-- migration, and replaced by POST /api/analytics/event (allow-listed event
-- names, validated properties, user_id read from the auth cookie, per-session
-- rate limit, service-role insert).
--
-- Recreating it here would silently undo that fix, so this block asserts the
-- intended end state instead: RLS on, no policies.
do $$
begin
  if to_regclass('public.analytics_events') is null then
    raise notice 'skip analytics_events — table absent';
    return;
  end if;
  drop policy if exists "analytics_events_insert_public" on public.analytics_events;
  alter table public.analytics_events enable row level security;
end $$;


-- ── public.quick_picks ──────────────────────────────────────────────────────
-- DRIFT: 20260516120000_quick_picks.sql creates a policy named
-- "anon read quick_picks" scoped `to anon`. Production has no such policy — it
-- has "Quick picks are viewable by everyone" scoped `to public`. Either that
-- migration never reached production or the policy was replaced by hand.
-- Transcribing the LIVE policy here, and dropping the repo-only name so the
-- two converge instead of a fresh database ending up with both.
do $$
begin
  if to_regclass('public.quick_picks') is null then
    raise notice 'skip quick_picks — table absent';
    return;
  end if;

  drop policy if exists "anon read quick_picks" on public.quick_picks;

  drop policy if exists "Quick picks are viewable by everyone" on public.quick_picks;
  create policy "Quick picks are viewable by everyone"
    on public.quick_picks for select to public
    using (true);
end $$;


-- ── public.shared_trips ─────────────────────────────────────────────────────
-- Publicly readable with `using (true)`, which permits full ENUMERATION of the
-- table, not merely lookup by an unguessable id. Currently harmless only
-- because the table holds 0 rows and the feature has no code references.
-- See docs/supabase-separation-plan.md and the Task D recommendation.
do $$
begin
  if to_regclass('public.shared_trips') is null then
    raise notice 'skip shared_trips — table absent';
    return;
  end if;

  drop policy if exists "Public can read shared trips" on public.shared_trips;
  create policy "Public can read shared trips"
    on public.shared_trips for select to public
    using (true);
end $$;


-- ── public.waitlist ─────────────────────────────────────────────────────────
-- OPEN WRITE VECTOR, transcribed as-is. `with check (true)` lets anyone with
-- the anon key insert unlimited arbitrary rows. Same class of problem as
-- analytics_events_insert_public and orders_public_insert. This is the LEGACY
-- waitlist table (bigint id, 0 rows); the table Triply actually writes is
-- public.waitlist_emails, which is correctly service-role only. Flagged for
-- decision, not changed here.
do $$
begin
  if to_regclass('public.waitlist') is null then
    raise notice 'skip waitlist — table absent';
    return;
  end if;

  drop policy if exists "Public can join waitlist" on public.waitlist;
  create policy "Public can join waitlist"
    on public.waitlist for insert to public
    with check (true);
end $$;


-- ── public.feedback ─────────────────────────────────────────────────────────
-- OPEN WRITE VECTOR, transcribed as-is. Same `with check (true)` problem.
-- Triply's own /api/feedback posts to an n8n webhook and does NOT write this
-- table, so nothing in this repo depends on the policy. Flagged for decision.
do $$
begin
  if to_regclass('public.feedback') is null then
    raise notice 'skip feedback — table absent';
    return;
  end if;

  drop policy if exists "Anyone can insert feedback" on public.feedback;
  create policy "Anyone can insert feedback"
    on public.feedback for insert to anon, authenticated
    with check (true);
end $$;


-- ── public.favorites ────────────────────────────────────────────────────────
-- SCHEMA INCONSISTENCY, preserved deliberately. These policies cast
-- `(auth.uid())::text = user_id` because favorites.user_id is TEXT, whereas
-- saved_destinations, generation_history and analytics_events all use UUID.
-- Verified against the live column types. The cast is not stylistic — it is
-- required by the column type, and it is masking the inconsistency.
-- Consequences: no foreign key to auth.users is possible without a cast, the
-- column can hold values that are not UUIDs at all, and the comparison cannot
-- use a uuid index. Correcting it means migrating the column to uuid and
-- rewriting these three policies; see the report.
-- Note also: favorites has no code references in this repo and may belong to
-- another application — resolve ownership before altering it.
do $$
begin
  if to_regclass('public.favorites') is null then
    raise notice 'skip favorites — table absent';
    return;
  end if;

  drop policy if exists "Users can read own favorites" on public.favorites;
  create policy "Users can read own favorites"
    on public.favorites for select to authenticated
    using ((auth.uid())::text = user_id);

  drop policy if exists "Users can insert own favorites" on public.favorites;
  create policy "Users can insert own favorites"
    on public.favorites for insert to authenticated
    with check ((auth.uid())::text = user_id);

  drop policy if exists "Users can delete own favorites" on public.favorites;
  create policy "Users can delete own favorites"
    on public.favorites for delete to authenticated
    using ((auth.uid())::text = user_id);
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCTIONS AND TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- ── public.handle_new_user ──────────────────────────────────────────────────
-- Fires on auth.users INSERT and materialises the public.profiles row from the
-- OAuth/signup metadata. This is why a profiles row exists before any
-- application code runs — confirmed empirically during the cross-user RLS test,
-- where two accounts created through the Admin API arrived with profiles rows
-- already present.
--
-- SECURITY DEFINER with a pinned search_path, so it can write public.profiles
-- while running as the auth system. The ON CONFLICT clause updates only
-- `email`, so display_name and avatar_url set later by the app are never
-- clobbered by a re-run — and, importantly, neither are marketing_opt_in or
-- unsubscribed_at (20260721120000), so consent state survives.
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

-- The trigger itself lives on auth.users, so it did not appear in the
-- public-schema listing and its exact name is unknown. Rather than guess a
-- name and risk creating a SECOND trigger that inserts twice, this checks
-- whether any non-internal trigger on auth.users already calls the function and
-- only creates one if none does.
do $$
begin
  if to_regclass('auth.users') is null then
    raise notice 'skip handle_new_user trigger — auth.users not present';
    return;
  end if;

  if exists (
    select 1
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'auth.users'::regclass
      and p.proname = 'handle_new_user'
      and not t.tgisinternal
  ) then
    raise notice 'handle_new_user trigger already present on auth.users — leaving as is';
  else
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;


-- ── public.rls_auto_enable (event trigger) ──────────────────────────────────
-- A DEFENSIVE MEASURE, kept on purpose. Recorded here so it survives a rebuild
-- and so the next person understands why new tables mysteriously arrive with
-- RLS already on.
--
-- WHAT IT DOES: fires at ddl_command_end after any CREATE TABLE /
-- CREATE TABLE AS / SELECT INTO in the `public` schema and immediately runs
-- `alter table ... enable row level security` on the new table. Failures are
-- swallowed and logged rather than aborting the DDL, so a table that cannot
-- take RLS still gets created.
--
-- WHY IT MATTERS HERE: a table created without RLS in this project is readable
-- by anyone holding the public anon key, which ships in Triply's browser
-- bundle. That is not hypothetical — it is exactly how 1,402 cold-call lead
-- records and 62 gift recommendations became world-readable. This trigger
-- makes "new table" default to closed instead of open.
--
-- WHAT IT DOES NOT DO: enabling RLS grants nothing. A new table gets RLS with
-- zero policies, which means NO access for anon/authenticated until policies
-- are written deliberately. It also does not retrofit existing tables, and it
-- cannot undo a permissive policy added later — RLS being ON told us nothing
-- about safety on coldcall_leads, where a `to anon` policy cancelled it out.
-- Treat it as a floor, not a guarantee.
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
    SELECT *
    FROM pg_event_trigger_ddl_commands()
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
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip %', cmd.object_identity;
     END IF;
  END LOOP;
END;
$function$;

-- CREATE EVENT TRIGGER has no IF NOT EXISTS, and the live trigger's name was
-- not captured, so match on the function it calls instead of guessing a name.
--
-- NOTE: creating an event trigger requires superuser. On Supabase that means
-- running as `postgres` (the SQL editor does); a migration applied by a
-- lesser-privileged role will raise here. The guard means an already-present
-- trigger is skipped entirely, so this only bites on a fresh database.
do $$
begin
  if exists (
    select 1 from pg_event_trigger
    where evtfoid = 'public.rls_auto_enable'::regproc
  ) then
    raise notice 'rls_auto_enable event trigger already present — leaving as is';
  else
    create event trigger rls_auto_enable_on_create_table
      on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
end $$;
