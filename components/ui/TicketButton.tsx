"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  size?: "md" | "lg";
  serial?: string;
  className?: string;
}

const sizes = {
  md: "px-10 py-5 text-lg",
  lg: "px-14 py-7 text-xl md:text-2xl",
};

const DESTINATIONS = ["LIS", "BCN", "ROM", "AMS", "IST", "ATH"];
const TYPE_MS = 180;
const DELETE_MS = 120;
const HOLD_MS = 2200;
const EMPTY_PAUSE_MS = 400;

function RotatingDestination() {
  const [displayed, setDisplayed] = useState("LIS");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"hold" | "deleting" | "typing">("hold");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === "hold") {
      timeout = setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), DELETE_MS);
      } else {
        timeout = setTimeout(() => {
          setIndex((i) => (i + 1) % DESTINATIONS.length);
          setPhase("typing");
        }, EMPTY_PAUSE_MS);
      }
    } else if (phase === "typing") {
      const target = DESTINATIONS[index];
      if (displayed.length < target.length) {
        timeout = setTimeout(
          () => setDisplayed(target.slice(0, displayed.length + 1)),
          TYPE_MS
        );
      } else {
        setPhase("hold");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, index]);

  return (
    <span className="inline-flex items-baseline font-mono text-[11px] tracking-[0.15em] text-white/70 not-italic">
      <span>PRG ✈ </span>
      <span className="inline-block min-w-[2.4em] text-white">{displayed}</span>
      <span className="ml-0.5 inline-block w-[1px] self-stretch bg-white/70 animate-cursor-blink" aria-hidden="true" />
    </span>
  );
}

export function TicketButton({
  children,
  href,
  onClick,
  size = "lg",
  serial = "BOARDING · 001",
  className = "",
}: Props) {
  const ticket = (
    <span
      className={[
        "group relative inline-flex flex-col items-center justify-center rounded-md",
        "font-bold italic tracking-tight text-white",
        "bg-teal-800 hover:bg-teal-900",
        "shadow-xl hover:shadow-2xl hover:-translate-y-1",
        "active:translate-y-0 active:shadow-lg",
        "transition-all duration-200 cursor-pointer",
        "pr-[22%]",
        sizes[size],
        className,
      ].join(" ")}
    >
      {/* Stub separator — dashed vertical line on right */}
      <span className="absolute right-[22%] top-3 bottom-3 border-l border-dashed border-white/40 pointer-events-none" aria-hidden="true" />

      {/* Serial / flavor text */}
      {serial && (
        <span className="relative text-[10px] font-mono not-italic tracking-[0.2em] text-white/60 uppercase mb-1">
          {serial}
        </span>
      )}

      {/* Rotating destination code */}
      <span className="relative mb-2">
        <RotatingDestination />
      </span>

      {/* Main CTA */}
      <span className="relative flex items-center gap-2">{children}</span>

      {/* Stub section with barcode */}
      <span
        className="absolute right-0 top-0 bottom-0 w-[22%] flex items-center justify-center bg-teal-900/40 rounded-r-md pointer-events-none"
        aria-hidden="true"
      >
        <span className="absolute left-0 top-2 bottom-2 w-px bg-black/10" />
        <span className="flex items-stretch gap-[3px] h-[55%] py-1">
          <span className="w-[2px] bg-white/70 rounded-sm" />
          <span className="w-[1px] bg-white/50 rounded-sm" />
          <span className="w-[3px] bg-white/70 rounded-sm" />
          <span className="w-[1px] bg-white/50 rounded-sm" />
          <span className="w-[2px] bg-white/70 rounded-sm" />
          <span className="w-[1px] bg-white/50 rounded-sm" />
          <span className="w-[2px] bg-white/70 rounded-sm" />
        </span>
      </span>

      {/* Shine overlay — triggers on group hover */}
      <span
        className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.18) 50%, transparent 75%)",
        }}
      />
    </span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {ticket}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-block bg-transparent border-0 p-0 cursor-pointer"
    >
      {ticket}
    </button>
  );
}
