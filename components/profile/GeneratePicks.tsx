"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";
import { ErrorOverlay } from "@/components/landing/ErrorOverlay";
import { track } from "@/lib/analytics";
import type { TripInput } from "@/lib/types";

interface Props {
  /** Ready-made request for /api/trips, built server-side from the
   *  traveler profile (budget, lead vibe, party, home city, nearest window,
   *  visited countries to avoid). */
  input: TripInput;
  /** Daily generations left, from checkGenerationLimit. */
  remaining: number;
  label?: string;
  variant?: "primary" | "quiet";
}

// One button: ask the planner for three more places that fit this
// traveler, then land back on the dashboard with them highlighted.
export function GeneratePicks({ input, remaining, label = "Find me 3 more", variant = "primary" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [redirect, setRedirect] = useState<string | null>(null);
  const [err, setErr] = useState<{ heading: string; sub: string } | null>(null);
  const busyRef = useRef(false);
  const exhausted = remaining <= 0;

  async function run() {
    if (busyRef.current || exhausted) return;
    busyRef.current = true;
    setErr(null);
    setLoading(true);
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
        setLoading(false);
        busyRef.current = false;
        setErr(
          res.status === 429 || body.stage === "rate_limit"
            ? {
                heading: body.stage === "rate_limit" ? "Daily limit reached" : "You're going a bit fast",
                sub: body.detail || body.message || "Give it a moment and try again.",
              }
            : {
                heading: "Our trip planner didn't respond",
                sub: "Couldn't reach the planner right now. Please try again in a moment.",
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
      setRedirect(`/profile?picks=${data.tripId}`);
    } catch {
      setLoading(false);
      busyRef.current = false;
      setErr({ heading: "Something glitched", sub: "Please try again in a moment." });
    }
  }

  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent-deep text-white text-sm font-semibold px-5 py-2.5 shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      : "inline-flex items-center gap-2 rounded-full bg-white border border-border text-[#1A1A1A] text-sm font-semibold px-4 py-2 hover:bg-accent-light hover:text-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={exhausted || loading}
        title={exhausted ? "You've used today's generations — resets at midnight UTC." : undefined}
        className={cls}
      >
        <span aria-hidden>✦</span>
        {exhausted ? "Back tomorrow for more" : label}
      </button>

      {loading && (
        <LoadingOverlay
          loadingComplete={redirect !== null}
          onReady={() => {
            if (redirect) {
              router.replace(redirect);
              router.refresh();
            }
          }}
        />
      )}
      {err && (
        <ErrorOverlay
          heading={err.heading}
          sub={err.sub}
          onRetry={() => {
            setErr(null);
            void run();
          }}
          onDismiss={() => setErr(null)}
        />
      )}
    </>
  );
}
