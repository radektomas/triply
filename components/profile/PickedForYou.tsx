"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PickCard, type Pick } from "./PickCard";
import { GeneratePicks } from "./GeneratePicks";
import { track } from "@/lib/analytics";
import type { TripInput } from "@/lib/types";

interface Props {
  picks: Pick[];
  /** Highlight picks from this generation (the dashboard landed from it). */
  highlight: boolean;
  input: TripInput;
  remaining: number;
  firstName: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// What the section says while the planner works — cycles every ~1.8s.
const SEARCHING_LINES = [
  "Checking your free windows…",
  "Matching your vibe…",
  "Comparing prices from your airport…",
  "Skipping the obvious ones…",
  "Almost there…",
];

/** Give up waiting for the new set to render after this long. */
const SWAP_TIMEOUT_MS = 20_000;

// "Find me 3 more" without leaving the page: the three cards dim and
// shimmer while /api/trips runs, then the URL moves to ?picks=<new trip>,
// the server re-renders this section with the new set, and the cards swap
// with an exit/enter animation. No full-screen loading overlay.
export function PickedForYou({ picks, highlight, input, remaining, firstName }: Props) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<{ heading: string; sub: string } | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const busyRef = useRef(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tripId = picks[0]?.tripId ?? null;

  // The new set has arrived when the trip id changes under us (adjusting
  // state during render, per React's prop-change pattern).
  const [seenTripId, setSeenTripId] = useState(tripId);
  if (tripId !== seenTripId) {
    setSeenTripId(tripId);
    if (searching) setSearching(false);
  }

  useEffect(() => {
    if (!searching) return;
    const t = setInterval(
      () => setLineIdx((i) => Math.min(i + 1, SEARCHING_LINES.length - 1)),
      1800,
    );
    return () => clearInterval(t);
  }, [searching]);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    [],
  );

  async function run() {
    if (busyRef.current || remaining <= 0) return;
    busyRef.current = true;
    setError(null);
    setLineIdx(0);
    setSearching(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        let body: { stage?: string; detail?: string; message?: string } = {};
        try {
          body = await res.json();
        } catch {
          // keep empty
        }
        setSearching(false);
        setError(
          res.status === 429 || body.stage === "rate_limit"
            ? {
                heading: body.stage === "rate_limit" ? "Daily limit reached." : "You're going a bit fast.",
                sub: body.detail || body.message || "Give it a moment and try again.",
              }
            : {
                heading: "The planner didn't answer.",
                sub: "Please try again in a moment.",
              },
        );
        return;
      }
      const data = (await res.json()) as { tripId: string };
      track("trip_generated", {
        vibe: input.vibe,
        budget: input.budget,
        travelers: input.travelers,
        origin: input.originCity,
        source: "dashboard",
      });
      // Same page, new query → the server streams the new picks into these
      // props; `searching` clears when the trip id changes.
      router.replace(`/profile?picks=${data.tripId}`, { scroll: false });
      swapTimer.current = setTimeout(() => setSearching(false), SWAP_TIMEOUT_MS);
    } catch {
      setSearching(false);
      setError({ heading: "Something glitched.", sub: "Please try again in a moment." });
    } finally {
      busyRef.current = false;
    }
  }

  const heading = picks.length
    ? `Places that fit you, ${firstName}.`
    : `Let's find your first places, ${firstName}.`;

  return (
    <section className="mb-10" aria-busy={searching}>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
            Picked for you
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">{heading}</h2>
          <div className="mt-1 max-w-xl min-h-10" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {searching ? (
                <motion.p
                  key={`line-${lineIdx}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, transition: { duration: 0.14 } }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="text-sm font-semibold text-accent"
                >
                  {SEARCHING_LINES[lineIdx]}
                </motion.p>
              ) : (
                <motion.p
                  key="idle"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  className="text-sm text-muted"
                >
                  Picked from your vibes, budget, home airport and free windows. Heart one and it
                  joins your watchlist, so you get an email when a good price shows up.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
        {picks.length > 0 && <GeneratePicks busy={searching} remaining={remaining} onClick={run} />}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3"
        >
          <p className="text-sm text-rose-700">
            <span className="font-semibold">{error.heading}</span> {error.sub}
          </p>
          <button
            type="button"
            onClick={() => void run()}
            className="text-sm font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {picks.length === 0 ? (
        searching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="relative h-80 rounded-3xl bg-white border border-border shadow-sm overflow-hidden"
              >
                <div className="h-48 bg-teal/10" />
                <Shimmer reduceMotion={!!reduceMotion} delay={i * 0.15} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-border shadow-sm px-6 py-10 text-center">
            <p className="font-display text-xl font-bold text-[#1A1A1A]">No picks yet.</p>
            <p className="text-sm text-muted mt-1 mb-5 max-w-md mx-auto">
              One tap and the planner comes back with three places that fit your profile.
            </p>
            <GeneratePicks busy={searching} remaining={remaining} onClick={run} label="Find my first picks" />
          </div>
        )
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tripId ?? "none"}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.985, transition: { duration: 0.22, ease: EASE } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch"
            style={{ willChange: "transform, opacity" }}
          >
            {picks.map((p, i) => (
              <motion.div
                key={`${p.tripId ?? "x"}-${p.destination.id}`}
                animate={
                  reduceMotion
                    ? { opacity: searching ? 0.6 : 1 }
                    : { opacity: searching ? 0.55 : 1, scale: searching ? 0.985 : 1 }
                }
                transition={{ duration: 0.35, ease: EASE }}
                className="relative h-full"
                style={{ willChange: "transform, opacity" }}
              >
                <div className={searching ? "pointer-events-none h-full" : "h-full"}>
                  <PickCard pick={p} index={i} highlight={highlight} />
                </div>
                <AnimatePresence>
                  {searching && <Shimmer key="shimmer" reduceMotion={!!reduceMotion} delay={i * 0.15} rounded />}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}

/** A soft light band sweeping across the card — transform only. */
function Shimmer({ reduceMotion, delay, rounded }: { reduceMotion: boolean; delay: number; rounded?: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${rounded ? "rounded-3xl" : ""}`}
    >
      {!reduceMotion && (
        <motion.div
          className="absolute inset-y-0 -left-1/2 w-1/2"
          style={{
            background:
              "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0.0) 70%, transparent 100%)",
            willChange: "transform",
          }}
          animate={{ x: ["0%", "400%"] }}
          transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.3, delay }}
        />
      )}
    </motion.div>
  );
}
