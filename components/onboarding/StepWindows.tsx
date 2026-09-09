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

/** Anonymous Gregorian algorithm — Easter Sunday for a year. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

interface Preset {
  key: string;
  emoji: string;
  title: string;
  blurb: string;
  start: Date;
  end: Date;
}

/** The breaks most people actually travel in, next occurrence only. */
function buildPresets(today: Date): Preset[] {
  const y = today.getFullYear();
  const out: Preset[] = [];
  const future = (d: Date) => d.getTime() > today.getTime() + 86_400_000;

  // Next weekend that is at least 2 days away: Fri → Mon.
  const fri = new Date(today);
  fri.setDate(fri.getDate() + ((5 - fri.getDay() + 7) % 7 || 7));
  if (differenceInDays(fri, today) < 2) fri.setDate(fri.getDate() + 7);
  out.push({
    key: "weekend",
    emoji: "⚡",
    title: "Next weekend",
    blurb: "Fri → Mon, a quick escape",
    start: fri,
    end: addDays(fri, 3),
  });

  // A whole week off, first Saturday of next month.
  const nm = new Date(y, today.getMonth() + 1, 1);
  nm.setDate(nm.getDate() + ((6 - nm.getDay() + 7) % 7));
  out.push({
    key: "week",
    emoji: "🧳",
    title: `A week in ${nm.toLocaleDateString("en-GB", { month: "long" })}`,
    blurb: "Sat → Sat, proper holiday",
    start: nm,
    end: addDays(nm, 7),
  });

  for (const year of [y, y + 1]) {
    const easter = easterSunday(year);
    const eStart = addDays(easter, -3);
    if (future(eStart) && !out.some((p) => p.key === "easter")) {
      out.push({
        key: "easter",
        emoji: "🐣",
        title: "Easter",
        blurb: "Thu → Tue, spring break",
        start: eStart,
        end: addDays(easter, 2),
      });
    }
    const may = new Date(year, 3, 30);
    if (future(may) && !out.some((p) => p.key === "may")) {
      out.push({
        key: "may",
        emoji: "🌸",
        title: "May holidays",
        blurb: "Apr 30 → May 4",
        start: may,
        end: new Date(year, 4, 4),
      });
    }
    const july = new Date(year, 6, 4);
    if (future(july) && !out.some((p) => p.key === "july")) {
      out.push({
        key: "july",
        emoji: "☀️",
        title: "Summer, early July",
        blurb: "Jul 4 → Jul 11",
        start: july,
        end: new Date(year, 6, 11),
      });
    }
    const aug = new Date(year, 7, 15);
    if (future(aug) && !out.some((p) => p.key === "august")) {
      out.push({
        key: "august",
        emoji: "🏖️",
        title: "Summer, mid August",
        blurb: "Aug 15 → Aug 22",
        start: aug,
        end: new Date(year, 7, 22),
      });
    }
    const autumn = new Date(year, 9, 24);
    if (future(autumn) && !out.some((p) => p.key === "autumn")) {
      out.push({
        key: "autumn",
        emoji: "🍂",
        title: "Autumn break",
        blurb: "Oct 24 → Oct 31",
        start: autumn,
        end: new Date(year, 9, 31),
      });
    }
    const xmas = new Date(year, 11, 20);
    if (future(xmas) && !out.some((p) => p.key === "xmas")) {
      out.push({
        key: "xmas",
        emoji: "🎄",
        title: "Christmas & New Year",
        blurb: "Dec 20 → Jan 3",
        start: xmas,
        end: new Date(year + 1, 0, 3),
      });
    }
  }

  return out
    .filter((p) => future(p.start))
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 7);
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

// ── component ───────────────────────────────────────────────────────────────

export function StepWindows({ windows, adding, onAdd, onRemove }: Props) {
  const reduceMotion = useReducedMotion();
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  const { today, maxDate } = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const m = new Date(t);
    m.setMonth(m.getMonth() + WINDOW_HORIZON_MONTHS);
    return { today: t, maxDate: m };
  }, []);

  const presets = useMemo(() => buildPresets(today), [today]);

  const full = windows.length >= MAX_TRAVEL_WINDOWS;
  const complete = !!range?.from && !!range?.to && range.from < range.to;
  const nights = complete ? differenceInDays(range!.to!, range!.from!) : 0;

  const byDates = useMemo(() => {
    const m = new Map<string, TravelWindow>();
    for (const w of windows) m.set(`${w.startDate}|${w.endDate}`, w);
    return m;
  }, [windows]);

  function togglePreset(p: Preset) {
    const s = toIso(p.start);
    const e = toIso(p.end);
    const existing = byDates.get(`${s}|${e}`);
    if (existing) {
      onRemove(existing.id);
    } else if (!full) {
      onAdd(s, e, p.title);
    }
  }

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
      sub="Tap the breaks you could travel in. Your first picks land in the nearest one, and when a real deal shows up for those dates, you'll hear about it first."
    >
      {/* Quick picks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55">
            Quick picks
          </p>
          <Pill tone={windows.length ? "teal" : "neutral"}>
            {windows.length} / {MAX_TRAVEL_WINDOWS}
          </Pill>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {presets.map((p, i) => {
            const s = toIso(p.start);
            const e = toIso(p.end);
            const active = byDates.has(`${s}|${e}`);
            const n = differenceInDays(p.end, p.start);
            const disabled = !active && full;
            return (
              <motion.button
                key={p.key}
                type="button"
                aria-pressed={active}
                disabled={disabled || adding}
                onClick={() => togglePreset(p)}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: disabled ? 0.45 : 1, y: 0, scale: active ? 1.03 : 1 }}
                transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduceMotion || disabled || active ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion || disabled ? undefined : { scale: 0.96 }}
                className={`relative text-left rounded-2xl p-4 cursor-pointer select-none transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  active ? "shadow-lg" : "hover:shadow-md"
                } ${disabled ? "cursor-not-allowed" : ""}`}
                style={{
                  backgroundColor: active ? "#0D7377" : "rgba(255,255,255,0.72)",
                  color: active ? "#ffffff" : "#1a1a1a",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl leading-none">{p.emoji}</span>
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        key="check"
                        initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={reduceMotion ? undefined : { scale: 0.4, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 520, damping: 26 }}
                        className="w-6 h-6 rounded-full bg-white text-teal flex items-center justify-center shadow-sm"
                        aria-hidden="true"
                      >
                        <CheckIcon />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="font-display font-bold text-base leading-tight mt-3">{p.title}</p>
                <p
                  className="text-[11px] font-medium mt-1 tabular-nums"
                  style={{ color: active ? "rgba(255,255,255,0.8)" : "rgba(26,26,26,0.5)" }}
                >
                  {formatWindow({ startDate: s, endDate: e }).range} · {n}n
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Year at a glance */}
      <YearStrip windows={sorted} today={today} />

      {/* Custom dates */}
      <div className="max-w-[420px] mx-auto w-full">
        {!showCalendar ? (
          <button
            type="button"
            onClick={() => setShowCalendar(true)}
            disabled={full}
            className="w-full rounded-2xl border-2 border-dashed border-[#1a1a1a]/15 bg-white/40 px-5 py-4 text-sm font-semibold text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-white/70 hover:border-teal/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Pick my own dates
          </button>
        ) : (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-4"
          >
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCalendar(false);
                    setRange(undefined);
                  }}
                  className="rounded-full px-3 py-2 text-xs font-semibold text-[#1a1a1a]/55 hover:text-[#1a1a1a] cursor-pointer"
                >
                  Close
                </button>
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
          </motion.div>
        )}
      </div>

      {/* List */}
      {sorted.length > 0 && (
        <div className="max-w-xl mx-auto w-full">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55 mb-3">
            Your windows
          </p>
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
        </div>
      )}
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
          Empty so far. Tap a quick pick above and watch it land here.
        </p>
      )}
    </div>
  );
}
