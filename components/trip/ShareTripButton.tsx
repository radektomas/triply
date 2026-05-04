"use client";

import { useCallback, useRef, useState } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

function ShareIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M 5 12 l 4 4 L 19 6" />
    </svg>
  );
}

interface Props {
  destination: string;
  budget: number;
  nights: number;
}

export function ShareTripButton({ destination, budget, nights }: Props) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCopiedFor = useCallback((ms: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), ms);
  }, []);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = `Check out this trip to ${destination} on Triply`;
    const text = `${nights} ${nights === 1 ? "night" : "nights"} in ${destination} for ${budget}€ — found via Triply`;

    // Mobile / native share sheet first
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled (AbortError) — do nothing, don't fall through.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Other failures (e.g. share unsupported for this payload) → fall through to clipboard.
      }
    }

    // Desktop / fallback: clipboard
    try {
      await navigator.clipboard.writeText(url);
      showCopiedFor(2000);
      return;
    } catch {
      // Older browsers without async clipboard — last-resort textarea + execCommand
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        showCopiedFor(2000);
      } catch {
        // give up silently
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }, [destination, budget, nights, showCopiedFor]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? "Link copied to clipboard" : "Share this trip"}
        className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/25 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        <span
          className="inline-flex items-center justify-center transition-transform duration-200"
          style={{ transform: copied ? "scale(1.1)" : "scale(1)" }}
        >
          {copied ? <CheckIcon /> : <ShareIcon />}
        </span>
        <span>{copied ? "Copied" : "Share"}</span>
      </button>

      {/* Toast — pops below the button when clipboard copy succeeds. Skipped on
          native share since the OS already provides feedback. */}
      <span
        role="status"
        aria-live="polite"
        className={`pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap bg-black/85 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg transition-opacity duration-150 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        Link copied to clipboard
      </span>
    </div>
  );
}
