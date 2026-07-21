import "server-only";
import { supabase as admin } from "@/lib/supabase";
import { sendTemplateEmail } from "@/lib/email/send";

// In-process lifecycle emails.
//
// These used to be driven by a Supabase Database Webhook: a trigger on
// public.profiles POSTed to /api/hooks/supabase carrying a shared secret in a
// plaintext header baked into the trigger definition. That put a live
// credential in the database catalog — and therefore in every pg_dump and
// every backup — and made a simple "send an email on signup" span a trigger, a
// webhook config, a public HTTP route and a shared secret.
//
// The application already knows when a signup happens, so it just sends the
// email. No trigger, no webhook, no secret.
//
// Idempotency is enforced by profiles.welcome_sent_at rather than by trusting
// the caller: sendWelcomeOnce is safe to call from several signup paths (and
// repeatedly), which is what lets OAuth, confirmed-email and immediate-session
// signups all call it without coordinating.

/** Outcome of a welcome attempt. Never throws — signup must not fail on email. */
export type WelcomeOutcome =
  | "sent"
  | "already_sent"
  | "no_profile"
  | "no_email"
  | "send_failed";

/**
 * Send the welcome email for a user, at most once ever.
 *
 * The stamp is claimed BEFORE sending, with a conditional update that only
 * matches when welcome_sent_at is still NULL. Two concurrent callers therefore
 * race on the database, and exactly one wins — the loser sees 0 updated rows
 * and returns "already_sent" without sending. Claiming after the send instead
 * would leave a window in which both callers send.
 *
 * The trade-off is the opposite failure mode: if the send then fails, the row
 * is already stamped and no retry happens. That is the right way round for a
 * welcome email — a missing welcome is a small loss, a duplicate is a visible
 * mistake — and the failure is logged loudly.
 */
export async function sendWelcomeOnce(userId: string): Promise<WelcomeOutcome> {
  const { data: profile, error: readErr } = await admin
    .from("profiles")
    .select("id, email, display_name, welcome_sent_at")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) {
    console.error("[email/lifecycle] welcome profile read failed:", readErr.message);
    return "no_profile";
  }
  if (!profile) return "no_profile";

  const row = profile as {
    id: string;
    email: string | null;
    display_name: string | null;
    welcome_sent_at: string | null;
  };
  if (row.welcome_sent_at) return "already_sent";

  const email = row.email?.trim();
  if (!email) return "no_email";

  // Claim the send. `.is("welcome_sent_at", null)` makes this the mutual
  // exclusion point; `.select("id")` tells us whether we won.
  const { data: claimed, error: claimErr } = await admin
    .from("profiles")
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq("id", userId)
    .is("welcome_sent_at", null)
    .select("id");

  if (claimErr) {
    console.error("[email/lifecycle] welcome claim failed:", claimErr.message);
    return "send_failed";
  }
  if (!claimed || claimed.length === 0) {
    // Another caller claimed it between our read and our update.
    return "already_sent";
  }

  const result = await sendTemplateEmail({
    template: "welcome",
    to: email,
    userId,
    data: { name: row.display_name?.trim() || "there" },
  });

  if (!result.ok) {
    console.error("[email/lifecycle] welcome send failed after claim:", {
      userId,
      error: result.error,
      detail: result.detail,
    });
    return "send_failed";
  }
  return "sent";
}

/**
 * Send the "destination saved" confirmation. Transactional (it confirms an
 * action the user just took), so it is not gated on marketing consent — see
 * emails/classification.ts. Unlike the welcome email there is no once-ever
 * stamp: one email per save is the intended behaviour.
 *
 * Non-throwing: a failed confirmation email must never fail the save itself.
 */
export async function sendSavedDestinationEmail(opts: {
  userId: string;
  destinationName: string;
}): Promise<void> {
  const destinationName = opts.destinationName.trim();
  if (!destinationName) return;

  const { data: profile, error } = await admin
    .from("profiles")
    .select("email, display_name")
    .eq("id", opts.userId)
    .maybeSingle();

  if (error) {
    console.error("[email/lifecycle] saved profile read failed:", error.message);
    return;
  }
  const email = (profile as { email: string | null } | null)?.email?.trim();
  if (!email) return;

  const result = await sendTemplateEmail({
    template: "saved_destination",
    to: email,
    userId: opts.userId,
    data: {
      name:
        (profile as { display_name: string | null }).display_name?.trim() ||
        "there",
      destinationName,
    },
  });
  if (!result.ok) {
    console.error("[email/lifecycle] saved_destination send failed:", result);
  }
}
