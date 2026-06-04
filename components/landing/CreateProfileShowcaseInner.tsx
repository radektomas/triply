"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import { MascotSpeechBubble } from "./MascotSpeechBubble";
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
          {/* LEFT — mascot (on top of decorative palm) + nudge CTA. */}
          <div className="text-center lg:text-left">
            {/* SCENE STAGE — palm + mascot share one positioning context so
                they stay locked relative to each other regardless of how
                their children render. Fixed per-breakpoint dimensions (no
                `min-h`, no shrink-to-fit) keep the composition stable.
                Both children are absolutely positioned INSIDE the stage:
                the palm is anchored bottom-left so the trunk/waves sit
                lower-left and the fronds spread up-and-right; the mascot
                stands in the lower-right of the stage with feet roughly on
                the palm's wave baseline, in the open space to the right of
                the trunk so it doesn't cover any fronds. The stage sits at
                the top of the left column with `mb-6` to the text below —
                one cohesive column, no large vertical gap. */}
            <div className="relative mx-auto mb-6 w-[340px] h-[340px] sm:w-[400px] sm:h-[380px] lg:w-[460px] lg:h-[420px]">
              <Image
                src="/landing/triply-palm.png"
                alt=""
                aria-hidden="true"
                width={614}
                height={733}
                sizes="(max-width: 640px) 380px, (max-width: 1024px) 460px, 560px"
                className="absolute bottom-0 left-0 w-[380px] sm:w-[460px] lg:w-[560px] h-auto opacity-70 pointer-events-none select-none z-0"
              />
              {/* `state="smug"` is the chill variant — face wears the black
                  sunglasses (TriplyFace smug branch) and the default arm
                  set holds the coconut + straw (used by idle/sleepy/smug).
                  No built-in `bubbleText` — the rotating playful CTA bubble
                  is mounted alongside via <MascotSpeechBubble/>, which
                  positions itself absolute relative to the inner wrapper
                  here (hence the extra `relative` div). Other TriplyMascot
                  usages elsewhere in the app are untouched. */}
              <div className="absolute bottom-[10px] right-[30px] z-10">
                <div className="relative">
                  <TriplyMascot state="smug" pxSize={152} calm />
                  <MascotSpeechBubble />
                </div>
              </div>
            </div>

            {/* Heading + subtext — eyebrow + accent rule removed so the
                column leads with the heading itself. Heading uses the
                shared Tailwind v4 `text-accent` token (resolves to
                --color-accent #FF6B47 in app/globals.css) — same coral the
                eyebrow used to use, the highlighted "3 trips for €X"
                price, accent pills, etc. — so it stays consistent if the
                theme moves. Subtext switched to near-black #1A1A1A to
                match the site's primary body color (same hex the trip
                form labels use). */}
            <h2
              className="font-semibold text-accent leading-tight mb-2"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
            >
              Your trips, saved in one place.
            </h2>
            <p className="text-[15px] sm:text-base mb-6 text-[#1A1A1A]">
              Heart the destinations that catch your eye, they&apos;ll be
              here next time.
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

