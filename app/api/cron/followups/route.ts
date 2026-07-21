import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTemplateEmail } from "@/lib/email/send";

// Daily followup emails for saved destinations (Vercel Cron, 08:00 UTC):
//   followup_1: saved >= 1 day ago,  followup_1_sent_at IS NULL
//   followup_2: saved >= 7 days ago, followup_2_sent_at IS NULL
//
// Per-user dedup: a user with several due rows gets ONE email (for their most
// recent destination) and every due row is stamped, so tomorrow's run doesn't
// nudge them again for the older saves. A user is also emailed at most once
// per run across both phases — their followup_2 rows stay unstamped and go
// out on a later run instead of landing minutes after followup_1.
//
// Idempotency: sent_at stamps are written ONLY after a successful send, and
// each query filters on the stamp being NULL — a crashed or re-triggered run
// simply picks up where it left off. One failed send is recorded in `errors`
// and never aborts the batch. Queries ride the partial indexes
// idx_saved_destinations_followup{1,2}_pending.
//
// Safety valve: at most SEND_CAP emails per run; anything due beyond the cap
// is counted in `skipped` and drained by subsequent daily runs.
//
// Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically
// when the CRON_SECRET env var is set on the project; manual triggers must
// send the same header.

export const dynamic = "force-dynamic";

const SEND_CAP = 50; // total sends per run, both phases combined
const BATCH_LIMIT = 200; // rows fetched per phase; they collapse per user

const DAY_MS = 24 * 60 * 60 * 1000;

interface SavedRow {
  id: string;
  user_id: string;
  destination: { name?: unknown } | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  marketing_opt_in: boolean | null;
  unsubscribed_at: string | null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

interface RunState {
  sent: number;
  skipped: number;
  /** Rows stamped without sending because the user is not mailable. */
  suppressed: number;
  errors: string[];
  emailedUserIds: Set<string>;
}

async function runPhase(phase: 1 | 2, state: RunState): Promise<number> {
  const column = phase === 1 ? "followup_1_sent_at" : "followup_2_sent_at";
  const template = phase === 1 ? "followup_1" : "followup_2";
  const days = phase === 1 ? 1 : 7;
  const cutoff = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data, error: qErr } = await supabase
    .from("saved_destinations")
    .select("id, user_id, destination")
    .is(column, null)
    .lte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(BATCH_LIMIT);
  if (qErr) {
    state.errors.push(`followup_${phase} query failed: ${qErr.message}`);
    return 0;
  }
  const rows = (data ?? []) as SavedRow[];
  if (rows.length === 0) return 0;

  // Group due rows by user. Rows arrive newest-first, so each group's first
  // named destination is the user's most recent one.
  const rowsByUser = new Map<string, SavedRow[]>();
  for (const row of rows) {
    if (!str(row.user_id)) continue;
    const group = rowsByUser.get(row.user_id);
    if (group) group.push(row);
    else rowsByUser.set(row.user_id, [row]);
  }

  // Resolve all recipients in one query (user_id -> profiles), join in JS —
  // no FK-embed dependency between saved_destinations and profiles.
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, display_name, marketing_opt_in, unsubscribed_at")
    .in("id", [...rowsByUser.keys()]);
  if (pErr) {
    state.errors.push(
      `followup_${phase} profile lookup failed: ${pErr.message}`,
    );
    return 0;
  }
  const profileById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  const stampAll = async (ids: string[]) => {
    const { error } = await supabase
      .from("saved_destinations")
      .update({ [column]: new Date().toISOString() })
      .in("id", ids);
    return error;
  };

  let sentThisPhase = 0;
  for (const [userId, userRows] of rowsByUser) {
    try {
      // Already nudged this run (followup_1 in the same run, or an earlier
      // dedup group). Leave rows unstamped; a later run sends this phase.
      if (state.emailedUserIds.has(userId)) {
        state.skipped++;
        continue;
      }
      if (state.sent >= SEND_CAP) {
        state.skipped++;
        continue;
      }

      const rowIds = userRows.map((r) => r.id);
      const destinationName = userRows
        .map((r) => str(r.destination?.name))
        .find(Boolean);
      const profile = profileById.get(userId);
      const email = str(profile?.email);
      if (!destinationName || !email) {
        // Unfixable group (no recipient or no named destination): stamp it so
        // the pending partial index doesn't accumulate rows we retry forever.
        await stampAll(rowIds);
        continue;
      }

      // Both followups are marketing-class (emails/classification.ts), so they
      // require an active opt-in. sendTemplateEmail re-checks this itself; the
      // point of checking here too is to stamp the rows, otherwise every
      // non-consenting user's saves sit in the pending partial index forever
      // and get re-queried (and re-refused) on every daily run.
      const mailable =
        profile?.marketing_opt_in === true && !profile?.unsubscribed_at;
      if (!mailable) {
        await stampAll(rowIds);
        state.suppressed++;
        continue;
      }

      const result = await sendTemplateEmail({
        template,
        to: email,
        userId,
        data: {
          name: str(profile?.display_name) ?? "there",
          destinationName,
        },
      });
      if (!result.ok) {
        // Consent changed between the read above and the send (or no profile
        // was resolvable). Not retryable — stamp and move on.
        if (result.error === "not_consented" || result.error === "suppressed") {
          await stampAll(rowIds);
          state.suppressed++;
          continue;
        }
        state.errors.push(
          `followup_${phase} user ${userId}: ${result.error}${result.detail ? ` (${result.detail})` : ""}`,
        );
        continue; // stamps NOT set — next run retries this user
      }

      const stampErr = await stampAll(rowIds);
      if (stampErr) {
        state.errors.push(
          `followup_${phase} user ${userId}: sent but stamp failed (${stampErr.message})`,
        );
      }
      state.emailedUserIds.add(userId);
      state.sent++;
      sentThisPhase++;
    } catch (err) {
      state.errors.push(
        `followup_${phase} user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return sentThisPhase;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/followups] missing env: CRON_SECRET");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const state: RunState = {
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: [],
    emailedUserIds: new Set(),
  };
  const followup1Sent = await runPhase(1, state);
  const followup2Sent = await runPhase(2, state);

  const summary = {
    followup1Sent,
    followup2Sent,
    skipped: state.skipped,
    suppressed: state.suppressed,
    errors: state.errors,
  };
  console.log("[cron/followups] run complete:", summary);
  return NextResponse.json(summary);
}
