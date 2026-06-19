"use client";

import { useEffect, useState } from "react";

// Decoupled "trip generation is running" signal. The form (which owns the
// loading state and the full-screen LoadingOverlay) broadcasts on/off via a
// window CustomEvent — same decoupling pattern as `triply:prefill` — so the
// ambient HERO mascot, which lives in a different part of the tree and has no
// access to the form's state, can pause its loops while the overlay covers the
// screen. (The FORM mascots already receive `loading` as a prop and don't need
// this.)
const GENERATION_EVENT = "triply:generating";

interface GenerationDetail {
  active?: boolean;
}

/** Fire from the form when generation starts (true) / ends (false). */
export function setGenerationActive(active: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GenerationDetail>(GENERATION_EVENT, { detail: { active } }),
  );
}

/** Subscribe to the generation signal. Returns true while a trip is generating. */
export function useGenerationActive(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      setActive(Boolean((e as CustomEvent<GenerationDetail>).detail?.active));
    };
    window.addEventListener(GENERATION_EVENT, handler);
    return () => window.removeEventListener(GENERATION_EVENT, handler);
  }, []);
  return active;
}
