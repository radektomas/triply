# Schema drift audit — repo vs production

Audited 2026-07-22 against the live database. Method: PostgREST OpenAPI for
tables/columns/types/defaults/NOT NULL, the `pg_policies` export of 2026-07-22
for policies, external anon + authenticated probes for effective RLS, and
service-role counts for seed data.

## Headline

**The evidence indicates no migration file in this repo has ever been executed
against production.** Every table and column exists, but they were created by
hand in the Supabase dashboard; the migration files are a parallel record that
mostly — but not entirely — describes the same thing.

Four independent signals, none of which is decisive alone:

1. `20260516120000` creates policy `"anon read quick_picks"`. Production has no
   such policy; it has a differently-named one, `"Quick picks are viewable by
   everyone"`, scoped `to public` instead of `to anon`.
2. `20260622130000` creates policy `"users update own profile"`. Production
   does not have it. (It has `"Users can update own profile"` — different name,
   different role grant, created separately.)
3. `20260709120000` unconditionally `INSERT`s 5 content_ideas rows, 1
   content_results row and 13 series_ledger rows, using fixed UUIDs.
   **Neither fixed-UUID row exists in production**, and `content_results` is
   empty. Rows could have been deleted, but both being gone while the tables
   are otherwise populated (95 / 21 rows) points to the seed never running.
4. `20260709120000` uses bare `create table public.content_ideas (...)` with no
   `IF NOT EXISTS`. Applied against a database where those tables already
   existed, it would have errored — so if it ever ran, it ran first, and then
   its seed rows should be present. They are not.

The single counter-signal: `analytics_events_insert_public` exists in
production with exactly the name `20260626120000` uses. That is equally well
explained by the same person creating the policy by hand and writing the
migration to match.

**Consequence:** the migration directory cannot currently be trusted as a
description of production, in either direction. Confirming this properly needs
one query that PostgREST cannot serve (see below).

## The one thing not verifiable from outside

`supabase_migrations.schema_migrations` is unreachable via the REST API —
PostgREST reports `Only the following schemas are exposed: public,
graphql_public`. Run this in the SQL editor to settle Task A.1 definitively:

```sql
select version, name, statements is not null as has_statements
from supabase_migrations.schema_migrations
order by version;
```

An empty result confirms the hypothesis above outright. Supabase's table
records `version`, `name` and `statements` — there is **no checksum column**,
so "checksum mismatch" is not a detectable state here; a file edited after
application is invisible to the tooling.

## Drift table

Ranked by consequence. 47 objects matched, 4 are repo-only, 5 unverifiable.

### Security-relevant

| Object | Expected per repo | Actual in production | Verdict |
|---|---|---|---|
| policy `quick_picks."anon read quick_picks"` | `for select to anon using (true)` | **absent**; `"Quick picks are viewable by everyone"` `to public using (true)` instead | **diverged** |
| policy `profiles."users update own profile"` | `for update to authenticated`, using + with check | **absent**; `"Users can update own profile"` `to public`, using only | **diverged** |
| policy `analytics_events_insert_public` | `for insert to anon, authenticated with check (true)` | present, identical | match (and being dropped by `20260722120000`) |
| RLS on `trips` | enabled, no policies (`20260721130000`) | enabled, no policies | match |
| `profiles.marketing_opt_in` | `boolean not null default false` | **absent** | repo-only (unapplied) |
| `profiles.unsubscribed_at` | `timestamptz` | **absent** | repo-only (unapplied) |

Both diverged policies are **functionally covered** in production — the live
equivalents grant at least what the repo versions would. Neither is an open
hole. The danger is not the current state but the precedent: two policy
migrations silently had no effect, which is exactly how a future *security*
migration would also silently have no effect.

Note the `with check` asymmetry on the profiles update policy: the repo version
has one, production's does not. Without `with check`, a user updating their own
row is not prevented from setting `id` to someone else's. In practice the PK
and the FK to `auth.users` block it, so this is a hardening gap rather than a
live vulnerability.

### Structural — all matched

Every table and every column matched exactly, including types, NOT NULL and
defaults: `profiles` (9 columns), `saved_destinations` (7), `quick_picks` (12),
`waitlist_emails` (4), `analytics_events` (6), `trips` (7), plus the three
content-dashboard tables. The legacy columns `profiles.welcome_email_sent_at`
and `saved_destinations.reminder_sent_at` are present as recorded in the
baseline.

### Data

| Object | Expected | Actual | Verdict |
|---|---|---|---|
| `content_ideas` seed (5 rows, one fixed UUID) | present | 95 rows, **fixed-UUID row absent** | diverged |
| `content_results` seed (1 row, fixed UUID) | present | **0 rows** | diverged |
| `series_ledger` seed (13 rows) | present | 21 rows | inconclusive |

Mock/demo data only — no consequence beyond being evidence for the headline.

### Not verifiable via PostgREST

Indexes, CHECK constraints, UNIQUE constraints and triggers cannot be read
through the REST API. **Reported as UNKNOWN rather than assumed present:**

- `quick_picks_display_order_idx`; CHECK constraints on `vibe` / `travelers`;
  `unique (display_order)`
- `waitlist_emails` `unique (email)` — load-bearing: `app/api/waitlist/route.ts`
  relies on `on conflict (email) do nothing`. If absent, duplicate emails
  accumulate silently.
- the three `analytics_events` indexes
- the two partial followup indexes on `saved_destinations`

Sections 2 and 3 of `scripts/introspect-schema.sql` resolve all of these.

## Reconciliation

### Production wins — already recorded

| Item | Handled by |
|---|---|
| `quick_picks` policy name/scope | `20260722130000` transcribes the live policy and drops the repo-only name |
| `profiles` update policy | same migration; also drops the repo-only name so fresh databases converge on production's single policy |

No production change needed for either. A fresh database built from migrations
now ends up with production's policy set, not the repo's historical one.

### Repo wins — must be applied to production

| Item | Behaviour change for existing users |
|---|---|
| `20260721120000` consent columns | **Yes.** `marketing_opt_in` defaults false and is never backfilled, so all 22 existing users stop receiving `followup_1` / `followup_2` until they opt in. Deliberate: consent was never collected, so it cannot be assumed. The welcome email is unaffected — it is transactional. |
| `20260722120000` analytics lock | No user-visible change. Deploy code first or events are silently dropped. |
| `20260722140000` webhook trigger drop | No change if the app code ships first. |
| `20260722150000` open-insert closures | `waitlist`: none. `feedback`: **unknown** — see that migration's header. |

### Cannot determine which is correct

- **The `20260709120000` seed.** Applying it to production would inject mock
  content ideas into a live dashboard holding 95 real rows. Not applied, and
  the migration is left as-is — rewriting applied history is worse than the
  inconsistency. A fresh database gets mock data; production does not.
- **Who writes `public.feedback`,** and with which credential. Blocks a
  confident answer on `20260722150000`.
- **Whether the UNKNOWN indexes and constraints exist.** No safe default:
  creating an index that already exists is harmless, but assuming
  `unique (email)` exists when it does not means silent duplicate leads.
