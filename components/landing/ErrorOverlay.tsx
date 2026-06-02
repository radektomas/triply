"use client";

import { TriplyMascot } from "@/components/triply/TriplyMascot";

interface Props {
  /** Headline shown next to the lost mascot. Caller composes per-case copy. */
  heading: string;
  /** Sub-line below the headline. */
  sub: string;
  onRetry: () => void;
  onDismiss: () => void;
}

// Full-screen failure state. Mirrors LoadingOverlay's backdrop + fade so the
// shift from "Triply is dreaming of beaches" to "Triply got lost" feels like
// the same surface, not a different screen. The mascot's `lost` state ignores
// bubbleText, so the copy is rendered beside the mascot — same pattern as the
// 404 page.
//
// Copy is supplied by the caller (TripForm) so we can speak specifically to
// each failure stage (timeout vs unreachable vs non-2xx vs generic) without
// the overlay growing a variant enum that has to be kept in sync.
export function ErrorOverlay({ heading, sub, onRetry, onDismiss }: Props) {
  const copy = { heading, sub };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden animate-fade-in-overlay"
      style={{
        background:
          "linear-gradient(160deg, #0F0805 0%, #2C1406 35%, #451E09 65%, #0F0805 100%)",
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="error-overlay-heading"
    >
      {/* Ambient blobs — identical treatment to LoadingOverlay so the two
          screens read as the same surface. */}
      <div
        className="absolute rounded-full opacity-20 animate-mesh-1 pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, #FF6B47 0%, transparent 70%)",
          top: "-120px",
          right: "-120px",
        }}
      />
      <div
        className="absolute rounded-full opacity-15 animate-mesh-2 pointer-events-none"
        style={{
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, #FFB088 0%, transparent 70%)",
          bottom: "-80px",
          left: "-80px",
        }}
      />

      <div className="relative z-10 max-w-xl w-full mx-auto px-8 text-center">
        {/* Mascot — same sm/lg responsive pair as not-found.tsx */}
        <div className="flex justify-center sm:hidden">
          <TriplyMascot state="lost" size="md" />
        </div>
        <div className="hidden sm:flex sm:justify-center">
          <TriplyMascot state="lost" size="lg" />
        </div>

        <h2
          id="error-overlay-heading"
          className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-tight -mt-8 sm:-mt-10 mb-3 text-balance"
        >
          {copy.heading}
        </h2>
        <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8 text-balance">
          {copy.sub}
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-base font-semibold text-white transition-all active:scale-[0.98] hover:brightness-110"
            style={{
              background: "#FF6B47",
              boxShadow: "0 4px 14px rgba(255,107,71,0.35)",
            }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-white/55 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
