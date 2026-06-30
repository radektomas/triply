"use client";

import { useState } from "react";

// Daily-trend line/bar chart for the activation funnel. Receives already
// aggregated, zero-filled per-day series (plain number[]) from the server page,
// so this client component only handles presentation + the Line/Bars toggle.

// Chart geometry (viewBox units; the SVG scales to its container width).
const CHART_W = 1000;
const CHART_H = 220;
const CHART_PAD_Y = 12; // top/bottom breathing room so lines aren't clipped

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function shortDay(key: string): string {
  const [, m, d] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

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

type ViewMode = "line" | "bars";

// One small segmented Line / Bars toggle.
function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  const options: { value: ViewMode; label: string }[] = [
    { value: "line", label: "Line" },
    { value: "bars", label: "Bars" },
  ];
  return (
    <div
      className="inline-flex rounded-xl border border-border bg-bg p-0.5"
      role="group"
      aria-label="Chart view"
    >
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-[#1A1A1A]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function TrendChart({
  dayKeys,
  landing,
  generated,
}: {
  dayKeys: string[];
  landing: number[];
  generated: number[];
}) {
  const [mode, setMode] = useState<ViewMode>("line");

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

  // Bars mode: grouped per day (one bar per series, side by side within the
  // day's slot). slotW is the per-day width; each series bar is inset so the
  // two never touch.
  const slotW = n > 0 ? CHART_W / n : CHART_W;
  const innerPad = slotW * 0.18;
  const groupW = Math.max(0, slotW - 2 * innerPad);
  const barW = series.length > 0 ? groupW / series.length : groupW;
  const barBase = CHART_H - CHART_PAD_Y;

  // X position (in %) for an axis label, matched to where its data sits: line
  // points sit at i/(n-1); bars sit centered in their slot at (i+0.5)/n.
  const labelLeft = (i: number): number => {
    if (mode === "bars") return n <= 0 ? 0 : ((i + 0.5) / n) * 100;
    return n <= 1 ? 0 : (i / (n - 1)) * 100;
  };

  return (
    <section
      className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Title + legend + view toggle */}
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
          <ViewToggle mode={mode} onChange={setMode} />
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
            aria-label={`Daily landing views and trips generated over the last 30 days, ${mode} view`}
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

            {mode === "line" ? (
              <>
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
              </>
            ) : (
              /* Grouped per-day bars, one series beside the other */
              series.map((s, sIdx) =>
                s.values.map((v, i) => {
                  if (v <= 0) return null;
                  const y = pointY(v, yMax);
                  const x = i * slotW + innerPad + sIdx * barW;
                  return (
                    <rect
                      key={`bar-${s.label}-${i}`}
                      x={x.toFixed(2)}
                      y={y.toFixed(2)}
                      width={(barW * 0.86).toFixed(2)}
                      height={Math.max(0, barBase - y).toFixed(2)}
                      fill={s.color}
                      fillOpacity={0.9}
                    />
                  );
                }),
              )
            )}
          </svg>

          {/* Sparse x-axis labels, positioned to match their data points */}
          <div className="relative mt-2 h-4">
            {xIdx.map((i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-muted/60"
                style={{ left: `${labelLeft(i)}%` }}
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
