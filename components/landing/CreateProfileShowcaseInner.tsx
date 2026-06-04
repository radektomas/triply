"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import { SavedDestinationCard } from "@/components/profile/SavedDestinationCard";
import type { APIDestination } from "@/lib/types";

interface ShowcaseRow {
  id: string;
  destination: APIDestination;
  photoUrl: string;
  created_at: string;
  resolvedTripId: null;
}

interface Props {
  rows: ShowcaseRow[];
}

// Landing-page teaser for the profile/favorites feature. Mirrors the visual
// language of the profile page (same SavedDestinationCard, in showcase mode)
// so signing up feels like landing in a place the user has already seen.
//
// Layout: two columns on lg+ (mascot+CTA left, cards right), stacks to a
// single column on mobile/tablet with the cards underneath the mascot.
export function CreateProfileShowcaseInner({ rows }: Props) {
  const { openAuthModal } = useAuth();

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* lg:items-start anchors the mascot column at the top of the row so
            the 2×2 card stack on the right has room to grow downward without
            shoving the mascot to a vertical middle of empty space. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center lg:items-start">
          {/* LEFT — mascot + tropical backdrop + nudge CTA */}
          <div className="text-center lg:text-left">
            {/* Mascot block: w-fit so the rounded backdrop hugs the mascot
                (320px xl + padding) rather than stretching the full column
                width. The speech bubble at left:78% pokes out to the right,
                which is fine — only the backdrop is overflow-hidden, not the
                wrapper, so the bubble keeps its bounds. */}
            <div className="relative mb-8 mx-auto lg:mx-0 w-fit px-10 py-6">
              <TropicalBackdrop />
              <div className="relative flex justify-center lg:justify-start">
                <TriplyMascot
                  state="happy"
                  size="xl"
                  bubbleText="Save the trips you love — create a free profile!"
                />
              </div>
            </div>

            <div className="h-0.5 w-8 bg-accent mb-3 mx-auto lg:mx-0" />
            <p className="font-serif uppercase tracking-[0.2em] font-medium text-accent text-xs mb-3">
              Your profile
            </p>
            <h2
              className="font-semibold text-[#1A1A1A] leading-tight mb-2"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
            >
              Your trips, saved in one place.
            </h2>
            <p
              className="text-[15px] sm:text-base mb-6"
              style={{ color: "rgba(13,115,119,0.7)" }}
            >
              Heart the destinations that catch your eye — they&apos;ll be here
              next time.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D7377] hover:bg-[#0A5D60] text-white text-sm font-semibold transition-colors shadow-md cursor-pointer"
            >
              Create free profile
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* RIGHT — four SavedDestinationCard instances in showcase mode,
              laid out 1-up on mobile and 2×2 on sm+ (which inside the lg
              two-column outer grid is exactly the 2×2-on-desktop the brief
              asked for). All interactive controls (photo wrapper, "View
              trip" button) route to openAuthModal; trash icon is hidden;
              heart shows as a non-interactive filled decoration. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {rows.map((row) => (
              <SavedDestinationCard
                key={row.id}
                row={row}
                showcase
                onCtaClick={openAuthModal}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Decorative tropical ambience behind the mascot. All layers are
// aria-hidden + pointer-events-none — purely visual. Lives in the same
// file as the section because it has no reuse story and the inline
// markup is easier to scan than a separate component for ~80 lines of
// SVG. Palette stays on-brand: coral (#FF6B47) + accent teal (#0D7377)
// + cream, all at low opacity so the mascot's animation reads clearly.
function TropicalBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]"
    >
      {/* Warm peach radial — top-left, fades out toward bottom-right.
          Gives the mascot a sunset-tile feel without darkening the area. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 25%, rgba(255,176,136,0.42) 0%, rgba(255,176,136,0.10) 45%, transparent 70%)",
        }}
      />
      {/* Cool teal radial — opposite corner, very subtle. Adds depth so
          the backdrop doesn't read as a single flat peach wash. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 85% 80%, rgba(13,115,119,0.18) 0%, transparent 55%)",
        }}
      />

      {/* Sun — top-right corner. Filled disc + 8 rays. opacity-40 keeps
          it as an ambient cue, not a foreground element. */}
      <svg
        viewBox="0 0 64 64"
        className="absolute top-3 right-4 w-12 h-12 opacity-40"
        fill="none"
      >
        <circle cx="32" cy="32" r="9" fill="#FF6B47" />
        <g stroke="#FF6B47" strokeWidth="2.2" strokeLinecap="round">
          <line x1="32" y1="6" x2="32" y2="14" />
          <line x1="32" y1="50" x2="32" y2="58" />
          <line x1="6" y1="32" x2="14" y2="32" />
          <line x1="50" y1="32" x2="58" y2="32" />
          <line x1="13" y1="13" x2="19" y2="19" />
          <line x1="45" y1="45" x2="51" y2="51" />
          <line x1="51" y1="13" x2="45" y2="19" />
          <line x1="13" y1="51" x2="19" y2="45" />
        </g>
      </svg>

      {/* Palm leaf — bottom-left. Single tapered silhouette with a central
          rib. Two stacked at slight rotations so it reads as a frond, not
          a single blob. */}
      <svg
        viewBox="0 0 64 96"
        className="absolute -bottom-2 -left-2 w-24 h-32 opacity-30"
        fill="none"
        style={{ transform: "rotate(-12deg)" }}
      >
        <path
          d="M32 92 C 6 70, 4 36, 32 6 C 60 36, 58 70, 32 92 Z"
          fill="#0D7377"
          opacity="0.55"
        />
        <path
          d="M32 88 Q 32 48, 32 10"
          stroke="#0A5D60"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>

      {/* Palm leaf — bottom-right. Smaller, rotated the other way so the
          two leaves balance the composition. */}
      <svg
        viewBox="0 0 64 96"
        className="absolute -bottom-3 -right-3 w-20 h-28 opacity-25"
        fill="none"
        style={{ transform: "rotate(18deg)" }}
      >
        <path
          d="M32 92 C 6 70, 4 36, 32 6 C 60 36, 58 70, 32 92 Z"
          fill="#0D7377"
          opacity="0.55"
        />
        <path
          d="M32 88 Q 32 48, 32 10"
          stroke="#0A5D60"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </div>
  );
}
