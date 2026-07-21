-- RLS remediation for the NON-Triply tables sharing this Supabase project.
--
-- Deliberately NOT a Triply migration. These tables belong to other
-- applications (Loro, Darkomat, the shop, the cold-call tool); versioning
-- their schema inside Triply's migration history would cement exactly the
-- coupling that docs/supabase-separation-plan.md exists to undo. Run this by
-- hand in the SQL editor, then move each block into its owning app's repo once
-- the projects are split.
--
-- ── AUDIT STATE, 2026-07-21, measured not assumed ───────────────────────────
-- Probed with the public anon key, and with a real signed-in user's JWT from
-- two throwaway accounts:
--
--   table                 anon sees   authenticated sees
--   coldcall_leads          1402            0
--   gift_recomendations       62            0
--   products                 144          144
--   darkomat_products          4            4
--   loro_videos                2            2
--
-- Read that table carefully: anon sees MORE than a logged-in user on the two
-- tables holding personal data. That asymmetry can only be produced by an RLS
-- policy scoped `to anon`. In other words RLS is enabled on those tables and a
-- permissive anon policy is cancelling it out. Enabling RLS was necessary but
-- not sufficient — the policy is what has to go.
--
-- Every statement below is idempotent.


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PERSONAL DATA — remove public access. Do this first.
-- ═══════════════════════════════════════════════════════════════════════════

-- coldcall_leads: ~1,402 business-contact records (nazev, adresa, telefon,
-- web, maps_url) plus call outcomes and free-text notes. Contact data for
-- named businesses and people; readable today by anyone who copies the anon
-- key out of the Triply browser bundle.
alter table public.coldcall_leads enable row level security;

-- gift_recomendations: 62 rows carrying user_id, recipient, recipient_age and
-- a free-text `about` description of a named person — written by another
-- app's users about third parties who never interacted with any of this.
alter table public.gift_recomendations enable row level security;

-- The permissive anon policies. Names are a GUESS — Supabase's dashboard
-- template names its generated read policy "Enable read access for all users".
-- Run scripts/introspect-schema.sql section 6 FIRST, then drop by real name.
-- Dropping a policy that does not exist is a silent no-op, so a wrong guess
-- here fails quietly rather than loudly: re-run the anon probe afterwards to
-- confirm the row count actually dropped to 0.
drop policy if exists "Enable read access for all users" on public.coldcall_leads;
drop policy if exists "anon read"                        on public.coldcall_leads;
drop policy if exists "public read"                      on public.coldcall_leads;

drop policy if exists "Enable read access for all users" on public.gift_recomendations;
drop policy if exists "anon read"                        on public.gift_recomendations;
drop policy if exists "public read"                      on public.gift_recomendations;

-- What those two apps must change (no anon policy is being added for them):
--
--   coldcall_leads — an internal sales tool with no per-row owner column.
--     Correct fix is server-side reads with the service-role key, exactly as
--     Triply's /admin/funnel and /admin/content already do. If it is a pure
--     client-side app, it needs a thin server route in front of the data.
--     Second-best, if the tool has authenticated operators:
--       create policy "operators read leads" on public.coldcall_leads
--         for select to authenticated using (true);
--     — but that grants every account in the shared project access, which is
--     only acceptable once the projects are separated.
--
--   gift_recomendations — HAS a user_id column, so it can be scoped properly:
--       create policy "owner reads own recommendations"
--         on public.gift_recomendations for select to authenticated
--         using (auth.uid() = user_id);
--       create policy "owner inserts own recommendations"
--         on public.gift_recomendations for insert to authenticated
--         with check (auth.uid() = user_id);
--     Confirm user_id is actually populated and really references auth.users
--     before applying; 62 rows is small enough to check by hand.


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. GENUINELY PUBLIC CATALOGUES — make the access deliberate and documented.
-- ═══════════════════════════════════════════════════════════════════════════
-- These are read by their apps' browsers with the anon key and contain no
-- personal data. Today they are readable because nothing stops it; after this
-- they are readable because a named policy says so. Read-only: no insert,
-- update or delete policy is granted, so the anon key still cannot write.

alter table public.products enable row level security;
drop policy if exists "anon read products" on public.products;
create policy "anon read products"
  on public.products for select to anon using (true);

alter table public.darkomat_products enable row level security;
drop policy if exists "anon read darkomat_products" on public.darkomat_products;
create policy "anon read darkomat_products"
  on public.darkomat_products for select to anon using (true);

-- Signed-in users of those apps need the catalogue too. Without this, enabling
-- RLS above would break the logged-in shopping experience — the exact failure
-- mode that made coldcall_leads invisible to authenticated users.
drop policy if exists "authenticated read products" on public.products;
create policy "authenticated read products"
  on public.products for select to authenticated using (true);

drop policy if exists "authenticated read darkomat_products" on public.darkomat_products;
create policy "authenticated read darkomat_products"
  on public.darkomat_products for select to authenticated using (true);


-- ── loro_videos: HOLD, pending confirmation ────────────────────────────────
-- Only 2 rows, and the columns (creator_id, status, storage_path, cues,
-- dictionary, review-ish fields) look like a content pipeline with draft
-- states, not a finished public feed. Publishing unreviewed drafts by adding a
-- blanket anon policy would be worse than the current breakage.
--
-- If the feed IS public, the policy should still filter on publication state
-- rather than exposing everything:
--
--   alter table public.loro_videos enable row level security;
--   create policy "anon read published videos"
--     on public.loro_videos for select to anon
--     using (status = 'published');   -- confirm the real column + value first
--
-- Do not apply until someone confirms the status vocabulary in the Loro app.


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. VERIFY — re-run after applying. Expect: 0, 0, 144, 4.
-- ═══════════════════════════════════════════════════════════════════════════
-- Against the REST API with the anon key:
--   curl "$SUPABASE_URL/rest/v1/coldcall_leads?select=id&limit=1"      -H "apikey: $ANON"
--   curl "$SUPABASE_URL/rest/v1/gift_recomendations?select=id&limit=1" -H "apikey: $ANON"
--   curl "$SUPABASE_URL/rest/v1/products?select=id&limit=1"            -H "apikey: $ANON"
--   curl "$SUPABASE_URL/rest/v1/darkomat_products?select=id&limit=1"   -H "apikey: $ANON"
