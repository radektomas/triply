import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";

// Internal activation-funnel dashboard. Protected by an email allowlist
// (ADMIN_EMAILS) — any non-listed or anonymous visitor gets a 404 so the route
// never reveals it exists. Counts are read server-side with the service-role
// key (analytics_events is insert-only under RLS for public clients).
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;

// Ordered funnel: each step's conversion is measured against the one above it
// and against the top of the funnel (landing_view).
const FUNNEL: { event: string; label: string; blurb: string; Icon: StepIcon }[] = [
  { event: "landing_view", label: "Landing view", blurb: "Arrived on the landing page", Icon: EyeIcon },
  { event: "trip_form_started", label: "Trip form started", blurb: "First interaction with the planner", Icon: PencilIcon },
  { event: "trip_generated", label: "Trip generated", blurb: "Got a set of destinations back", Icon: SparkleIcon },
  { event: "trip_detail_viewed", label: "Trip detail viewed", blurb: "Opened a destination page", Icon: PinIcon },
  { event: "account_created", label: "Account created", blurb: "Signed up", Icon: UserIcon },
  { event: "email_captured", label: "Email captured", blurb: "Joined the waitlist / newsletter", Icon: MailIcon },
];

// Affiliate partners broken out from affiliate_clicked events via the
// properties->>'partner' value written client-side in BookingHub.tsx.
const AFFILIATE_PARTNERS: { key: string; label: string; Icon: StepIcon }[] = [
  { key: "booking", label: "Booking.com", Icon: BedIcon },
  { key: "skyscanner", label: "Skyscanner", Icon: PlaneIcon },
  { key: "getyourguide", label: "GetYourGuide", Icon: TicketIcon },
];

type StepIcon = (props: { color: string; size?: number }) => React.JSX.Element;

// Start of the rolling window, as an ISO timestamp. Kept out of the component
// body so the (intentionally runtime) clock read isn't flagged as an impure
// call during render — the page is force-dynamic, so it runs per request.
function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return (part / whole) * 100;
}

function fmtPct(value: number | null): string {
  if (value === null) return "—";
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

// ── Daily trend (time series) ────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// 30 UTC day keys (YYYY-MM-DD), oldest → newest, ending today. Kept out of the
// component body so the clock read isn't flagged as an impure render call —
// matches windowStartIso(). UTC, consistent with the count queries above.
function last30DayKeys(): string[] {
  const midnight = new Date(Date.now());
  midnight.setUTCHours(0, 0, 0, 0);
  const base = midnight.getTime();
  const keys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    keys.push(new Date(base - i * DAY_MS).toISOString().slice(0, 10));
  }
  return keys;
}

function shortDay(key: string): string {
  const [, m, d] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

// Per-day counts for one event over the window. Fetches only the created_at
// column server-side (service role) and buckets in JS — raw rows never leave
// the server; only the aggregated number[] is rendered. The limit is a safety
// guard, comfortably above expected 30-day volume for these events.
async function dailyCounts(
  event: string,
  sinceIso: string,
  dayKeys: string[],
): Promise<number[]> {
  const { data, error } = await serviceSupabase
    .from("analytics_events")
    .select("created_at")
    .eq("event_name", event)
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(100000);
  if (error) {
    console.error(`[admin/funnel] trend query failed for ${event}:`, error.message);
  }
  const buckets = new Map<string, number>(dayKeys.map((k) => [k, 0]));
  for (const row of data ?? []) {
    const day = String((row as { created_at: string }).created_at).slice(0, 10);
    const cur = buckets.get(day);
    if (cur !== undefined) buckets.set(day, cur + 1);
  }
  return dayKeys.map((k) => buckets.get(k) ?? 0);
}

// Chart geometry (viewBox units; the SVG scales to its container width).
const CHART_W = 1000;
const CHART_H = 220;
const CHART_PAD_Y = 12; // top/bottom breathing room so lines aren't clipped

// Round a peak up to a tidy axis maximum (1 / 2 / 2.5 / 5 / 10 × 10ⁿ).
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= value) return m * pow;
  }
  return 10 * pow;
}

function pointX(i: number, n: number): number {
  return n <= 1 ? 0 : (i / (n - 1)) * CHART_W;
}

function pointY(v: number, yMax: number): number {
  const usable = CHART_H - 2 * CHART_PAD_Y;
  return CHART_PAD_Y + (1 - v / yMax) * usable;
}

function linePath(values: number[], yMax: number): string {
  return values
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${pointX(i, values.length).toFixed(1)},${pointY(v, yMax).toFixed(1)}`,
    )
    .join(" ");
}

function areaPath(values: number[], yMax: number): string {
  if (values.length === 0) return "";
  const base = CHART_H - CHART_PAD_Y;
  return `${linePath(values, yMax)} L${CHART_W},${base} L0,${base} Z`;
}

export default async function FunnelPage() {
  // ── Access control ─────────────────────────────────────────────────────────
  const sb = await getServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = user?.email?.toLowerCase();
  if (!email || !allowlist.includes(email)) {
    notFound();
  }

  // ── Counts (last 30 days, service role) ────────────────────────────────────
  const since = windowStartIso();
  const counts = await Promise.all(
    FUNNEL.map(async (step) => {
      const { count, error } = await serviceSupabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", step.event)
        .gte("created_at", since);
      if (error) console.error(`[admin/funnel] count failed for ${step.event}:`, error.message);
      return count ?? 0;
    }),
  );

  const top = counts[0];
  const overall = pct(counts[counts.length - 1], top);

  // ── Daily trend (last 30 days, two series, zero-filled) ────────────────────
  const dayKeys = last30DayKeys();
  const trendSince = `${dayKeys[0]}T00:00:00.000Z`;
  const [landingSeries, generatedSeries] = await Promise.all([
    dailyCounts("landing_view", trendSince, dayKeys),
    dailyCounts("trip_generated", trendSince, dayKeys),
  ]);

  // ── Affiliate clicks by partner (last 30 days) ─────────────────────────────
  const affiliateCounts = await Promise.all(
    AFFILIATE_PARTNERS.map(async (p) => {
      const { count, error } = await serviceSupabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_name", "affiliate_clicked")
        .eq("properties->>partner", p.key)
        .gte("created_at", since);
      if (error)
        console.error(
          `[admin/funnel] affiliate count failed for ${p.key}:`,
          error.message,
        );
      return count ?? 0;
    }),
  );

  return (
    <main className="min-h-screen bg-bg px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="mb-10">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent mb-2">
            Triply · Internal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
            Activation funnel
          </h1>
          <p className="mt-2 text-sm text-muted">
            Last {WINDOW_DAYS} days · {top.toLocaleString()} sessions at the top ·
            end-to-end conversion {fmtPct(overall)}
          </p>
        </header>

        {/* Funnel — one tile per step in a single row, drop-off shown in the
            connector between each pair. Equal-width tiles (flex-1) read as a
            grid on wide viewports; below ~lg the row keeps its size and the
            wrapper scrolls horizontally so nothing crushes or wraps. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max items-stretch lg:min-w-0">
            {FUNNEL.map((step, i) => {
              const count = counts[i];
              const prev = i === 0 ? null : counts[i - 1];
              const fromPrev = prev === null ? null : pct(count, prev);
              const fromTop = pct(count, top);
              const dropFromPrev =
                prev === null || prev <= 0 ? null : prev - count;
              const pctLost = fromPrev === null ? null : 100 - fromPrev;

              return (
                <Fragment key={step.event}>
                  {/* Drop-off connector (between tile i-1 and tile i) */}
                  {i > 0 && (
                    <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1.5 px-0.5 sm:w-16">
                      <ChevronRightIcon color="var(--color-muted)" size={16} />
                      {dropFromPrev !== null && dropFromPrev > 0 ? (
                        <div className="flex flex-col items-center rounded-xl bg-accent/10 px-2 py-1 text-center">
                          <span className="text-xs font-bold leading-none tabular-nums text-accent-deep">
                            −{dropFromPrev.toLocaleString()}
                          </span>
                          <span className="mt-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide text-accent-deep/70">
                            {fmtPct(pctLost)} lost
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted/40" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>
                  )}

                  {/* Step tile */}
                  <div
                    className="flex min-h-[210px] w-[140px] flex-1 flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:w-[150px]"
                    style={{
                      boxShadow:
                        "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    {/* Icon + step number */}
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: "var(--color-accent-light)" }}
                        aria-hidden="true"
                      >
                        <step.Icon color="var(--color-accent)" size={18} />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/60">
                        Step {i + 1}
                      </span>
                    </div>

                    {/* Hero metric */}
                    <p className="mt-3 text-4xl font-bold leading-none tabular-nums text-[#1A1A1A] sm:text-5xl">
                      {count.toLocaleString()}
                    </p>

                    {/* Name + description */}
                    <h2 className="mt-3 text-sm font-bold text-[#1A1A1A]">
                      {step.label}
                    </h2>
                    <p className="mt-0.5 text-xs leading-snug text-muted">
                      {step.blurb}
                    </p>

                    {/* Conversion figures, pinned to the bottom */}
                    <div className="mt-auto space-y-1 pt-4">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-muted/70">From previous</span>
                        <span className="font-semibold tabular-nums text-[#0D7377]">
                          {fmtPct(fromPrev)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-muted/70">From landing</span>
                        <span className="font-semibold tabular-nums text-accent">
                          {fmtPct(fromTop)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Daily trend line chart */}
        <TrendChart
          dayKeys={dayKeys}
          landing={landingSeries}
          generated={generatedSeries}
        />

        {/* Affiliate clicks by partner */}
        <AffiliateBreakdown partners={AFFILIATE_PARTNERS} counts={affiliateCounts} />

        <p className="mt-8 text-center text-xs text-muted/60">
          Counts are distinct events, not unique sessions. Signed in as {email}.
        </p>
      </div>
    </main>
  );
}

// ── Daily trend line chart (hand-built inline SVG) ────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-[3px] w-4 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-muted">{label}</span>
    </span>
  );
}

function TrendChart({
  dayKeys,
  landing,
  generated,
}: {
  dayKeys: string[];
  landing: number[];
  generated: number[];
}) {
  const n = dayKeys.length;
  const yMax = niceCeil(Math.max(1, ...landing, ...generated));
  const usable = CHART_H - 2 * CHART_PAD_Y;
  // Gridline / y-tick fractions, top → bottom.
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  // Sparse x-axis labels (~every 5–6 days) so the axis doesn't crowd; always
  // include the most recent day.
  const stride = Math.max(1, Math.ceil(n / 6));
  const xIdx: number[] = [];
  for (let i = 0; i < n; i += stride) xIdx.push(i);
  if (n > 0 && xIdx[xIdx.length - 1] !== n - 1) xIdx.push(n - 1);

  const series = [
    { label: "Landing view", color: "var(--color-teal)", values: landing },
    { label: "Trip generated", color: "var(--color-accent)", values: generated },
  ];

  return (
    <section
      className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Title + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1A1A1A]">
            Daily activity — last 30 days
          </h2>
          <p className="mt-0.5 text-xs text-muted">Events per day (UTC)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <LegendItem color="var(--color-teal)" label="Landing view" />
          <LegendItem color="var(--color-accent)" label="Trip generated" />
        </div>
      </div>

      {/* Plot: y-axis labels + responsive SVG */}
      <div className="mt-5 flex gap-2">
        <div
          className="flex w-9 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-muted/60"
          style={{
            height: CHART_H,
            paddingTop: CHART_PAD_Y,
            paddingBottom: CHART_PAD_Y,
          }}
        >
          {ticks.map((f, idx) => (
            <span key={idx}>{Math.round(f * yMax).toLocaleString()}</span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            width="100%"
            height={CHART_H}
            preserveAspectRatio="none"
            className="block"
            role="img"
            aria-label="Daily landing views and trips generated over the last 30 days"
          >
            {/* Horizontal gridlines (non-scaling stroke keeps them crisp) */}
            {ticks.map((f, idx) => {
              const y = CHART_PAD_Y + (1 - f) * usable;
              return (
                <line
                  key={idx}
                  x1={0}
                  x2={CHART_W}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  opacity={f === 0 ? 0.9 : 0.5}
                />
              );
            })}

            {/* Soft area fills */}
            {series.map((s) => (
              <path
                key={`area-${s.label}`}
                d={areaPath(s.values, yMax)}
                fill={s.color}
                fillOpacity={0.08}
                stroke="none"
              />
            ))}

            {/* Lines on top */}
            {series.map((s) => (
              <path
                key={`line-${s.label}`}
                d={linePath(s.values, yMax)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Sparse x-axis labels, positioned to match their data points */}
          <div className="relative mt-2 h-4">
            {xIdx.map((i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-muted/60"
                style={{ left: `${n <= 1 ? 0 : (i / (n - 1)) * 100}%` }}
              >
                {shortDay(dayKeys[i])}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Affiliate clicks by partner (horizontal bar list) ─────────────────────────

function AffiliateBreakdown({
  partners,
  counts,
}: {
  partners: { key: string; label: string; Icon: StepIcon }[];
  counts: number[];
}) {
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...counts);

  return (
    <section
      className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-[#1A1A1A]">
          Affiliate clicks by partner
        </h2>
        <p className="text-xs text-muted">
          Last {WINDOW_DAYS} days · {total.toLocaleString()} total
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {partners.map((p, i) => {
          const count = counts[i];
          const width = total === 0 ? 0 : Math.max((count / max) * 100, count > 0 ? 4 : 0);
          return (
            <div key={p.key} className="flex items-center gap-3">
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--color-accent-light)" }}
                aria-hidden="true"
              >
                <p.Icon color="var(--color-accent)" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#1A1A1A]">
                    {p.label}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-[#1A1A1A]">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#1a1a1a]/[0.06]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background:
                        "linear-gradient(90deg, var(--color-teal), #14b8b3)",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {total === 0 && (
        <p className="mt-4 text-center text-xs text-muted/60">
          No affiliate clicks in this window yet — they&apos;ll show up here once
          travelers start booking.
        </p>
      )}
    </section>
  );
}

// ── Inline SVG icons (VibeIcons.tsx pattern: { color, size }) ─────────────────

function PinIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5c-4 0-7 3-7 6.8 0 4.7 7 12.2 7 12.2s7-7.5 7-12.2c0-3.8-3-6.8-7-6.8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9.3" r="2.4" fill={color} />
    </svg>
  );
}

function BedIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8v10M3 13h18v5M21 18v-4a3 3 0 0 0-3-3h-7v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="11" r="1.8" fill={color} />
    </svg>
  );
}

function PlaneIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 3.2a1.6 1.6 0 0 1 3 0l.5 6.3 6.5 3.6v2.2l-6.5-1.8-.4 3.6 2.1 1.5v1.7L12 22.8 8.8 23.5v-1.7l2.1-1.5-.4-3.6L4 18.5v-2.2l6.5-3.6.5-6.3z" fill={color} />
    </svg>
  );
}

function TicketIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2 2 0 0 0 0 4v2A1.5 1.5 0 0 1 18.5 17h-13A1.5 1.5 0 0 1 4 15.5v-2a2 2 0 0 0 0-4v-2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 6.5v11" stroke={color} strokeWidth="1.6" strokeDasharray="1.5 2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 12C4 7.5 7.7 5 12 5s8 2.5 9.5 7c-1.5 4.5-5.2 7-9.5 7s-8-2.5-9.5-7z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill={color} />
    </svg>
  );
}

function PencilIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 7l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" />
      <path d="M19 14l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 14z" opacity="0.65" />
    </svg>
  );
}

function UserIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.8" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Connector arrow between funnel tiles (points to the next step).
function ChevronRightIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
