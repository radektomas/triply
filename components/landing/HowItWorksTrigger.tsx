"use client";

import { useState } from "react";
import { HowItWorksModal } from "./HowItWorksModal";

// Small client island that owns the open/close state for the hero's
// "How it works" button. Lets Hero stay a server component — only this
// tiny wrapper ships to the client bundle.

function InfoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <line x1="12" y1="8" x2="12" y2="8" />
    </svg>
  );
}

export function HowItWorksTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0D7377]/40 bg-white/40 backdrop-blur-sm text-[#0D7377] text-sm font-semibold hover:bg-white/80 hover:border-[#0D7377]/60 transition-all cursor-pointer"
      >
        <InfoIcon size={14} />
        How it works
      </button>
      <HowItWorksModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
