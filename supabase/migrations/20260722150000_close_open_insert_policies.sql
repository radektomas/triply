-- Close the last two world-open INSERT policies.
--
--   feedback | "Anyone can insert feedback" | {anon,authenticated} | with check (true)
--   waitlist | "Public can join waitlist"   | {public}             | with check (true)
--
-- Both let anyone holding the public anon key — which ships in Triply's browser
-- bundle — insert unlimited arbitrary rows. Same class as
-- analytics_events_insert_public (closed in 20260722120000) and the shop's
-- orders_public_insert (not ours to fix).
--
-- ═══════════════════════════════════════════════════════════════════════════
-- READ BEFORE APPLYING: `feedback` is NOT confirmed unused.
-- ═══════════════════════════════════════════════════════════════════════════
-- Verified on 2026-07-22:
--   • No Triply code writes public.feedback. The feedback UI posts to
--     /api/feedback (components/FeedbackModal.tsx → WEBHOOK_URL = "/api/feedback"),
--     which forwards to the N8N_FEEDBACK_URL webhook. Nothing in this repo
--     references the table.
--   • The table nevertheless has columns Triply's route never sends —
--     `nps`, `user_agent`, `trip_context` — which means SOMETHING ELSE writes
--     it. Almost certainly the n8n feedback workflow.
--   • It holds 2 rows, created 2026-07-21 21:21 and 21:26 UTC, and BOTH ARE
--     COMPLETELY EMPTY: liked, missing, email, nps, user_agent all null. Real
--     feedback cannot look like this — the UI disables submit unless `liked` or
--     `missing` is non-empty.
--
-- So the table is receiving writes, the writer is not this codebase, and the
-- writes are empty. That is consistent either with a misconfigured n8n mapping
-- or with someone exercising the open policy directly.
--
-- THE ONE THING TO CHECK FIRST: which credential the n8n feedback workflow
-- uses. If it authenticates with the SERVICE-ROLE key it bypasses RLS and this
-- migration changes nothing for it. If it uses the ANON key, dropping the
-- policy will break feedback capture.
--
-- If it turns out to use the anon key, the fix is to switch n8n to the
-- service-role key — NOT to restore this policy. A world-writable table is not
-- an acceptable integration point, and the empty rows above suggest it is
-- already being written by something that should not be able to.
--
-- `waitlist` carries no such doubt: 0 rows, `id` is bigint where every current
-- table uses uuid, and the table Triply actually writes is `waitlist_emails`
-- (service-role only, via app/api/waitlist/route.ts). It is legacy.

-- ── public.feedback ─────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.feedback') is null then
    raise notice 'skip feedback — table absent';
    return;
  end if;

  drop policy if exists "Anyone can insert feedback" on public.feedback;
  alter table public.feedback enable row level security;
end $$;

-- ── public.waitlist ─────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.waitlist') is null then
    raise notice 'skip waitlist — table absent';
    return;
  end if;

  drop policy if exists "Public can join waitlist" on public.waitlist;
  alter table public.waitlist enable row level security;
end $$;

-- Both tables end with RLS enabled and NO policies: anon and authenticated can
-- neither read nor write them; service-role access is unaffected.
--
-- These two policies are also transcribed in
-- 20260722130000_policies_and_triggers_baseline.sql, which runs BEFORE this
-- migration. That is deliberate: that file records production as it was found,
-- this one changes it. Order matters — do not reorder them.
--
-- VERIFY after applying, from OUTSIDE the database (the SQL editor runs as
-- postgres and bypasses RLS, so it cannot confirm this):
--
--   curl -s -o /dev/null -w "%{http_code}\n" -X POST \
--     "$SUPABASE_URL/rest/v1/feedback" \
--     -H "apikey: $ANON" -H "Content-Type: application/json" -d '{}'
--
-- Expect 401/403, not 201.
