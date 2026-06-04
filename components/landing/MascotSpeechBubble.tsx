"use client";

import { useEffect, useState } from "react";

// Playful CTA one-liners the chill mascot rotates through on the landing
// page's "Create a profile" showcase. Order is randomized per-mount (see
// the shuffle effect below) so repeat visits don't see the same opener.
const LINES = [
  "psst… heart a trip already 🥥",
  "these trips won't save themselves",
  "i'm not crying, you're crying 😎",
  "tap a heart, make my day",
  "broke? same. let's plan anyway",
  "don't leave me here alone 🥥",
  "one little heart? 🩷",
  "your next trip is right there →",
  "i've been holding this coconut for hours",
  "free profile. free dreams. free me",
];

function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function MascotSpeechBubble() {
  // Start with the unshuffled order so SSR + first client render are
  // byte-identical (no hydration warning). The effect below replaces it
  // with a shuffled copy on mount, then the rotation timer takes over.
  const [lines, setLines] = useState<string[]>(() => [...LINES]);
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setLines(shuffle(LINES));
  }, []);

  useEffect(() => {
    // Swap-at-midpoint pattern: fade OUT (300ms), swap text while invisible,
    // fade IN. Total visible "change moment" is one clean cross-fade rather
    // than a flash of two strings overlapping. 3.5s between rotations.
    // The nested timeout id is tracked so unmounting mid-fade doesn't
    // leave a pending `setIndex`/`setShow` call against a dead component.
    let swapTimeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setShow(false);
      swapTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length);
        setShow(true);
      }, 300);
    }, 3500);
    return () => {
      clearInterval(interval);
      if (swapTimeout) clearTimeout(swapTimeout);
    };
  }, [lines.length]);

  return (
    // Sits FULLY ABOVE the mascot — `bottom-full` parks the bubble's
    // bottom edge at the parent (mascot wrapper) top edge, and `mb-2` /
    // `sm:mb-3` adds a visible gap so the bubble never overlaps the
    // mascot's head. Right-aligned to the mascot via `right-0`; on sm+
    // an extra `translate-x-4` nudges the bubble a touch further right
    // for a more dynamic composition. `pointer-events-none` so the
    // bubble doesn't intercept clicks on the stage below. Verified to
    // stay inside the 340px mobile stage at base.
    <div className="absolute bottom-full right-0 mb-2 sm:mb-3 sm:translate-x-4 z-20 pointer-events-none">
      {/* Bubble container is permanently opaque — the cross-fade lives on
          the inner <span> below. min-h reserves vertical space so a 1-line
          message doesn't shrink the bubble; flex items-center keeps the
          text centered regardless of line count. `bg-accent` is Triply's
          coral (--color-accent #FF6B47) — same token the heading uses. */}
      <div className="relative bg-accent text-black rounded-2xl px-4 py-2 shadow-md text-sm font-medium max-w-[160px] sm:max-w-[200px] min-h-[2.75rem] text-center flex items-center justify-center">
        <span
          className={`transition-opacity duration-300 ${
            show ? "opacity-100" : "opacity-0"
          }`}
        >
          {lines[index]}
        </span>
        {/* Speech-bubble tail — rotated 12px square anchored to the
            bubble's bottom-center, pointing straight DOWN toward the
            mascot's head below. (Moved from bottom-LEFT now that the
            bubble sits above-and-right-aligned with the mascot rather
            than diagonally up-right of it.) Same `bg-accent` keeps the
            seam invisible; the bubble owns the shadow so the tail's
            exposed corners stay clean. */}
        <div
          aria-hidden="true"
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rotate-45"
        />
      </div>
    </div>
  );
}
