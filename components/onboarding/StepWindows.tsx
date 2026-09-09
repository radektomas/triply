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
// arrive when the user reaches this step.
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
  onAdd: (startDate: string, endDate: string) => void;
  onRemove: (id: string) => void;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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
        // A single tapped day: treat as the start of a new pick.
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
      sub="Mark the stretches you could travel. Your first picks land in the nearest one, and when a real deal appears for those dates, you'll be the first to know."
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-6 md:gap-10 items-start max-w-3xl mx-auto w-full">
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
                        <p className="font-semibold text-sm text-[#1a1a1a] truncate">{label}</p>
                        <p className="text-[11px] text-[#1a1a1a]/50 font-medium">
                          {n} {n === 1 ? "night" : "nights"}
                          {w.label ? ` · ${w.label}` : ""}
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
