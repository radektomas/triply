# RLS policies on non-Triply tables — reference only

**This file is documentation, not a migration.** Nothing here is applied by
Triply's migration history, on purpose: versioning another application's schema
inside this repo would deepen the coupling that
[supabase-separation-plan.md](./supabase-separation-plan.md) exists to undo.
When each app moves to its own Supabase project, the relevant block below
becomes that app's `0001_baseline` migration, in that app's repo.

Recorded 2026-07-22.

## ⚠️ Coverage gap — read first

The `pg_policies` output supplied on 2026-07-22 contained **only** policies on
Triply-owned or ambiguous tables (`profiles`, `saved_destinations`,
`generation_history`, `analytics_events`, `quick_picks`, `shared_trips`,
`waitlist`, `feedback`, `favorites`). It contained **no rows for**
`coldcall_leads`, `gift_recomendations`, `products`, `orders`,
`darkomat_products`, or any `loro_*` table.

That is almost certainly a filtered export rather than a true absence — we know
from earlier work that at least `orders_public_insert` and two duplicate
`products` SELECT policies exist. So the sections below are **incomplete**, and
this file must not be treated as a full record of the non-Triply policy set.

To complete it, run section 6 of `scripts/introspect-schema.sql` without a
`tablename` filter and paste the full result.

## What is known, and how

Everything here was either stated directly by the project owner or measured
externally with the public anon key and a real authenticated JWT. Where a
policy's exact name or expression was never captured, that is said plainly
rather than guessed.

### `orders` — open insert (reported, definition not captured)

| Field | Value |
|---|---|
| Policy | `orders_public_insert` |
| Command | INSERT |
| `with_check` | `true` |
| Source | reported by the owner; not present in the supplied export |

Anyone holding the public anon key can insert arbitrary rows. An `AFTER INSERT`
trigger then posts to a hardcoded n8n webhook, so a row insert is effectively a
remote workflow-execution primitive. Remediation options are written up in the
batch report; the recommended fix is to move order creation server-side behind
the service role and drop this policy.

### `products` — duplicate public read (reported)

Two identical public `SELECT` policies. Harmless at runtime — permissive
policies OR together — but a review trap: dropping "the" public-read policy
leaves the table just as open. Collapse to one when the shop moves, then verify
externally with the anon key rather than from the SQL editor.

### `coldcall_leads`, `gift_recomendations` — now closed

RLS enabled with zero policies, verified externally on 2026-07-22: both return
`Content-Range: */0` to the anon key **and** to an authenticated JWT, against
real row counts of 1,402 and 62.

Worth recording how this looked while it was broken, because the failure mode
is subtle: at one point anon could read all 1,402 rows while a signed-in user
saw none. RLS was enabled; a permissive policy scoped `to anon` was cancelling
it out. **RLS being ON tells you nothing on its own** — always verify from
outside, with both an anon key and a real user token. Checking from the SQL
editor proves nothing, because it runs as `postgres` and bypasses RLS entirely.

Neither table should get an anon policy. `coldcall_leads` has no owner column
and needs server-side reads with the service role; `gift_recomendations` has a
`user_id` and can take proper `auth.uid() = user_id` policies. Draft SQL for
both is in `scripts/rls-remediation-shared-db.sql`.

### `loro_*`, `darkomat_products` — not captured

No policy definitions available. `darkomat_products` (4 rows) and `loro_videos`
(2 rows) were still readable by both anon and authenticated as of 2026-07-22;
the remaining `loro_*` tables returned zero rows to both.

`loro_videos` deliberately has **no** public policy proposed: its columns
(`status`, `cues`, review-related fields) suggest a draft pipeline, and a
blanket anon policy could publish unreviewed content. Any policy there should
filter on publication state.

## Ambiguous tables — owner unresolved

These carry policies transcribed into Triply's migration history
(`20260722130000_policies_and_triggers_baseline.sql`) because they sit in the
same schema, but **none of them is referenced by any Triply code**. Ownership
must be resolved in step 0 of the separation plan; if any turns out to belong to
another app, its block moves out of that migration and into this file.

| Table | Rows | Policy | Concern |
|---|---|---|---|
| `feedback` | 2 | `Anyone can insert feedback` — INSERT, `with_check: true` | Open write vector. Triply's own `/api/feedback` posts to n8n and does not write this table. |
| `waitlist` | 0 | `Public can join waitlist` — INSERT, `with_check: true` | Open write vector. Legacy: `id` is `bigint`, whereas the table Triply actually uses (`waitlist_emails`) is `uuid` and correctly service-role only. |
| `favorites` | 6 | three `authenticated` policies using `(auth.uid())::text = user_id` | `user_id` is **`text`**, not `uuid` — see the schema-inconsistency note in the batch report. |
| `user_profile` | 186 | none captured | 186 rows against Triply's 22 `profiles` — very unlikely to be Triply's. Needs an owner urgently. |
