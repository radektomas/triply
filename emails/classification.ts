// Single source of truth for whether an email is transactional or marketing.
//
// This is a legal boundary, not a stylistic one, so it lives in one table that
// both send paths import rather than being re-derived per call site:
//
//   TRANSACTIONAL — strictly necessary to operate the service or to complete
//     something the user just did. Sent on the basis of contract performance,
//     NOT consent. Never suppressed by opt-out state, never carries
//     List-Unsubscribe, never renders an unsubscribe link. Suppressing these
//     would break account access (auth links) or silently drop a confirmation
//     the user is expecting.
//
//   MARKETING — re-engagement and promotional mail. Requires an explicit
//     opt-in (profiles.marketing_opt_in) and is suppressed by an opt-out
//     (profiles.unsubscribed_at). Always carries List-Unsubscribe +
//     List-Unsubscribe-Post and a working per-recipient unsubscribe link.
//
// `welcome` is TRANSACTIONAL. It is a service message triggered by the user's
// own signup — it confirms the account exists and explains what it does, in
// direct response to an action the user just took. That is contract
// performance, not re-engagement, so it neither requires an opt-in nor carries
// an opt-out. Only the two delayed followups are marketing.

export type EmailClass = "transactional" | "marketing";

/** Lifecycle templates rendered through emails/index.ts (POST /api/email,
 *  lib/email/lifecycle.ts, /api/cron/followups). */
export type LifecycleTemplate =
  | "welcome"
  | "saved_destination"
  | "followup_1"
  | "followup_2";

/** Supabase auth action types rendered through /api/hooks/auth-email. */
export type AuthTemplate =
  | "signup"
  | "recovery"
  | "magiclink"
  | "email_change"
  | "generic";

export type AnyTemplate = LifecycleTemplate | AuthTemplate;

export const EMAIL_CLASSIFICATION: Record<AnyTemplate, EmailClass> = {
  // ── Lifecycle ──────────────────────────────────────────────────────────────
  // Direct response to the user saving a destination — expected, immediate.
  saved_destination: "transactional",
  // Fires on signup, confirming the account the user just created.
  welcome: "transactional",
  // Re-engagement nudges 1 and 7 days after a save — the only marketing mail.
  followup_1: "marketing",
  followup_2: "marketing",

  // ── Auth (all strictly necessary — account access depends on them) ──────────
  signup: "transactional",
  recovery: "transactional",
  magiclink: "transactional",
  email_change: "transactional",
  // Fallback renderer for invite / reauthentication / future action types.
  // Auth-hook mail is necessary by definition, so the default stays
  // transactional; any genuinely promotional template must be added above with
  // an explicit "marketing" entry instead of riding this default.
  generic: "transactional",
};

export function classifyEmail(template: AnyTemplate): EmailClass {
  return EMAIL_CLASSIFICATION[template];
}

export function isMarketing(template: AnyTemplate): boolean {
  return EMAIL_CLASSIFICATION[template] === "marketing";
}
