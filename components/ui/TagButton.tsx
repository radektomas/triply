"use client";

import type { ReactNode } from "react";

const CREAM = "#FFE4CC";

const variants = {
  primary: {
    bg: "#FF6B47",
    shadow: "0 10px 30px rgba(255,107,71,0.45), 0 4px 12px rgba(0,0,0,0.15)",
  },
  secondary: {
    bg: "#0D7377",
    shadow: "0 10px 30px rgba(13,115,119,0.45), 0 4px 12px rgba(0,0,0,0.15)",
  },
};

const sizes = {
  md: "px-8 py-4 text-lg",
  lg: "px-10 py-5 text-xl md:px-12 md:py-6 md:text-2xl",
};

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function TagButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "lg",
  disabled = false,
  className = "",
}: Props) {
  const v = variants[variant];

  const tag = (
    <span
      className={[
        "relative inline-flex items-center rounded-xl font-bold italic tracking-tight",
        "rotate-[3deg] transition-all duration-300",
        sizes[size],
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:rotate-0 hover:scale-105 active:scale-95",
        className,
      ].join(" ")}
      style={{ backgroundColor: v.bg, color: CREAM, boxShadow: v.shadow }}
    >
      {/* Left perforation */}
      <span
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full pointer-events-none"
        style={{ backgroundColor: CREAM }}
      />
      {/* Right perforation */}
      <span
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full pointer-events-none"
        style={{ backgroundColor: CREAM }}
      />
      <span className="relative">{children}</span>
    </span>
  );

  if (href && !disabled) {
    return (
      <a href={href} className="inline-block">
        {tag}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className="inline-block bg-transparent border-0 p-0 cursor-pointer disabled:cursor-not-allowed"
    >
      {tag}
    </button>
  );
}
