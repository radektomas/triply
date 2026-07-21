# Splitting the shared Supabase project

**Status: plan only. Nothing here has been executed.**

Written 2026-07-21, following the RLS audit.

## Why

One Supabase project currently hosts at least five unrelated applications. They
share a database, a PostgREST instance, an auth user pool, and — the part that
turned this from untidy into a live incident — **one anon key**.

That key is public by design: it ships in Triply's browser bundle, so anyone who
opens the site can read it out of the network tab. It authenticates against
*every* table in the project. On 2026-07-21 that meant a Triply visitor could
enumerate 1,402 cold-call lead records including phone numbers and addresses.

No amount of RLS tuning fixes the root cause, it only patches instances of it.
As long as the projects share a key, every future table added by any app is
exposed by default until someone remembers to lock it. Separation is the fix;
RLS is the stopgap.

Secondary consequences of sharing:

- **Shared auth pool.** A Triply signup creates an account that is equally valid
  against Loro and the shop. Any `to authenticated using (true)` policy in one
  app grants access to every other app's users.
- **Blast radius.** One bad migration, one exhausted connection pool, or one
  compute-limit breach takes down all five products at once.
- **GDPR.** There is no coherent controller story, no per-product retention, and
  no way to answer a deletion request without touching unrelated systems.
- **Cost and quota attribution** are impossible to separate.

## Step 0 — Establish ownership (do this first)

The table→app mapping below is **partly inferred**. Only the Triply column was
verified against source, because this repo is the only codebase available. The
other apps' repos were not inspected, so their assignments come from table names
and column shapes.

**Do not start moving anything until each row is confirmed by the person who
owns that app.** A table moved to the wrong project is worse than a table left
in place.

| Table | Assigned to | Confidence | Basis |
|---|---|---|---|
| `profiles` | Triply | **Verified** | written by `app/auth/callback/route.ts`, `AuthModal.tsx` |
| `saved_destinations` | Triply | **Verified** | `SaveButton.tsx`, `profile/page.tsx` |
| `generation_history` | Triply | **Verified** | `api/trips/route.ts`, `profile/page.tsx` |
| `analytics_events` | Triply | **Verified** | `lib/analytics.ts`, `admin/funnel` |
| `trips` | Triply | **Verified** | `api/trips/route.ts`, `lib/data/getTripById.ts` |
| `trip_cache` | Triply | **Verified** | `lib/data/getTripById.ts`; also written by n8n |
| `photo_cache` | Triply | **Verified** | `lib/photos.ts` |
| `quick_picks` | Triply | **Verified** | `lib/data/getQuickPick.ts` + migration |
| `waitlist_emails` | Triply | **Verified** | `api/waitlist/route.ts` + migration |
| `content_ideas`, `content_results`, `series_ledger` | Triply | **Verified** | `admin/content` + migration |
| `destinations`, `trip_queries`, `popular_budgets`, `popular_months`, `cache_performance` | Triply | *Likely* | trip-shaped names; **no code references found** — may be n8n-owned or dead |
| `waitlist`, `feedback`, `user_profile`, `favorites`, `shared_trips` | Triply? | **Unconfirmed** | plausible legacy Triply tables; no code references. `feedback` is suspicious — Triply posts feedback to an n8n webhook, not a table |
| `n8n_chat_histories` | Shared infra | **Unconfirmed** | n8n's own state; may serve several workflows |
| `loro_*` (8 tables) | Loro | *Likely* | name prefix |
| `coldcall_leads` | Bolder cold-call | *Likely* | name + Czech column names |
| `darkomat_products` | Darkomat | *Likely* | name prefix |
| `products`, `orders` | Shop | *Likely* | generic names — **could belong to Darkomat**; resolve before moving |
| `gift_recomendations` | ? | **Unknown** | has `user_id`; matches no named app. Needs an owner |

Deliverable for step 0: every "Unconfirmed"/"Unknown" row resolved to an owning
app or marked dead. Run `scripts/introspect-schema.sql` to get FKs — a foreign
key crossing a proposed project boundary is a hard blocker and must be found
now, not during the move.

## Target end state

Five Supabase projects: `triply`, `loro`, `darkomat`, `bolder-coldcall`, `shop`.
Each with its own database, anon key, service-role key, auth user pool, and
migration history in its own repo.

Triply keeps the existing project. It has the most infrastructure bound to the
current URL — Google OAuth callbacks, the Supabase auth email hook, two DB
webhooks, n8n workflow credentials, and Vercel env vars — so moving it costs the
most and buys the least. Every other app migrates out.

## Migration order

Ordered by ascending risk, so the process is rehearsed on the cheap cases first.

**1. `darkomat_products` → `darkomat`.** 4 rows, catalogue data, no auth, no
FKs. The rehearsal: proves the copy → verify → cut over → drop loop end to end.

**2. `products` + `orders` → `shop`.** 144 + 0 rows. `orders` almost certainly
FKs to `products`, so move them as one unit. First case with a real FK.

**3. `coldcall_leads` → `bolder-coldcall`.** 1,402 rows, self-contained, no auth
pool. **Highest urgency, moderate risk** — moving it removes the live exposure
outright, so if the RLS stopgap in `scripts/rls-remediation-shared-db.sql` has
not been applied and verified, do this one first regardless of order.

**4. `gift_recomendations` → wherever step 0 assigns it.** Has `user_id`
referencing the shared auth pool: the first migration requiring user-account
migration. Treat it as the pilot for step 5.

**5. `loro_*` → `loro`.** 8 tables with internal FKs and `loro_profiles`
referencing the shared auth pool. Largest and most interdependent; goes last.

Triply is left holding whatever remains, which should by then be only its own
tables plus the unresolved ones from step 0.

## Per-move procedure

1. Create the new project. Record its URL, anon key, service-role key.
2. Export DDL for the moving tables (`pg_dump --schema-only -t <table>`), plus
   their indexes, constraints, triggers, and RLS policies.
3. Commit that DDL as migration `0001_baseline` **in the owning app's repo** —
   this is the moment each app stops being schema-less, so do not skip it.
4. Apply to the new project. Verify schema equality before moving any data.
5. Copy data (`pg_dump --data-only` → restore, or CSV for small tables).
6. Verify row counts and a content checksum on both sides.
7. Point the app at the new project via env vars (below). Deploy to a preview
   environment first.
8. Smoke-test the app end to end against the new project.
9. **Freeze period.** Leave the old tables in place, untouched, for at least 7
   days. Rollback during this window is an env-var revert, nothing more.
10. After the freeze, `drop table` in the old project. This is the only
    irreversible step.

Run each move during a write-quiet window, or accept the delta and re-sync
between steps 5 and 7. For `coldcall_leads` and `orders`, a few minutes of
write downtime is cheaper than reconciling a split-brain.

## What breaks

**Auth pool split (steps 4 and 5).** The one genuinely hard problem. Users exist
once today and must exist in several projects tomorrow.

- `auth.users` rows cannot be moved with password hashes intact via the
  dashboard. Use the Admin API (`createUser`) per project, or Supabase support
  for a hash-preserving export.
- **User IDs change** unless explicitly preserved. Every `user_id` in moved data
  must be remapped through an old-id → new-id table. Build the mapping table
  first; carry it through every data copy.
- OAuth users are easier: they re-authenticate through Google and are matched by
  email, provided their profile row is keyed to the new id.
- Anyone signed in during the switch is signed out — their JWT is signed by the
  old project's secret and the new project will reject it.

**Per-app breakage:**

- *Darkomat / shop*: catalogue reads 404 until env vars are updated. Low impact.
- *Cold-call tool*: needs the server-side/service-role change described in
  `scripts/rls-remediation-shared-db.sql` regardless of the move.
- *Loro*: sessions invalidated; `loro_profiles.id` remap required; internal FKs
  must be recreated in dependency order.
- *Triply*: **nothing breaks.** It keeps the project, URL and keys. Verified: no
  Triply code path reads any non-Triply table.

**Also breaking, easy to forget:**

- n8n credentials point at one Supabase project. Every workflow touching moved
  tables (trip generation, `trip_cache`, `photo_cache`, the email sender) needs
  its credential and table references repointed.
- Any Postgres function, view, or trigger spanning a boundary must be split or
  duplicated. Unknown until `introspect-schema.sql` is run.
- Scheduled jobs, backups, and any BI/reporting connections.

## Env config per app

Each app already reads a `*_SUPABASE_URL` / `*_ANON_KEY` / service-role trio, so
the change is values-only, not code — with one exception noted below.

| App | Change |
|---|---|
| **Triply** | No change. Keeps the current project. |
| **Loro** | New `SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`. New Google OAuth redirect URI. Re-point n8n credentials if used. |
| **Darkomat** | New URL + anon key. Service-role key only if it writes server-side. |
| **Shop** | New URL + anon key + service-role key (orders must be written server-side). |
| **Bolder cold-call** | New URL + **service-role key only**. This one is a code change, not just config: the tool must stop reading leads with the anon key from the browser. |

For each: update the local `.env`, all three Vercel environments
(production/preview/development), and rotate the old keys once the freeze period
ends — the old anon key has been public and shared, so treat it as burned.

## Cleanup items to carry into the move

Small things not worth a dedicated change now, but which should not be copied
into a fresh project unexamined.

- **`products` has two identical public SELECT policies.** Duplicates are
  harmless at runtime — RLS `OR`s permissive policies together, so two copies
  of the same rule grant exactly what one would — but they cost a second policy
  evaluation per row and, more importantly, they are a trap during review:
  dropping "the" public-read policy leaves the table just as open, which is
  precisely the failure mode that made the first `coldcall_leads` fix look
  successful when it wasn't. Collapse to one named policy when the shop moves,
  and verify externally with the anon key afterwards rather than from the SQL
  editor.

- **`shared_trips` is publicly readable and currently empty (0 rows).** See the
  assessment below; decide whether the feature is still wanted before carrying
  the table across.

- **Dormant tables with no code references** in this repo: `destinations` (740
  rows), `user_profile` (186), `favorites` (6), `feedback` (2), `waitlist` (0),
  `trip_queries` (0), `shared_trips` (0), `popular_budgets`, `popular_months`,
  `cache_performance`. Some are probably n8n-owned, some are probably dead.
  Resolve each to an owner or to "drop" in step 0 — migrating dead tables
  carries the audit burden forward for no benefit. Note `user_profile` holds
  186 rows against Triply's 22 `profiles`, so it is very unlikely to be
  Triply's and needs an owner urgently.

- **`NEXT_PUBLIC_N8N_SINGLE_CITY_WEBHOOK`** exists in `.env.local` but is
  referenced by no code and does not appear in the built client bundle. The
  `NEXT_PUBLIC_` prefix means that the moment anything reads it, the n8n
  webhook URL is inlined into client JavaScript and becomes public. Rename it
  without the prefix (or delete it) before it acquires a caller.

## Sequencing against the privacy-policy work

The policy rewrite should land **after** step 0 and the RLS stopgap, but does
not need to wait for the full separation. What the policy needs to state is
already knowable: which data Triply holds, its retention, and who processes it.
It should not claim data isolation that does not exist yet, so either complete
the separation first or keep the policy silent on infrastructure boundaries.
