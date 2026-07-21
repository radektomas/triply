-- Remove the database webhook that drove the lifecycle emails.
--
-- The trigger was:
--
--   CREATE TRIGGER "profiles-welcome-email" AFTER INSERT ON public.profiles
--   FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
--     'https://flytriply.eu/api/hooks/supabase', 'POST',
--     '{"Content-type":"application/json","x-triply-secret":"<secret>"}',
--     '{}', '5000');
--
-- Two problems, one of them serious:
--
--   1. The shared secret sat in plaintext in the trigger definition, which
--      lives in the system catalog — so it was carried in every pg_dump, every
--      backup, and was readable by anyone with SQL or dashboard access. A
--      credential at rest, in the clear, with no rotation story.
--   2. It made "send an email when someone signs up" span a database trigger,
--      a dashboard webhook config, a public HTTP route and a shared secret,
--      when the application already knows a signup happened.
--
-- Replaced by in-process sends (lib/email/lifecycle.ts), called from
-- /auth/callback (OAuth + confirmed-email signups), POST /api/auth/welcome
-- (email signup that returns a session immediately) and the saveDestination
-- Server Action. Idempotency still rests on profiles.welcome_sent_at, so the
-- switch cannot produce duplicates.
--
-- ── DEPLOYMENT ORDER — read before applying ─────────────────────────────────
-- Ship the application code FIRST, then apply this migration. In that order
-- the worst case is a brief window where both the trigger and the in-process
-- send are live, and welcome_sent_at ensures only one email goes out. Applying
-- this first would instead drop the trigger while the old code is still
-- deployed, and any signup in between would get no welcome email at all.
--
-- ── MANUAL STEP, NOT DONE BY THIS MIGRATION ─────────────────────────────────
-- Dropping the trigger stops the outbound calls, but the Database Webhook
-- entries still exist in the Supabase dashboard (Database → Webhooks). Delete
-- both — the profiles one and the saved_destinations one — or they will
-- reappear as triggers if anyone re-saves them. Then rotate
-- TRIPLY_EMAIL_SECRET, since the old value was exposed in the definition above.

drop trigger if exists "profiles-welcome-email" on public.profiles;

-- The saved_destinations webhook was configured in the dashboard; its trigger
-- name was not captured in the introspection output. Drop the conventional
-- candidates, then verify nothing remains with the query below.
drop trigger if exists "saved-destination-email" on public.saved_destinations;
drop trigger if exists "saved_destinations-email" on public.saved_destinations;

-- VERIFY after applying — expect zero rows:
--
--   select tgrelid::regclass as table_name, tgname,
--          pg_get_triggerdef(oid) as definition
--   from pg_trigger
--   where not tgisinternal
--     and pg_get_triggerdef(oid) ilike '%http_request%';
--
-- Any row returned is a surviving webhook trigger — check whether it still
-- embeds a secret, and drop it by its real name.
