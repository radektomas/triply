"use client";

import { VIBE_BY_VALUE } from "@/components/onboarding/vibePresets";

// Tiny client island: the vibe presets carry SVG icon components, which are
// client modules, so the server-rendered profile section delegates here.
export function VibeChip({ vibe }: { vibe: string }) {
  const p = VIBE_BY_VALUE[vibe];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: p?.color ?? "#0D7377" }}
    >
      {p && <p.Icon color="#fff" size={13} />}
      {p?.label ?? vibe}
    </span>
  );
}
