import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  RETENTION_TARGETS,
  targetCutoffIso,
  type RetentionTarget,
} from "@/lib/retention";

// Data-retention enforcement (Vercel Cron, 03:30 UTC daily).
//
// The privacy policy promises trip records are deleted after a fixed window.
// Until this route existed, nothing deleted anything — the promise was simply
// untrue. This job makes it real. The windows themselves live in
// lib/retention.ts so the code and the policy text can be diffed directly.
//
// Scope is allow-list only: RETENTION_TARGETS is the complete set of tables
// touched. profiles, saved_destinations and generation_history are deliberately
// absent — they are account-lifetime, user-owned data, removed by account
// deletion (app/profile/actions.ts) and never by age.
//
// Two expiry models, per target:
//   • trips            — keys on the row's own `expires_at` (DB default
//                        created_at + 30d), so the database's own encoded
//                        intent is what gets honoured.
//   • analytics_events — no per-row expiry column, so aged by `created_at`
//                        against ANALYTICS_RETENTION_DAYS.
//
// Deletion is batched by primary key rather than issued as one big
// `delete ... where <column> < cutoff`: an unbounded delete on a large table
// risks a statement timeout, and a timeout mid-statement rolls the whole thing
// back, so the job would make no progress at all. Batching means each run makes
// forward progress; whatever the cap leaves behind is picked up tomorrow.
//
// Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically.
// Manual triggers must send the same header.
//
//   GET /api/cron/retention            → delete
//   GET /api/cron/retention?dryRun=1   → count only, write nothing

export const dynamic = "force-dynamic";

/** Rows per delete statement. */
const BATCH_SIZE = 500;
/** Max batches per table per run — bounds worst-case runtime. */
const MAX_BATCHES = 40;

interface TableReport {
  table: string;
  /** How expiry is determined: the row's own expires_at, or age since created_at. */
  mode: RetentionTarget["mode"];
  column: string;
  /** Only set for age-based targets. */
  retentionDays?: number;
  cutoff: string;
  /** Rows currently older than the cutoff. */
  expired: number;
  /** Rows actually deleted this run (0 in dry-run). */
  deleted: number;
  /** True when the per-run cap stopped us short of draining the table. */
  capped: boolean;
  error?: string;
}

async function countExpired(
  target: RetentionTarget,
  cutoff: string,
): Promise<number | { error: string }> {
  const { count, error } = await supabase
    .from(target.table)
    .select("id", { count: "exact", head: true })
    .lt(target.column, cutoff);
  if (error) return { error: error.message };
  return count ?? 0;
}

async function purgeTable(
  target: RetentionTarget,
  dryRun: boolean,
  now: number,
): Promise<TableReport> {
  const cutoff = targetCutoffIso(target, now);
  const report: TableReport = {
    table: target.table,
    mode: target.mode,
    column: target.column,
    ...(target.mode === "age" ? { retentionDays: target.days } : {}),
    cutoff,
    expired: 0,
    deleted: 0,
    capped: false,
  };

  const counted = await countExpired(target, cutoff);
  if (typeof counted !== "number") {
    report.error = counted.error;
    return report;
  }
  report.expired = counted;

  if (dryRun || counted === 0) return report;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    // Re-select each iteration rather than paginating with a range: the
    // previous batch has already been deleted, so the oldest remaining rows
    // are always at offset 0 and there is no shifting-window problem.
    const { data, error: selErr } = await supabase
      .from(target.table)
      .select("id")
      .lt(target.column, cutoff)
      .order(target.column, { ascending: true })
      .limit(BATCH_SIZE);
    if (selErr) {
      report.error = `select failed: ${selErr.message}`;
      return report;
    }

    const ids = ((data ?? []) as Array<{ id: string }>).map((r) => r.id);
    if (ids.length === 0) return report;

    const { error: delErr } = await supabase
      .from(target.table)
      .delete()
      .in("id", ids);
    if (delErr) {
      report.error = `delete failed: ${delErr.message}`;
      return report;
    }
    report.deleted += ids.length;

    // Short batch means the table is drained.
    if (ids.length < BATCH_SIZE) return report;
  }

  // Fell out of the loop still finding rows — the cap bit. Surfaced explicitly
  // rather than silently: a table that is capped every day is not converging
  // and the caps need raising.
  report.capped = true;
  return report;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/retention] missing env: CRON_SECRET");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dryRunParam = new URL(req.url).searchParams.get("dryRun");
  const dryRun = dryRunParam === "1" || dryRunParam === "true";

  // One `now` for the whole run so every table's cutoff is measured against the
  // same instant and the report is internally consistent.
  const now = Date.now();

  const tables: TableReport[] = [];
  for (const target of RETENTION_TARGETS) {
    tables.push(await purgeTable(target, dryRun, now));
  }

  const summary = {
    dryRun,
    ranAt: new Date(now).toISOString(),
    totalExpired: tables.reduce((n, t) => n + t.expired, 0),
    totalDeleted: tables.reduce((n, t) => n + t.deleted, 0),
    tables,
    errors: tables.filter((t) => t.error).map((t) => `${t.table}: ${t.error}`),
  };

  console.log("[cron/retention] run complete:", JSON.stringify(summary));
  return NextResponse.json(summary);
}
