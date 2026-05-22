# Audit Skill — security + performance audit & fix

A repeatable audit process for Triply and other Next.js projects. Read-only
first, structured report, then careful small-commit fixes. Built to catch
**silent cross-layer bugs** that don't surface in any single file or layer.

---

## Purpose

Run a two-pass read-only audit (security + performance), deliver a structured
report, and — only after approval — implement fixes as small independent
commits. The point is the cross-layer bugs: a cache that writes table A and
reads table B, a service-role key one import away from the client bundle, a
condition testing the wrong property. None of these error loudly.

---

## Phase 1 — Read-only audit (NEVER edit in this phase)

Two passes, both **strictly read-only**. No edits, no `npm audit fix`, no
config changes. Each pass outputs a structured report:

- A severity/impact table: `severity | issue | file:line | fix`.
- A prioritized **"fix first"** list — **max 5 items**.
- Explicitly state what is **CLEAN**. Do not pad; do not invent issues.

### SECURITY pass — check:
- Hardcoded secrets / committed API keys / webhook URLs.
- `NEXT_PUBLIC_` vars leaking sensitive data to the client bundle.
- Supabase **anon vs service_role** key usage — the service_role client must
  never be reachable from a client component (verify import graph; flag a
  missing `import "server-only"` guard).
- API route input validation + sanitization; rate limiting.
- Security headers in `next.config` — CSP, HSTS, X-Frame-Options, etc.
- `dangerouslySetInnerHTML` and other XSS sinks; unescaped user input.
- `npm audit` — **High/Critical only**, production deps prioritized.

### PERFORMANCE pass — check:
- Rendering strategy — unnecessary `'use client'` that could be a Server
  Component; heavy client trees.
- Data-fetching waterfalls — sequential `await`s that could be `Promise.all`.
- Supabase `select('*')` where column narrowing would do.
- **Caching** — see the CRITICAL RULE below.
- Images — `next/image` vs CSS `background-image` / raw `<img>`; missing
  dimensions; unoptimized remote photos.
- Bundle — missing `next/dynamic` for heavy/below-fold components.
- Fonts — `next/font`, `display: swap`, self-hosting.

---

## CRITICAL RULE — the cross-layer blind spot (learned the hard way)

When auditing **any cache or any data layer**, verify **BOTH SIDES and ALL
LAYERS** — not just the application code:

- **A cache has a WRITE path and a READ path.** Verify they target the **same
  table**, the **same columns**, and the **same key format**. A mismatch
  (write → table A, read → table B; or write column `result`, read column
  `trip_data`) produces a **~0% hit rate that looks like it works** because
  nothing errors loudly.

- **Caching may live in n8n, not in Next.js.** The n8n workflow can have its
  own Check Cache / Save to Cache nodes. **You cannot see n8n internals from
  the codebase.** If the app calls an n8n webhook, the report MUST say:
  *"Caching may be handled in n8n — I cannot verify the n8n workflow from
  source; the user must check the n8n nodes and the actual Supabase table
  schema."* Do **NOT** conclude "there is no cache writer" just because the
  Next.js code has none.

- **Always recommend verifying the actual DB table schema** — column names,
  `NOT NULL` constraints, unique/PK constraints — before trusting any
  read/write code. Silent failures hide in:
  - missing columns,
  - `NOT NULL` on a column nothing populates,
  - empty-string-vs-`NULL` on `uuid` columns,
  - `if` / `switch` conditions testing the wrong thing (e.g. `.length` on an
    object that has no `.length`).

- **Recommend an end-to-end test**, not code inspection: run the same request
  **twice** — first call = miss/write, second call = hit/read. "Looks correct"
  is not verification.

---

## Phase 2 — Implementation (only after the report is approved)

- **Small, independent commits** — one logical change each. Never bundle
  unrelated changes.
- **Show the diff BEFORE committing** significant changes. Gate the
  highest-risk change (e.g. a cache rewrite) for explicit review before
  proceeding to the rest.
- Run **`npm run build` after each commit**. If the build fails, **STOP and
  report** — never fix silently.
- For changes touching a running/deployed app: recommend **separate deploys** —
  don't bundle multiple risky branches into one production push. Test locally
  first.
- **CSP**: ship as `Content-Security-Policy-Report-Only` on the first pass —
  never enforcing — so violations are observed before they block.
- **Flag duplication of logic that lives elsewhere.** If n8n already caches,
  do NOT add a Next.js cache — surface the architecture question to the user
  instead of silently duplicating a layer.

---

## Output discipline

- The read-only phase produces a **report, not edits**.
- **State assumptions explicitly.** Flag anything not verifiable from source —
  n8n workflows, external service internals, live DB state — rather than
  guessing or asserting.
- **Reuse existing project conventions** — e.g. inline SVG icons per
  `VibeIcons.tsx` / `AuthIcons.tsx`, no `lucide-react`. Don't invent new ones.
- A skipped step is reported as skipped; a failing build is reported with its
  output. Don't claim "done" without the build passing.
