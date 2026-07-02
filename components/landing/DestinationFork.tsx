"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CityAutocomplete,
  type CitySelection,
} from "@/components/shared/CityAutocomplete";
import {
  FlightPathIcon,
  RegionIcon,
  FlagIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/components/landing/VibeIcons";
import type { DestinationMode } from "@/lib/types";

interface DestinationForkProps {
  destinationMode: DestinationMode;
  regionSelection: CitySelection | null;
  exactCity: CitySelection | null;
  onDestinationModeChange: (mode: DestinationMode) => void;
  onRegionSelectionChange: (sel: CitySelection | null) => void;
  onExactCityChange: (sel: CitySelection | null) => void;
  // Commit into the wizard (parent's chooseDestination). The parent swaps the
  // fork for the wizard card with an in-place crossfade — no curtain, no
  // morph, no measurement. Fires analytics + markFormStarted in the parent.
  onCommit: (option: DestinationMode) => void;
  prefillHighlight?: boolean;
  // The prefill payload uses `kind: "city" | "region"` (the exact-city tile keys
  // off "city"), so this mirrors that vocabulary rather than DestinationMode.
  prefilledKind?: "city" | "region" | null;
  reduceMotion?: boolean;
  // True when this fork entry is a RETURN from the wizard (Budget → Back), not
  // the initial page load. The component remounts identically in both cases so
  // it can't tell them apart itself; when true, the tiles play their staggered
  // fade-in so the grid "reassembles" as the wizard fades out.
  enterAnimated?: boolean;
}

// Choreography constants — the fork's motion is ONE overlapping gesture, not a
// chain of steps, so every timer here is DERIVED from a duration rather than
// hand-tuned in isolation. Change a duration and its dependents follow.
//
// Easing pairs: EXIT is fast-start/long-soft-tail (things leaving get out of
// the way immediately, then melt); ENTER is the mirrored ease-out family
// (things arriving land softly).
const EASE_EXIT: [number, number, number, number] = [0.32, 0.72, 0, 1];
const EASE_ENTER: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Coral fill duration. The commit fires at FILL_MS × 0.55 so the wizard
// crossfade begins UNDER the still-completing fill — that overlap is what
// fuses fill and swap into one continuous motion instead of sequential steps.
const FILL_MS = 350;
const COMMIT_AT_MS = Math.round(FILL_MS * 0.55); // ≈193ms
// Tiles↔input-bar swap: an in-place crossfade in the same grid-overlay slot —
// nothing travels across the screen, nothing visibly changes shape. Exits are
// faster than entrances and they OVERLAP: the entering side starts
// SWAP_OVERLAP_DELAY_S after the exit begins, so the swap never shows an
// empty beat. The autocomplete focuses at 70% of the bar's entrance — as the
// bar lands, not after.
const SWAP_EXIT_S = 0.15;
const SWAP_ENTER_S = 0.2;
const SWAP_OVERLAP_DELAY_S = 0.06;
const FOCUS_AT_MS = Math.round(SWAP_ENTER_S * 1000 * 0.7); // 140ms
// Region/exact tap: the identity-colour fill gets a short but CLEARLY VISIBLE
// beat BEFORE the tile crossfades into the input bar (surprise instead rides
// its fill straight into the commit). The fill ramps to full over
// PLACE_FILL_RAMP_MS, then at PLACE_FILL_MS the crossfade to the bar begins —
// so the teal/ink flash is as readable as the Surprise coral, then the bar
// appears. Previously the mode change fired in the SAME tick as the fill, so
// the fill's opacity ramp and the tile's exit-fade ran together and cancelled
// out (invisible flash). Kept short so the tap still feels snappy.
const PLACE_FILL_RAMP_MS = 160;
const PLACE_FILL_MS = 210;

// ── Destination pre-screen ("choose your adventure" fork) ────────────────────
// Three SQUARE tiles (grid on desktop, stacked on mobile). Choosing region/
// exact crossfades the tile grid IN PLACE into a full-width input bar (both
// render in the same single-cell grid overlay, so nothing travels and there's
// no height jump mid-swap); surprise fills coral then commits. The commit
// swaps the whole fork for the wizard card via the parent's (TripForm)
// in-place crossfade — no shared-element morphs anywhere on this path.
export function DestinationFork({
  destinationMode,
  regionSelection,
  exactCity,
  onDestinationModeChange,
  onRegionSelectionChange,
  onExactCityChange,
  onCommit,
  prefillHighlight = false,
  prefilledKind = null,
  reduceMotion = false,
  enterAnimated = false,
}: DestinationForkProps) {
  const regionInputRef = useRef<HTMLInputElement>(null);
  const exactInputRef = useRef<HTMLInputElement>(null);

  // Sibling-tile exit (surprise flow): opacity + slight scale + y-drift.
  // Instant under reduced motion.
  const fadeExit = reduceMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: EASE_EXIT };
  // Tiles↔bar crossfade halves. The entrance's delay is the overlap: it
  // starts while the exit is still running.
  const swapExit = reduceMotion
    ? { duration: 0 }
    : { duration: SWAP_EXIT_S, ease: "easeOut" as const };
  const swapEnter = reduceMotion
    ? { duration: 0 }
    : { duration: SWAP_ENTER_S, ease: EASE_ENTER, delay: SWAP_OVERLAP_DELAY_S };

  // Small pure helpers (kept for the mobile below-the-fold case: the input bar
  // can sit low on a short viewport, so we softly scroll it into view on focus).
  const prefersReducedMotion = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const scrollIntoViewSoft = useCallback(
    (el: HTMLElement | null, block: ScrollLogicalPosition) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const fullyVisible = rect.top >= 8 && rect.bottom <= vh - 24;
      if (fullyVisible) return;
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block,
      });
    },
    [prefersReducedMotion],
  );

  // Focus (and softly scroll) the input bar when a region/exact mode is FRESHLY
  // chosen — but NOT on remount (returning from Budget's "Back" with a prior
  // selection). Mount guard preserves the Phase-2 behavior: this component
  // remounts on every fork entry, so we skip the first run and only react to an
  // actual mode change (a fresh tile tap). Focus fires at 70% of the bar's
  // entrance (FOCUS_AT_MS, derived from SWAP_ENTER_S) — as it lands, not after.
  const revealMountRef = useRef(false);
  useEffect(() => {
    if (!revealMountRef.current) {
      revealMountRef.current = true;
      return;
    }
    if (destinationMode !== "region" && destinationMode !== "exact_city") return;
    const ref = destinationMode === "region" ? regionInputRef : exactInputRef;
    const delay = prefersReducedMotion() ? 0 : FOCUS_AT_MS;
    const id = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      scrollIntoViewSoft(el, "center");
      el.focus({ preventScroll: true });
    }, delay);
    return () => window.clearTimeout(id);
  }, [destinationMode, prefersReducedMotion, scrollIntoViewSoft]);

  // Surprise fill → commit. The coral fill is purely PRESENTATIONAL; the commit
  // is scheduled off the fill's DECLARED duration with a plain timeout, NOT a
  // framer onAnimationComplete. (History: in the layoutId-morph era, the
  // fill's onAnimationComplete was dropped when the sibling exits made the
  // then-present LayoutGroup re-project the subtree mid-fill — the commit
  // never came and the tile froze fully coral. The morph is gone, but the
  // lesson stands: a commit must never depend on an animation callback that
  // can be skipped; a timeout can't be.) committedRef keeps it idempotent
  // (double-tap / reduced-motion), and it's cleared on unmount so a stray
  // timer can't fire after we've left the fork.
  //
  // NOTE: committedRef's reset relies on DestinationFork REMOUNTING on every
  // fork entry (the parent's AnimatePresence swaps key="fork"/key="wizard", so
  // Budget → Back mounts a fresh instance with a fresh ref). If that key swap
  // ever changes to keep the fork mounted, surprise could never re-commit —
  // the ref would need an explicit reset on fork re-entry instead.
  //
  // fillingMode drives the shared tap-fill treatment on ALL tiles (each tile's
  // identity colour floods it on tap, content flips white). For surprise it
  // doubles as the commit-in-flight flag; for region/exact it's a brief colour
  // acknowledgment that rides the tile→bar crossfade window.
  const [fillingMode, setFillingMode] = useState<DestinationMode | null>(null);
  const surpriseCommitting = fillingMode === "surprise";
  const committedRef = useRef(false);
  const commitTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current);
    },
    [],
  );
  function commitSurprise() {
    if (committedRef.current) return;
    committedRef.current = true;
    onCommit("surprise");
  }
  function handleSurprise() {
    if (fillingMode !== null) return;
    setFillingMode("surprise");
    if (reduceMotion) {
      commitSurprise(); // no fill to wait on — commit immediately
      return;
    }
    // Commit at 55% of the fill (COMMIT_AT_MS) so the wizard crossfade starts
    // while the coral is still completing — one continuous motion, no dead
    // frames between fill and swap.
    commitTimerRef.current = window.setTimeout(commitSurprise, COMMIT_AT_MS);
  }

  // Region/exact tap: flood the tile with its identity colour, hold a brief
  // visible beat, THEN swap to the input bar. Setting fillingMode (with
  // destinationMode unchanged) re-renders with the tiles still mounted and the
  // fill ramping up; the mode change — which triggers the tiles→bar crossfade —
  // is deferred by PLACE_FILL_MS so the flash is fully visible first. (Firing
  // the mode change in the same tick, as before, ran the fill ramp and the
  // tile's exit-fade simultaneously, so the colour never showed.)
  function handlePlaceTile(mode: DestinationMode) {
    if (fillingMode !== null) return;
    setFillingMode(mode);
    if (reduceMotion) {
      onDestinationModeChange(mode); // instant — no fill beat under reduced motion
      return;
    }
    commitTimerRef.current = window.setTimeout(
      () => onDestinationModeChange(mode),
      PLACE_FILL_MS,
    );
  }

  // Coral suppression on the surprise tile while a region/exact tile is pressed,
  // so no coral frame survives into the collapse. Reset back at neutral — the
  // fill flag too, so a re-entered grid ("Choose differently") doesn't show the
  // previously tapped tile still flooded. (A surprise COMMIT never trips this
  // reset: destinationMode is already "surprise" on the neutral grid, so the
  // dep doesn't change and the coral fill survives the fork's exit fade.)
  const [coralPressed, setCoralPressed] = useState(false);
  useEffect(() => {
    if (destinationMode === "surprise") {
      setCoralPressed(false);
      setFillingMode(null);
    }
  }, [destinationMode]);

  const showBar =
    destinationMode === "region" || destinationMode === "exact_city";
  const surpriseNeutral = coralPressed; // no longer "leaving" — bar replaces grid

  // The tiles' AnimatePresence remounts together with the tiles group (it's
  // nested inside the tiles↔bar swap), so its `initial` gate must know whether
  // this is the very first page render (tiles are simply there — no entrance)
  // or a re-entry ("Choose differently", or Budget → Back per enterAnimated),
  // where the staggered fade-in should play.
  const tilesShownRef = useRef(false);
  useEffect(() => {
    if (!showBar) tilesShownRef.current = true;
  }, [showBar]);
  const tilesAnimateIn =
    (enterAnimated || tilesShownRef.current) && !reduceMotion;

  // Tile config, including each tile's tap-fill treatment. Gradients and glow
  // shadows are the identity colours from the pre-remake fork (placeTickets'
  // fillClass/selectedShadow), kept as full class literals so Tailwind
  // statically generates them. fillMs: surprise ramps over FILL_MS (its commit
  // timer is derived from it); region/exact ramp over PLACE_FILL_RAMP_MS and
  // then hold — the crossfade to the bar is deferred to PLACE_FILL_MS so the
  // flash is fully painted before the tile fades out.
  const tiles = [
    {
      mode: "surprise" as const,
      label: "Surprise me",
      subtext: "Let Triply pick your match",
      Icon: FlightPathIcon,
      fill: "bg-gradient-to-br from-[#FF7A57] to-[#FF6B47]",
      fillShadow: "shadow-[0_16px_38px_-10px_rgba(255,107,71,0.6)]",
      fillMs: FILL_MS,
    },
    {
      mode: "region" as const,
      label: "I know the region",
      subtext: "Country or area",
      Icon: RegionIcon,
      fill: "bg-gradient-to-br from-[#0F8589] to-[#0D7377]",
      fillShadow: "shadow-[0_16px_38px_-10px_rgba(13,115,119,0.6)]",
      fillMs: PLACE_FILL_RAMP_MS,
    },
    {
      mode: "exact_city" as const,
      label: "I know the exact city",
      subtext: "One city, detailed",
      Icon: FlagIcon,
      fill: "bg-gradient-to-br from-[#274C5E] to-[#1B3A4B]",
      fillShadow: "shadow-[0_16px_38px_-10px_rgba(27,58,75,0.55)]",
      fillMs: PLACE_FILL_RAMP_MS,
    },
  ];

  // Per-mode presentation for the input bar (teal for region, ink for exact).
  const barCfg =
    destinationMode === "exact_city"
      ? {
          accent: "#1B3A4B",
          borderClass: "border-[#1B3A4B]/45",
          ringClass: "ring-[#1B3A4B]/15",
          iconClass: "bg-[#1B3A4B]/10 text-[#1B3A4B]",
          Icon: FlagIcon,
          title: "Which city?",
          value: exactCity,
          onChange: (sel: CitySelection | null) => {
            onExactCityChange(sel);
            if (sel) onCommit("exact_city");
          },
          innerInputRef: exactInputRef,
          mode: "city" as const,
          placeholder: "Type a city — Lisbon, Athens, Reykjavík…",
          helper: "Pick a specific city — we'll plan a detailed trip there.",
        }
      : {
          accent: "#0D7377",
          borderClass: "border-[#0D7377]/45",
          ringClass: "ring-[#0D7377]/15",
          iconClass: "bg-[#0D7377]/10 text-[#0D7377]",
          Icon: RegionIcon,
          title: "Which region?",
          value: regionSelection,
          onChange: (sel: CitySelection | null) => {
            onRegionSelectionChange(sel);
            if (sel) onCommit("region");
          },
          innerInputRef: regionInputRef,
          mode: "region" as const,
          placeholder: "e.g. Portugal, Sicily, Bali...",
          helper: "Country, region, or island — we'll find 3 great spots there.",
        };
  const BarIcon = barCfg.Icon;
  const ringActive =
    prefillHighlight &&
    ((destinationMode === "region" && prefilledKind === "region") ||
      (destinationMode === "exact_city" && prefilledKind === "city"));

  return (
    // Just the fork content (heading + tiles / input bar). The unified journey
    // progress bar lives in the persistent parent (TripForm), below this slot,
    // so it survives the fork→wizard swap without blinking — it is NOT part of
    // this component. The section's fill-the-viewport min-height also lives in
    // TripForm (on the fork state only).
    <div className="space-y-7">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a]">
          Where are we headed?
        </h2>
        <p className="text-sm md:text-base text-[#1a1a1a]/60 mt-3 font-medium">
          Let us surprise you, narrow it to a region, or name the exact city.
        </p>
      </div>

      {/* Single-cell overlay: the tile grid and the input bar render in the
          SAME grid cell and crossfade in place — nothing travels, nothing
          changes shape, and the exiting side never pushes the entering side
          (no height jump mid-swap). mode="sync" keeps both mounted during the
          overlap; the entrance's delay (SWAP_OVERLAP_DELAY_S) starts it while
          the exit is still running. grid-cols-1 pins the track to a fixed 1fr
          (container width) so the wider desktop tile row can center-overflow it
          via justify-self instead of expanding the track and spilling right. */}
      <div className="grid grid-cols-1">
        <AnimatePresence initial={false} mode="sync">
          {!showBar ? (
            <motion.div
              key="tiles"
              // Mobile: w-full fills the container (single-item grid track would
              // otherwise collapse to content width). Desktop: the fork is its
              // own scene, wider than the wizard card — md:w-[54rem] (~20% wider
              // than the ~45rem card content) with justify-self-center centers
              // it in its grid track, overflowing symmetrically WITHOUT a
              // transform (so framer's opacity/scale on this element can't fight
              // it). max-w-[95vw] keeps it on-screen on narrower desktops. The
              // input bar (separate item) keeps w-full = card width.
              className="[grid-area:1/1] w-full md:w-[54rem] md:max-w-[95vw] md:justify-self-center grid grid-cols-1 md:grid-cols-3 gap-3"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: swapExit }}
              transition={swapEnter}
            >
              {/* Nested presence for the SURPRISE flow's sibling exits (the two
                  non-tapped tiles drift out while the coral fills) and for the
                  reassembly stagger when the grid re-enters. */}
              <AnimatePresence initial={tilesAnimateIn} mode="sync">
              {tiles.map((t, i) => {
                // When surprise is committing, drop the other two so they exit
                // WHILE the coral fills (both start at t=0), leaving the coral
                // tile alone until the commit crossfades to the wizard.
                if (surpriseCommitting && t.mode !== "surprise") return null;
                const isSurprise = t.mode === "surprise";
                const isFilling = fillingMode === t.mode;
                const Icon = t.Icon;
                return (
                  <motion.button
                    key={t.mode}
                    type="button"
                    initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: reduceMotion ? 1 : 0.97,
                      y: reduceMotion ? 0 : 6,
                      transition: fadeExit,
                    }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.3, ease: EASE_ENTER, delay: i * 0.03 }
                    }
                    onClick={
                      isSurprise
                        ? handleSurprise
                        : () => handlePlaceTile(t.mode)
                    }
                    onPointerDown={isSurprise ? undefined : () => setCoralPressed(true)}
                    onPointerLeave={isSurprise ? undefined : () => setCoralPressed(false)}
                    onPointerCancel={isSurprise ? undefined : () => setCoralPressed(false)}
                    className={`group/tile relative w-full max-md:aspect-[5/3] md:min-h-[39rem] overflow-hidden md:overflow-visible flex flex-col items-center justify-center md:justify-evenly gap-3 rounded-3xl px-4 py-5 md:py-12 text-center bg-white border transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFE4CC] ${
                      isSurprise ? "focus-visible:ring-[#FF6B47]" : t.mode === "region" ? "focus-visible:ring-[#0D7377]" : "focus-visible:ring-[#1B3A4B]"
                    } ${
                      isFilling
                        ? `border-transparent ${t.fillShadow}`
                        : "border-[#1a1a1a]/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.16)] active:scale-[0.97] motion-safe:hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Identity-colour commit fill — shared by ALL tiles.
                        Starts at t=0 with the tap. Surprise: the commit fires
                        mid-fill (COMMIT_AT_MS) so the parent starts crossfading
                        to the wizard while the fill completes — nothing waits.
                        Region/exact: a brief acknowledgment riding the
                        tiles→bar crossfade window (fillMs is clipped to it). */}
                    {isFilling && (
                      <motion.span
                        aria-hidden
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: reduceMotion ? 0 : t.fillMs / 1000, ease: "easeOut" }}
                        // rounded-3xl matches the tile so the fill still clips
                        // to the tile's corners now that the tile itself is no
                        // longer overflow-hidden (which was cutting the subtitle).
                        className={`pointer-events-none absolute inset-0 rounded-3xl ${t.fill}`}
                      />
                    )}
                    <span
                      className={`relative z-10 shrink-0 inline-flex items-center justify-center w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-[1.6rem] ring-1 ring-inset transition-[transform,color,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
                        isFilling
                          ? "bg-white/20 ring-white/25 text-white"
                          : isSurprise
                          ? surpriseNeutral
                            ? "bg-[#1a1a1a]/[0.05] ring-[#1a1a1a]/10 text-[#1a1a1a]/70"
                            : "bg-[#FF6B47]/10 ring-[#FF6B47]/15 text-[#FF6B47] motion-safe:group-hover/tile:-rotate-12"
                          : t.mode === "region"
                          ? "bg-[#0D7377]/10 ring-[#0D7377]/15 text-[#0D7377] motion-safe:group-hover/tile:scale-110"
                          : "bg-[#1B3A4B]/10 ring-[#1B3A4B]/15 text-[#1B3A4B] motion-safe:group-hover/tile:scale-110"
                      }`}
                    >
                      <span className="inline-flex md:scale-[1.5]">
                        <Icon color="currentColor" size={30} />
                      </span>
                    </span>
                    <span className="relative z-10">
                      <span
                        className={`block text-lg md:text-2xl font-bold leading-tight transition-colors duration-300 motion-reduce:transition-none ${
                          isFilling ? "text-white" : "text-[#1a1a1a]"
                        }`}
                      >
                        {t.label}
                      </span>
                      <span
                        className={`block text-xs md:text-base mt-1 md:mt-2 leading-snug transition-colors duration-300 motion-reduce:transition-none ${
                          isFilling ? "text-white/85" : "text-[#1a1a1a]/55"
                        }`}
                      >
                        {t.subtext}
                      </span>
                    </span>
                    {isSurprise && (
                      <span
                        className={`absolute z-10 top-3 right-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                          surpriseCommitting
                            ? "bg-white text-[#FF6B47] border-transparent"
                            : "bg-white text-[#FF6B47] border-[#FF6B47]/55"
                        }`}
                      >
                        Popular
                      </span>
                    )}
                  </motion.button>
                );
              })}
              </AnimatePresence>
            </motion.div>
          ) : (
              // Input bar — crossfades in place over the tile grid's slot.
              // self-start keeps it at content height (grid overlay items
              // stretch to the tallest sibling by default, which would draw
              // the bar's border box tile-height tall during the swap).
              // Colour is a border/accent only so the input stays readable.
              <motion.div
                key={`bar-${destinationMode}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: swapExit }}
                transition={swapEnter}
                className={`[grid-area:1/1] self-start w-full rounded-3xl border-2 bg-white p-4 sm:p-5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.12)] ${barCfg.borderClass} ${
                  ringActive ? "ring-2 ring-offset-2 ring-[#0D7377]/55" : ""
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl ring-1 ring-inset ${barCfg.iconClass} ${barCfg.ringClass}`}
                  >
                    <BarIcon color="currentColor" size={22} />
                  </span>
                  <span className="text-base font-bold text-[#1a1a1a]">
                    {barCfg.title}
                  </span>
                </div>
                <CityAutocomplete
                  mode={barCfg.mode}
                  value={barCfg.value}
                  innerInputRef={barCfg.innerInputRef}
                  onChange={barCfg.onChange}
                  placeholder={barCfg.placeholder}
                />
                <p className="mt-2 text-xs text-muted">{barCfg.helper}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onDestinationModeChange("surprise")}
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFE4CC]"
                  >
                    <ArrowLeftIcon color="currentColor" size={16} />
                    Choose differently
                  </button>
                  {/* Re-commit path: returning from Budget's "Back" shows the bar
                      with the prior selection; this proceeds without re-picking. */}
                  {barCfg.value && (
                    <button
                      type="button"
                      onClick={() => onCommit(destinationMode)}
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      style={{ backgroundColor: barCfg.accent }}
                    >
                      Continue
                      <ArrowRightIcon color="currentColor" size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
