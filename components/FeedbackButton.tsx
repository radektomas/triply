"use client";

import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Give feedback"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-accent-deep text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
