"use client";

import type { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
}

// One heading block per step, same scale as the planner's wizard steps so
// the onboarding reads as the same product surface.
export function StepShell({ eyebrow, title, sub, children }: Props) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        {eyebrow && (
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[#1a1a1a] leading-[1.05] tracking-tight">
          {title}
        </h1>
        {sub && (
          <p className="text-sm md:text-base text-[#1a1a1a]/60 mt-3 font-medium max-w-xl mx-auto">
            {sub}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Small pill used for counters and hints under a step heading. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "teal";
}) {
  const cls =
    tone === "accent"
      ? "bg-accent text-white"
      : tone === "teal"
        ? "bg-teal text-white"
        : "bg-white/70 text-[#1a1a1a]/70 ring-1 ring-black/5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${cls}`}
    >
      {children}
    </span>
  );
}
