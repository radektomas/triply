import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// DATA RETENTION WINDOWS — these constants ARE the promise made in the privacy
// policy. If a number changes here, the policy text must change with it (and
// vice versa). Keep them together and keep them boring, so the two can be
// diffed against each other at a glance.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generated trip records.
 * Privacy policy: "Trip records are kept for up to 30 days, then deleted."
 *
 * NOTE ON ENFORCEMENT: the `trips` purge keys on the table's own `expires_at`
 * column, not on this constant — see TRIPS_TARGET below. `expires_at` is
 * populated on every row by a database default of `created_at + 30 days`, so
 * the effective window equals this number today. The constant is kept as the
 * documented, policy-facing figure; if the column default is ever changed, the
 * real window changes with it and this comment is the place that has to be
 * reconciled. Verified against production: sampled rows show exactly a 30-day
 * gap between created_at and expires_at.
 */
export const TRIP_RETENTION_DAYS = 30;

/**
 * Product-analytics event log (funnel events).
 *
 * NOT 30 days on purpose: /admin/funnel reads a rolling 30-day window
 * (WINDOW_DAYS in app/admin/funnel/page.tsx), so a 30-day purge would erode
 * the oldest day of every chart it draws. 90 days lines up with the retention
 * the policy already states for server logs and leaves the dashboard whole.
 *
 * The current policy text does NOT state an analytics retention period — that
 * gap has to be closed in the policy rewrite.
 */
export const ANALYTICS_RETENTION_DAYS = 90;

/**
 * How a table's expired rows are identified.
 *
 *   "expiry" — the table stores its own absolute cutoff per row; delete where
 *              `column < now`. Self-describing, and honours a window the
 *              database already encodes.
 *   "age"    — the table stores only a creation time; delete where
 *              `column < now - days`.
 */
export type RetentionMode = "expiry" | "age";

export interface RetentionTarget {
  /** Postgres table in the `public` schema. */
  table: string;
  /** Timestamp column the window is measured against. */
  column: string;
  mode: RetentionMode;
  /** Retention window in days. Only meaningful when mode === "age". */
  days?: number;
  /** Why this table is purged — read alongside the policy text. */
  rationale: string;
}

/**
 * Every table the retention job touches. Anything absent from this list is
 * never deleted by the job.
 *
 * Deliberately EXCLUDED — all of these are ACCOUNT-LIFETIME data, removed only
 * when the user deletes their account (app/profile/actions.ts):
 *   • profiles            — the account itself.
 *   • saved_destinations  — user-owned saved content.
 *   • generation_history  — user-owned trip history; backs the profile's
 *                           history list and its stats (trips generated,
 *                           countries explored). Ageing it out would silently
 *                           empty a page the user considers theirs, so it
 *                           lives as long as the account does.
 *   • waitlist_emails     — standing consent record for a product launch.
 *   • quick_picks / content_* — editorial content, no personal data.
 */
export const RETENTION_TARGETS: readonly RetentionTarget[] = [
  {
    table: "trips",
    column: "expires_at",
    mode: "expiry",
    rationale:
      "Shared cache of generated trips (normalized form input + AI result). No user_id, no identifiers. Row carries its own expiry, defaulted to created_at + 30 days.",
  },
  {
    table: "analytics_events",
    column: "created_at",
    mode: "age",
    days: ANALYTICS_RETENTION_DAYS,
    rationale:
      "Funnel events keyed by a persistent session id, back-filled with user_id at signup. No per-row expiry column, so aged by created_at.",
  },
] as const;

/** Cutoff instant for an age-based window: rows strictly older are expired. */
export function cutoffIso(days: number, now: number = Date.now()): string {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * The instant a target's rows are compared against. For "expiry" targets that
 * is simply now (the row's own column already encodes the window); for "age"
 * targets it is now minus the window.
 */
export function targetCutoffIso(
  target: RetentionTarget,
  now: number = Date.now(),
): string {
  if (target.mode === "expiry") return new Date(now).toISOString();
  return cutoffIso(target.days ?? 0, now);
}
