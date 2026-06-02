"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { SparkleIcon, ArrowUpIcon } from "@/components/landing/VibeIcons";
import {
  scoreDestinations,
  getPopularDestinations,
  type VibeDestination,
  type CanonicalTag,
} from "@/lib/vibeDestinations";
import {
  dispatchPrefill,
  type PrefillPayload,
} from "@/lib/prefill";

// Re-export so existing call sites that imported PrefillPayload from this
// module continue to compile while consumers migrate to @/lib/prefill.
export type { PrefillPayload };

// Suggestion thumbnail dimensions. Used by the next/image sizing AND the
// Unsplash CDN resize params — keeping them as constants makes it obvious
// the two are intentionally aligned.
const THUMB_PX = 64;

// Brand-aligned palette for the letter-tile fallback. Deterministic per
// city name (stable across renders, no flash on each keystroke). Picked
// to read well with a white initial letter.
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #FF6B47 0%, #FF8A6B 100%)", // coral
  "linear-gradient(135deg, #0D7377 0%, #14A0A5 100%)", // teal
  "linear-gradient(135deg, #F4A261 0%, #FFB088 100%)", // peach
  "linear-gradient(135deg, #8E7CC3 0%, #B19FE0 100%)", // soft purple
  "linear-gradient(135deg, #2A9D8F 0%, #57C0B2 100%)", // jade
] as const;

function pickFallbackGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
}

const PLACEHOLDER_ROTATION = [
  "a quick ocean escape",
  "a cheap city break",
  "somewhere warm under $1,000",
  "a mountain reset",
] as const;

const PLACEHOLDER_INTERVAL_MS = 2200;

const QUICK_START_CHIPS = [
  "ocean escape",
  "cheap city break",
  "mountain reset",
  "somewhere warm",
] as const;

const ZERO_MATCH_HINTS = ["beach", "cheap city", "mountain", "warm"] as const;

export function VibeSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [planning, setPlanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate the placeholder only when the field is empty AND unfocused — once
  // the user is typing or has the cursor parked here, the rotation reads as
  // jitter instead of charm.
  useEffect(() => {
    if (focused || query.length > 0) return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_ROTATION.length);
    }, PLACEHOLDER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [focused, query]);

  // scoreDestinations is pure + cheap on 16 entries; memoising on query
  // alone is fine. No debounce — the engine is fast enough at this size.
  const scored = useMemo(() => scoreDestinations(query), [query]);
  const popular = useMemo(() => getPopularDestinations(), []);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const hasMatches = scored.length > 0;
  const showPopular = !hasQuery;
  const showNoMatches = hasQuery && !hasMatches;

  const triggerPlanning = useCallback((payload: PrefillPayload) => {
    setPlanning(true);
    // Brief visual beat so the transition from search → planner doesn't feel
    // teleporty. The actual generation loading state belongs to TripForm /
    // LoadingOverlay later — this is just the handoff.
    window.setTimeout(() => {
      dispatchPrefill(payload);
      setPlanning(false);
    }, 240);
  }, []);

  const submitFreeText = useCallback(() => {
    if (planning) return;
    if (!hasQuery) {
      // Empty submit — just scroll the user to the planner.
      triggerPlanning({});
      return;
    }
    triggerPlanning({ vibeQuery: trimmed });
  }, [planning, hasQuery, trimmed, triggerPlanning]);

  const submitCity = useCallback(
    (dest: VibeDestination) => {
      if (planning) return;
      triggerPlanning({
        vibeQuery: hasQuery ? trimmed : undefined,
        city: {
          kind: dest.kind,
          cityName: dest.city,
          countryName: dest.country,
          countryCode: dest.countryCode,
          lat: dest.lat,
          lng: dest.lng,
        },
      });
    },
    [planning, hasQuery, trimmed, triggerPlanning],
  );

  const handleChipClick = useCallback((chip: string) => {
    setQuery(chip);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitFreeText();
      }
    },
    [submitFreeText],
  );

  const currentPlaceholder = PLACEHOLDER_ROTATION[placeholderIdx];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-8 text-center">
          <div className="h-0.5 w-8 bg-accent mb-3 mx-auto" />
          <p className="font-serif uppercase tracking-[0.2em] font-medium text-accent text-xs mb-3">
            Vibe search
          </p>
          <h2
            className="font-semibold text-[#1A1A1A] leading-tight mb-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Tell us the mood. We'll find the place.
          </h2>
          <p
            className="text-[15px] sm:text-base"
            style={{ color: "rgba(13,115,119,0.7)" }}
          >
            Type anything — a feeling, a budget, a region. Pick a match to plan.
          </p>
        </div>

        {/* Quick-start chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {QUICK_START_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipClick(chip)}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium border border-[#0D7377]/15 bg-white text-[#0D7377] hover:bg-[#0D7377]/[0.06] hover:border-[#0D7377]/30 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Pill input */}
        <div
          className={`flex items-center gap-2 rounded-full bg-white border transition-all px-4 py-2.5 ${
            focused
              ? "border-accent/60 shadow-[0_4px_16px_rgba(255,107,71,0.15)]"
              : "border-[#0D7377]/15 shadow-sm"
          }`}
        >
          <span className="shrink-0 text-accent" aria-hidden="true">
            <SparkleIcon color="currentColor" size={22} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={currentPlaceholder}
            aria-label="Describe the trip you want"
            className="flex-1 min-w-0 bg-transparent text-base text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none"
            disabled={planning}
          />
          <button
            type="button"
            onClick={submitFreeText}
            aria-label={
              hasQuery ? `Plan a trip for "${trimmed}"` : "Open the planner"
            }
            disabled={planning}
            className="shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center text-white transition-all disabled:opacity-60 active:scale-[0.96]"
            style={{
              background: "#FF6B47",
              boxShadow: "0 2px 8px rgba(255,107,71,0.35)",
            }}
          >
            <ArrowUpIcon color="currentColor" size={18} />
          </button>
        </div>

        {/* Planning state — brief handoff line */}
        <div className="h-5 mt-3 text-center" aria-live="polite">
          {planning && (
            <span className="text-sm text-[#0D7377]/70">
              Opening the planner…
            </span>
          )}
        </div>

        {/* Suggestions area */}
        <div className="mt-2">
          {showPopular && (
            <PopularList popular={popular} onPick={submitCity} />
          )}
          {hasMatches && (
            <MatchList matches={scored} onPick={submitCity} />
          )}
          {showNoMatches && <NoMatchHint />}
        </div>
      </div>
    </section>
  );
}

// ─── Sub-views ───────────────────────────────────────────────────────────────

function PopularList({
  popular,
  onPick,
}: {
  popular: VibeDestination[];
  onPick: (d: VibeDestination) => void;
}) {
  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377]/70 mb-3 text-center">
        Popular right now
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {popular.map((d) => (
          <li key={`${d.city}-${d.country}`}>
            <DestinationCardButton
              destination={d}
              matchedTags={EMPTY_SET}
              onPick={onPick}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MatchList({
  matches,
  onPick,
}: {
  matches: ReturnType<typeof scoreDestinations>;
  onPick: (d: VibeDestination) => void;
}) {
  return (
    <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {matches.map(({ destination, matchedTags }) => (
        <li key={`${destination.city}-${destination.country}`}>
          <DestinationCardButton
            destination={destination}
            matchedTags={matchedTags}
            onPick={onPick}
          />
        </li>
      ))}
    </ul>
  );
}

function NoMatchHint() {
  return (
    <div className="mt-8 text-center text-sm text-[#1A1A1A]/60">
      <p className="mb-2">No matches — try a word like:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {ZERO_MATCH_HINTS.map((h) => (
          <span
            key={h}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#0D7377]/[0.06] text-[#0D7377]"
          >
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

const EMPTY_SET: ReadonlySet<CanonicalTag> = new Set();

function DestinationCardButton({
  destination,
  matchedTags,
  onPick,
}: {
  destination: VibeDestination;
  matchedTags: ReadonlySet<CanonicalTag>;
  onPick: (d: VibeDestination) => void;
}) {
  // Show up to 2 tags: prefer matched tags first so the matched ones lead and
  // the card immediately confirms why it surfaced for this query.
  const tagsToShow = useMemo(() => {
    const matched = destination.tags.filter((t) => matchedTags.has(t));
    const rest = destination.tags.filter((t) => !matchedTags.has(t));
    return [...matched, ...rest].slice(0, 2);
  }, [destination.tags, matchedTags]);

  return (
    <button
      type="button"
      onClick={() => onPick(destination)}
      aria-label={`Plan a trip to ${destination.city}, ${destination.country}`}
      className="w-full text-left bg-white rounded-2xl border border-[#0D7377]/10 hover:border-accent/40 hover:shadow-md transition-all p-3 group flex items-start gap-3"
    >
      <DestinationThumb destination={destination} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-[#1A1A1A] text-base">
              {destination.city}
            </span>
            <span className="text-sm text-[#1A1A1A]/55 ml-1.5">
              {destination.country}
            </span>
          </div>
          <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold shrink-0">
            Plan →
          </span>
        </div>
        <p className="text-[13px] text-[#1A1A1A]/65 leading-relaxed mt-1 line-clamp-2">
          {destination.note}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tagsToShow.map((tag) => {
            const isMatch = matchedTags.has(tag);
            return (
              <span
                key={tag}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  isMatch
                    ? "bg-[#0D7377]/10 text-[#0D7377]"
                    : "bg-[#1A1A1A]/[0.04] text-[#1A1A1A]/55"
                }`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>
    </button>
  );
}

// Thumbnail: tries the curated Unsplash photo (resized via CDN params), falls
// back to a deterministic letter tile on missing / failed image. Fixed
// width/height locks layout so re-renders on each keystroke don't shift.
function DestinationThumb({ destination }: { destination: VibeDestination }) {
  const [errored, setErrored] = useState(false);
  const hasImage = !!destination.image && !errored;
  const seed = `${destination.city}-${destination.country}`;
  const gradient = useMemo(() => pickFallbackGradient(seed), [seed]);
  const initial = destination.city.charAt(0).toUpperCase();

  // Reset the error flag whenever the underlying image url changes — e.g.
  // suggestions reshuffle and this slot now renders a different destination.
  useEffect(() => {
    setErrored(false);
  }, [destination.image?.url]);

  if (!hasImage) {
    return (
      <div
        aria-hidden="true"
        className="shrink-0 rounded-xl flex items-center justify-center text-white font-semibold text-2xl select-none"
        style={{
          width: THUMB_PX,
          height: THUMB_PX,
          background: gradient,
        }}
      >
        {initial}
      </div>
    );
  }

  // Append Unsplash resize params so the CDN delivers a thumbnail-sized
  // source; next/image then re-encodes for the actual display size + format.
  const src = `${destination.image!.url}?w=${THUMB_PX * 3}&h=${
    THUMB_PX * 3
  }&fit=crop&q=80&auto=format`;

  return (
    <div
      className="shrink-0 rounded-xl overflow-hidden"
      style={{ width: THUMB_PX, height: THUMB_PX, background: gradient }}
    >
      <Image
        src={src}
        alt={destination.image!.alt}
        width={THUMB_PX}
        height={THUMB_PX}
        loading="lazy"
        onError={() => setErrored(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
