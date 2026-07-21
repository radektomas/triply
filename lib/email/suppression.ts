import "server-only";
import { supabase } from "@/lib/supabase";

// Marketing-consent lookups and the unsubscribe write.
//
// Everything here runs on the SERVICE-ROLE client: the unsubscribe route has no
// session (the link is opened straight from an inbox), and the send path runs
// in cron / webhook contexts that have no user cookie either. Both only ever
// touch consent columns on a single profiles row.

export interface Mailability {
  userId: string;
  marketingOptIn: boolean;
  unsubscribedAt: string | null;
}

/** May a marketing-class email go to this profile? */
export function isMailable(p: Mailability): boolean {
  return p.marketingOptIn && p.unsubscribedAt === null;
}

/**
 * Resolve the consent record for a recipient. Prefers the user id when the
 * caller already knows it (cron, DB webhooks); falls back to an email lookup
 * for external callers of POST /api/email.
 *
 * Returns null when no profile matches — the caller must treat that as "no
 * recorded consent" and refuse marketing mail, never as a pass.
 */
export async function getMailability(opts: {
  userId?: string;
  email?: string;
}): Promise<Mailability | null> {
  const columns = "id, marketing_opt_in, unsubscribed_at";

  let query = supabase.from("profiles").select(columns);
  if (opts.userId) {
    query = query.eq("id", opts.userId);
  } else if (opts.email) {
    query = query.eq("email", opts.email);
  } else {
    return null;
  }

  // limit(1) rather than .single(): profiles.email carries no uniqueness
  // constraint, so a duplicate must not turn into a thrown error on the send
  // path. Ordering is unnecessary — any matching row's consent state is
  // authoritative for that address.
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error("[email/suppression] profile lookup failed:", error.message);
    return null;
  }
  if (!data) return null;

  const row = data as {
    id: string;
    marketing_opt_in: boolean | null;
    unsubscribed_at: string | null;
  };
  return {
    userId: row.id,
    // NULL can only appear if the column is read before the migration lands;
    // absence of a recorded opt-in is treated as "no consent".
    marketingOptIn: row.marketing_opt_in === true,
    unsubscribedAt: row.unsubscribed_at,
  };
}

export type UnsubscribeOutcome =
  | { ok: true; alreadyUnsubscribed: boolean }
  | { ok: false; reason: "not_found" | "error" };

/**
 * Record an unsubscribe: stamp unsubscribed_at and clear marketing_opt_in.
 *
 * Idempotent — a second hit (mail client prefetch, user clicking twice, an
 * RFC 8058 POST landing after the page GET) reports success without moving the
 * original timestamp, so the recorded objection date stays truthful.
 */
export async function recordUnsubscribe(
  userId: string,
): Promise<UnsubscribeOutcome> {
  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("id, unsubscribed_at")
    .eq("id", userId)
    .maybeSingle();

  if (readErr) {
    console.error("[email/suppression] unsubscribe read failed:", readErr.message);
    return { ok: false, reason: "error" };
  }
  if (!existing) return { ok: false, reason: "not_found" };

  const row = existing as { id: string; unsubscribed_at: string | null };
  if (row.unsubscribed_at) {
    // Already opted out. Still force marketing_opt_in false in case a later
    // opt-in was written without clearing the stamp.
    const { error } = await supabase
      .from("profiles")
      .update({ marketing_opt_in: false })
      .eq("id", userId);
    if (error) {
      console.error("[email/suppression] unsubscribe re-assert failed:", error.message);
      return { ok: false, reason: "error" };
    }
    return { ok: true, alreadyUnsubscribed: true };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      unsubscribed_at: new Date().toISOString(),
      marketing_opt_in: false,
    })
    .eq("id", userId);
  if (error) {
    console.error("[email/suppression] unsubscribe write failed:", error.message);
    return { ok: false, reason: "error" };
  }
  return { ok: true, alreadyUnsubscribed: false };
}
