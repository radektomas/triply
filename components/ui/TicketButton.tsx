"use client";

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
        "shadow-xl hover:shadow-2xl hover:-translate-y-1",
        "active:translate-y-0 active:shadow-lg",
        "transition-all duration-200 cursor-pointer",
        sizes[size],
        className,
      ].join(" ")}
      style={{
        background: "linear-gradient(135deg, #FF6B47 0%, #FF8E6A 45%, #FF6B47 100%)",
      }}
    >
      {/* Stub separator — dashed vertical line on left */}
      <span className="absolute left-[18%] top-3 bottom-3 border-l border-dashed border-white/35 pointer-events-none" />

      {/* Serial / flavor text */}
      {serial && (
        <span className="relative text-[10px] font-mono not-italic tracking-[0.2em] text-white/60 uppercase mb-1.5">
          {serial}
        </span>
      )}

      {/* Main CTA */}
      <span className="relative flex items-center gap-2">{children}</span>

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
