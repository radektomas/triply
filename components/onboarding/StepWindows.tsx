"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInDays } from "date-fns";
import {
  MAX_TRAVEL_WINDOWS,
  MAX_WINDOW_NIGHTS,
  WINDOW_HORIZON_MONTHS,
  formatWindow,
  type TravelWindow,
} from "@/lib/traveler";
import { StepShell, Pill } from "./StepShell";

// Same on-demand load as the planner: react-day-picker + its stylesheet only
// arrive when the user opens the custom-dates picker.
const TripCalendar = dynamic(
  () => import("@/components/landing/TripCalendar").then((m) => m.TripCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] w-full">
        <div className="h-7 w-7 rounded-full border-2 border-[#FF6B47]/30 border-t-[#FF6B47] animate-spin" />
      </div>
    ),
  },
);

interface Props {
  windows: TravelWindow[];
  adding: boolean;
  onAdd: (startDate: string, endDate: string, label?: string) => void;
  onRemove: (id: string) => void;
}

// ── date helpers ────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ── component ───────────────────────────────────────────────────────────────

export function StepWindows({ windows, adding, onAdd, onRemove }: Props) {
  const reduceMotion = useReducedMotion();
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const { today, maxDate } = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const m = new Date(t);
    m.setMonth(m.getMonth() + WINDOW_HORIZON_MONTHS);
    return { today: t, maxDate: m };
  }, []);

  const full = windows.length >= MAX_TRAVEL_WINDOWS;
  const complete = !!range?.from && !!range?.to && range.from < range.to;
  const nights = complete ? differenceInDays(range!.to!, range!.from!) : 0;

  function handleSelect(next: DateRange | undefined) {
    if (next?.from && next?.to) {
      const n = differenceInDays(next.to, next.from);
      if (n > MAX_WINDOW_NIGHTS) {
        setRange({ from: next.from, to: addDays(next.from, MAX_WINDOW_NIGHTS) });
        return;
      }
      if (n === 0) {
        setRange({ from: next.from, to: undefined });
        return;
      }
    }
    setRange(next);
  }

  function commit() {
    if (!complete || full) return;
    onAdd(toIso(range!.from!), toIso(range!.to!));
    setRange(undefined);
  }

  const sorted = [...windows].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <StepShell
      eyebrow="Step 4 · Free windows"
      title={
        <>
          When can you <span className="text-teal">get away?</span>
        </>
      }
      sub="Mark the stretches you could travel. Your first picks land in the nearest one, and when a real deal shows up for those dates, you'll hear about it first."
    >
      {/* Year at a glance */}
      <YearStrip windows={sorted} today={today} />

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6 md:gap-10 items-start max-w-3xl mx-auto w-full">
        {/* Calendar */}
        <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-4 mx-auto w-full max-w-[360px]">
          <TripCalendar
            selected={range}
            onSelect={handleSelect}
            today={today}
            maxDate={maxDate}
            onClear={() => setRange(undefined)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-[#1a1a1a]/55 font-medium tabular-nums">
              {complete
                ? `${nights} ${nights === 1 ? "night" : "nights"} selected`
                : range?.from
                  ? "Now tap the last day"
                  : "Tap a first day"}
            </p>
            <button
              type="button"
              onClick={commit}
              disabled={!complete || full || adding}
              className="rounded-full bg-accent hover:bg-accent-deep text-white text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Add window
            </button>
          </div>
        </div>

        {/* List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55">
              Your windows
            </p>
            <Pill tone={windows.length ? "teal" : "neutral"}>
              {windows.length} / {MAX_TRAVEL_WINDOWS}
            </Pill>
          </div>

          {sorted.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[#1a1a1a]/12 bg-white/40 px-5 py-8 text-center">
              <p className="font-display text-lg font-bold text-[#1a1a1a]/70">Nothing yet.</p>
              <p className="text-sm text-[#1a1a1a]/50 mt-1">
                A long weekend, a week in autumn, the days between jobs — anything counts. Skip if you&apos;re not sure.
              </p>
            </div>
          ) : (
          <motion.ul layout className="space-y-2" aria-label="Travel windows">
            <AnimatePresence initial={false}>
              {sorted.map((w) => {
                const { range: label, nights: n } = formatWindow(w);
                const pending = w.id.startsWith("tmp-");
                return (
                  <motion.li
                    key={w.id}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: pending ? 0.6 : 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -16, transition: { duration: 0.16 } }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-black/5 shadow-sm px-4 py-3"
                  >
                    <span className="w-9 h-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center font-display font-bold text-sm tabular-nums shrink-0">
                      {n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#1a1a1a] truncate">
                        {w.label ?? label}
                      </p>
                      <p className="text-[11px] text-[#1a1a1a]/50 font-medium">
                        {w.label ? `${label} · ` : ""}
                        {n} {n === 1 ? "night" : "nights"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(w.id)}
                      disabled={pending}
                      aria-label={`Remove window ${label}`}
                      className="w-7 h-7 rounded-full text-[#1a1a1a]/40 hover:text-[#1a1a1a] hover:bg-[#F5F5F5] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <XIcon />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
          )}
        </div>
      </div>
    </StepShell>
  );
}

// ── 12-month strip ───────────────────────────────────────────────────────────
// A track of the next twelve months; each window becomes a coral bar spanning
// its dates. Pure layout on mount, then bars fade/scale in — nothing animates
// a layout property.

function YearStrip({ windows, today }: { windows: TravelWindow[]; today: Date }) {
  const reduceMotion = useReducedMotion();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 12, 1);
  const span = end.getTime() - start.getTime();
  const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - start.getTime()) / span) * 100));

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-GB", { month: "short" }) };
  });

  const bars = windows
    .map((w) => {
      const s = fromIso(w.startDate);
      const e = fromIso(w.endDate);
      if (e <= start || s >= end) return null;
      const left = pct(s);
      const width = Math.max(1.2, pct(e) - left);
      return { id: w.id, left, width };
    })
    .filter((b): b is { id: string; left: number; width: number } => b !== null);

  return (
    <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm px-4 sm:px-5 pt-4 pb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55 mb-3">
        Your year
      </p>
      <div className="relative h-8 rounded-full bg-[#1a1a1a]/[0.06] overflow-hidden">
        {/* month separators */}
        {months.slice(1).map((m, i) => (
          <span
            key={m.key}
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-[#1a1a1a]/[0.07]"
            style={{ left: `${((i + 1) / 12) * 100}%` }}
          />
        ))}
        {/* today marker */}
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 w-0.5 bg-teal/70"
          style={{ left: `${pct(today)}%` }}
        />
        <AnimatePresence initial={false}>
          {bars.map((b) => (
            <motion.span
              key={b.id}
              initial={reduceMotion ? false : { opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scaleY: 0.4 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="absolute top-1.5 bottom-1.5 rounded-full bg-accent shadow-[0_2px_8px_rgba(255,107,71,0.45)]"
              style={{ left: `${b.left}%`, width: `${b.width}%`, transformOrigin: "center" }}
            />
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-2 grid grid-cols-12 text-[10px] font-semibold uppercase tracking-wider text-[#1a1a1a]/45">
        {months.map((m, i) => (
          <span key={m.key} className={i % 2 === 1 ? "hidden sm:block" : ""}>
            {m.label}
          </span>
        ))}
      </div>
      {bars.length === 0 && (
        <p className="mt-2 text-xs text-[#1a1a1a]/50 font-medium">
          Empty so far. Pick dates on the calendar and watch them land here.
        </p>
      )}
    </div>
  );
}
