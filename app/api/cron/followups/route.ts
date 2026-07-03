import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTemplateEmail } from "@/lib/email/send";

// Daily followup emails for saved destinations (Vercel Cron, 08:00 UTC):
//   followup_1: saved >= 1 day ago,  followup_1_sent_at IS NULL
//   followup_2: saved >= 7 days ago, followup_2_sent_at IS NULL
//
// Idempotency: the sent_at stamp is written ONLY after a successful send, and
// each query filters on the stamp being NULL — a crashed or re-triggered run
// simply picks up where it left off. One failed send is recorded in `errors`
// and never aborts the batch. Queries ride the partial indexes
// idx_saved_destinations_followup{1,2}_pending.
//
// Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically
// when the CRON_SECRET env var is set on the project; manual triggers must
// send the same header.

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 100; // per phase per run — the daily cadence drains any backlog

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
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function runPhase(
  phase: 1 | 2,
  sentInThisRun: Set<string>,
  errors: string[],
): Promise<number> {
  const column = phase === 1 ? "followup_1_sent_at" : "followup_2_sent_at";
  const template = phase === 1 ? "followup_1" : "followup_2";
  const days = phase === 1 ? 1 : 7;
  const cutoff = new Date(Date.now() - days * DAY_MS).toISOString();

  const { data: rows, error: qErr } = await supabase
    .from("saved_destinations")
    .select("id, user_id, destination")
    .is(column, null)
    .lte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);
  if (qErr) {
    errors.push(`followup_${phase} query failed: ${qErr.message}`);
    return 0;
  }
  if (!rows || rows.length === 0) return 0;

  // Resolve all recipients in one query (user_id -> profiles), join in JS —
  // no FK-embed dependency between saved_destinations and profiles.
  const userIds = [...new Set(rows.map((r) => (r as SavedRow).user_id).filter(Boolean))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds);
  if (pErr) {
    errors.push(`followup_${phase} profile lookup failed: ${pErr.message}`);
    return 0;
  }
  const profileById = new Map(
    (profiles ?? []).map((p) => [(p as ProfileRow).id, p as ProfileRow]),
  );

  let sent = 0;
  for (const raw of rows as SavedRow[]) {
    try {
      // A row old enough for both phases on the same run (e.g. backlog at
      // rollout) gets only followup_1 today; followup_2 goes out on a later
      // run. Two nudges within one minute would read as spam.
      if (phase === 2 && sentInThisRun.has(raw.id)) continue;

      const destinationName = str(raw.destination?.name);
      const profile = profileById.get(raw.user_id);
      const email = str(profile?.email);
      if (!destinationName || !email) {
        // Unfixable row (no recipient or no name): stamp it so the pending
        // partial index doesn't accumulate rows we retry forever.
        await supabase
          .from("saved_destinations")
          .update({ [column]: new Date().toISOString() })
          .eq("id", raw.id);
        continue;
      }

      const result = await sendTemplateEmail({
        template,
        to: email,
        data: {
          name: str(profile?.display_name) ?? "there",
          destinationName,
        },
      });
      if (!result.ok) {
        errors.push(`followup_${phase} row ${raw.id}: ${result.error}${result.detail ? ` (${result.detail})` : ""}`);
        continue; // stamp NOT set — next run retries this row
      }

      const { error: stampErr } = await supabase
        .from("saved_destinations")
        .update({ [column]: new Date().toISOString() })
        .eq("id", raw.id);
      if (stampErr) {
        errors.push(`followup_${phase} row ${raw.id}: sent but stamp failed (${stampErr.message})`);
      }
      sentInThisRun.add(raw.id);
      sent++;
    } catch (err) {
      errors.push(
        `followup_${phase} row ${raw.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return sent;
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

  const errors: string[] = [];
  const sentInThisRun = new Set<string>();
  const followup_1_sent = await runPhase(1, sentInThisRun, errors);
  const followup_2_sent = await runPhase(2, sentInThisRun, errors);

  const summary = { followup_1_sent, followup_2_sent, errors };
  console.log("[cron/followups] run complete:", summary);
  return NextResponse.json(summary);
}
