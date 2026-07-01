"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInDays } from "date-fns";
// NOTE: the repo ships `framer-motion` (not the `motion` package), and every
// animated component here imports from "framer-motion" — so we do too. The
// AGENTS.md `motion/react` path would not resolve.
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";

// The calendar pulls in react-day-picker + its stylesheet — only needed once
// the user reaches the date step, so load it on demand (ssr:false) to keep it
// out of the initial landing bundle. A light skeleton holds the space while
// the chunk loads.
const TripCalendar = dynamic(
  () => import("./TripCalendar").then((m) => m.TripCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] w-full">
        <div className="h-7 w-7 rounded-full border-2 border-[#FF6B47]/30 border-t-[#FF6B47] animate-spin" />
      </div>
    ),
  },
);
import { Button } from "@/components/ui/Button";
import { TagButton } from "@/components/ui/TagButton";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";
import { ErrorOverlay } from "@/components/landing/ErrorOverlay";
import {
  CheckIcon,
  CloseIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DiceIcon,
  PinIcon,
  TargetIcon,
} from "@/components/landing/VibeIcons";
import { setGenerationActive } from "@/components/triply/useGenerationActive";
import { deriveTripFormVibe } from "@/lib/vibeDestinations";
import { PREFILL_EVENT, type PrefillPayload } from "@/lib/prefill";
import { formatShort } from "@/lib/dates";
import { SoloBubble, CoupleBubble, FamilyBubble, GroupBubble } from "@/components/landing/TravelerBubbles";
import {
  BeachIcon,
  CityIcon,
  MountainsIcon,
  PartyIcon,
  CultureIcon,
  AdventureIcon,
} from "@/components/landing/VibeIcons";
import { AirportSearch } from "@/components/landing/AirportSearch";
import { AIRPORTS } from "@/lib/data/airports";
import {
  CityAutocomplete,
  type CitySelection,
} from "@/components/shared/CityAutocomplete";
import {
  TriplyFormPresence,
  TriplyFormPresenceMobile,
} from "@/components/triply/TriplyFormPresence";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { track } from "@/lib/analytics";

const DEFAULT_AIRPORT = AIRPORTS.find((a) => a.iata === "PRG");

// Maximum trip duration. The date-range picker clamps any longer selection
// back to this, and the "X nights" display / warning both read from it — so
// this is the single knob for the cap.
const MAX_NIGHTS = 30;

// ── Budget control ──────────────────────────────────────────────────────────
// Per-person, in EUR (the app's canonical currency — display formatter
// converts at render time). Keep min/max/step in sync with the server
// clamp in app/api/trips/route.ts and any prefill sources (showcase tiers,
// VibeSearch). BUDGET_PRESETS match the BudgetShowcase tiers.
const BUDGET_MIN = 100;
const BUDGET_MAX = 2000;
const BUDGET_STEP = 10;
const BUDGET_PRESETS = [500, 1000, 2000] as const;
const BUDGET_SNAP_THRESHOLD = 75; // ± euros within which the slider snaps on release.
const BUDGET_RANGE_MSG = "Enter a budget between €100 and €2000.";

function computeNights(from: Date, to: Date): number {
  return Math.max(0, differenceInDays(to, from));
}

const VIBE_PRESETS = [
  { value: "beach",     label: "Beach",     Icon: BeachIcon,     activeBg: "#F4A261", accent: "#F4A261" },
  { value: "city",      label: "City",      Icon: CityIcon,      activeBg: "#0D7377", accent: "#0D7377" },
  { value: "mountains", label: "Mountains", Icon: MountainsIcon, activeBg: "#8E7CC3", accent: "#8E7CC3" },
  { value: "party",     label: "Party",     Icon: PartyIcon,     activeBg: "#FF6B47", accent: "#FF6B47" },
  { value: "culture",   label: "Culture",   Icon: CultureIcon,   activeBg: "#D4574E", accent: "#D4574E" },
  { value: "adventure", label: "Adventure", Icon: AdventureIcon, activeBg: "#2A9D8F", accent: "#2A9D8F" },
];

const TRAVELER_PRESETS = [
  {
    label: "Solo",
    count: 1,
    bubble: "solo" as const,
    flavor: "flexible, any vibe",
    activeBg: "#0D7377",
    activeText: "#ffffff",
    hoverTint: "rgba(13, 115, 119, 0.08)",
    accent: "#0D7377",
  },
  {
    label: "Couple",
    count: 2,
    bubble: "couple" as const,
    flavor: "romantic spots",
    activeBg: "#FF6B47",
    activeText: "#ffffff",
    hoverTint: "rgba(255, 107, 71, 0.08)",
    accent: "#FF6B47",
  },
  {
    label: "Family",
    count: 4,
    bubble: "family" as const,
    flavor: "kid-friendly",
    activeBg: "#F4A261",
    activeText: "#ffffff",
    hoverTint: "rgba(244, 162, 97, 0.1)",
    accent: "#F4A261",
  },
  {
    label: "Group",
    count: 5,
    bubble: "group" as const,
    flavor: "social, lively",
    activeBg: "#8E7CC3",
    activeText: "#ffffff",
    hoverTint: "rgba(142, 124, 195, 0.1)",
    accent: "#8E7CC3",
  },
];

function renderBubble(variant: "solo" | "couple" | "family" | "group", isActive: boolean, accent: string) {
  const color = isActive ? "#ffffff" : accent;
  const props = { color, active: isActive };
  switch (variant) {
    case "solo":   return <SoloBubble   {...props} />;
    case "couple": return <CoupleBubble {...props} />;
    case "family": return <FamilyBubble {...props} />;
    case "group":  return <GroupBubble  {...props} />;
  }
}

// Step 3 swaps its label depending on the chosen path: the discovery path
// still collects a vibe ("Vibe"), while the intent path skips vibe entirely
// and only captures the origin airport ("From").
const STEP_LABELS_DISCOVERY = ["Budget", "When", "Vibe"];
const STEP_LABELS_INTENT = ["Budget", "When", "From"];


function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function ProgressDots({
  currentStep,
  onJump,
  labels,
}: {
  currentStep: 1 | 2 | 3;
  onJump: (step: 1 | 2 | 3) => void;
  labels: string[];
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-center gap-0 mb-3">
        {([1, 2, 3] as const).map((step, idx) => (
          <div key={step} className="flex items-center">
            {idx > 0 && (
              <div
                className="w-12 h-0.5 transition-colors duration-300"
                style={{
                  backgroundColor: currentStep > idx ? "var(--color-accent)" : "#E5E7EB",
                }}
              />
            )}
            <button
              type="button"
              onClick={() => step < currentStep && onJump(step)}
              disabled={step >= currentStep}
              aria-label={`Step ${step}: ${labels[step - 1]}`}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 disabled:cursor-default"
              style={{
                backgroundColor:
                  step === currentStep
                    ? "var(--color-accent)"
                    : step < currentStep
                    ? "var(--color-accent)"
                    : "#E5E7EB",
                color: step <= currentStep ? "white" : "#9CA3AF",
                opacity: step >= currentStep ? 1 : 0.85,
              }}
            >
              {step < currentStep ? "✓" : step}
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted">
        Step {currentStep} of 3 — {labels[currentStep - 1]}
      </p>
    </div>
  );
}

export function TripForm() {
  const router = useRouter();
  // Reactive reduced-motion flag for the fork-tile Motion animations below.
  // (Distinct from the imperative `prefersReducedMotion` callback used by the
  // scroll helpers.) When true, every fork transition runs at duration 0 with
  // no entrance offset — instant, identical end state.
  const reduceMotion = useReducedMotion() ?? false;
  // Fires `trip_form_started` exactly once, on the user's first meaningful
  // interaction with the wizard (first budget edit or first step advance).
  // Ref-guarded so repeated interactions don't re-fire. A hoisted function
  // declaration (not useCallback) so referencing it inside the `[]`-dep keydown
  // effect doesn't trip exhaustive-deps, matching handleSubmit/handleNext.
  const formStartedRef = useRef(false);
  function markFormStarted() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    track("trip_form_started");
  }
  const {
    selectedCurrency,
    format,
    convert,
    rates,
    loading: ratesLoading,
  } = useCurrency();
  // When the user picks a non-EUR currency but we have no rate for it
  // (either rates haven't loaded yet, or the FX fetch failed and we fell
  // back to {EUR:1}), the budget input would silently treat typed values as
  // identity — e.g. "1000 CZK" submitted as €1000 instead of intended €40.
  // Block submission and surface a short notice; switching back to EUR
  // (or waiting a second for rates to load) clears it.
  const fxWarning = useMemo<string | null>(() => {
    if (selectedCurrency === "EUR") return null;
    if (ratesLoading) return "Loading exchange rates…";
    if (!rates || rates[selectedCurrency] === undefined) {
      return "Exchange rates unavailable — switch back to EUR to plan accurately.";
    }
    return null;
  }, [selectedCurrency, ratesLoading, rates]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  // The destination decision now lives on a dedicated PRE-screen that comes
  // before the numbered wizard. While this is true we render that screen and
  // hide the (1-2-3) ProgressDots; choosing an option flips it false and
  // reveals the numbered wizard starting at Budget. Kept separate from
  // currentStep so the numbered dots never count the pre-screen as a step.
  const [onDestinationScreen, setOnDestinationScreen] = useState(true);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  // One-shot: skip the wizard's opacity-fade entry animation for the FIRST
  // frame after committing a destination from the fork. The fork tile already
  // filled with colour to "carry you in", so the budget step must appear
  // instantly — otherwise it mounts at opacity 0 over a pure-white card, which
  // reads as "the tile fills, then goes completely white for a beat, then the
  // form". Set true on commit; cleared on the next navigation so budget↔when↔
  // vibe keep their normal slide.
  const [skipEntryAnim, setSkipEntryAnim] = useState(false);
  const [budget, setBudget] = useState(500);
  // Mirror of `budget` for the editable big-number input. Shows the EUR
  // canonical value CONVERTED to the user's selected currency (so €500 reads
  // as "12500" when CZK is active). Decoupled so transient typed values can
  // show the inline error without us clobbering keystrokes — `budget` only
  // updates when the typed value parses + converts back into the EUR range.
  const [budgetInput, setBudgetInput] = useState<string>("500");
  const [budgetError, setBudgetError] = useState<string | null>(null);
  // While true (input focused), external state changes (slider drag, chip
  // click, prefill, currency switch) do NOT overwrite the input string.
  // On blur this flips back to false and the sync useEffect re-renders.
  const [editingBudget, setEditingBudget] = useState(false);

  // Inverse of convertEUR — used to map a typed display-currency amount back
  // to the EUR canonical value (since `budget` and the n8n payload are EUR).
  // Falls back to identity when rates aren't loaded yet, mirroring how
  // convertEUR degrades gracefully.
  const displayToEur = useCallback(
    (displayValue: number): number => {
      if (selectedCurrency === "EUR") return displayValue;
      const rate = rates?.[selectedCurrency];
      if (!rate || rate === 0) return displayValue;
      return displayValue / rate;
    },
    [selectedCurrency, rates],
  );

  // Currency symbol for the big-number prefix. Derived from `format(0)` so
  // it always matches the locale `format` is using internally — avoids the
  // CurrencySelector showing "Kč" while the big number shows "CZK" or vice
  // versa. Strips digits/commas/decimals/whitespace from the sample output.
  const currencySymbol = useMemo(() => {
    const sample = format(0, { decimals: 0 });
    const stripped = sample.replace(/[\d.,\s ]+/g, "").trim();
    return stripped || selectedCurrency;
  }, [format, selectedCurrency]);
  const [travelers, setTravelers] = useState(2);
  const [vibe, setVibe] = useState("beach");
  const [originCity, setOriginCity] = useState("Prague");
  const [destinationMode, setDestinationMode] = useState<
    "surprise" | "specific" | "exact_city"
  >("surprise");
  // Both `specific` (region) and `exact_city` modes use Photon autocomplete —
  // the parent holds a CitySelection per mode and derives the wire-level
  // `destinationInput` string at submit time.
  const [regionSelection, setRegionSelection] = useState<CitySelection | null>(null);
  const [exactCity, setExactCity] = useState<CitySelection | null>(null);
  // Set by handleSubmit once we have a tripId; consumed by LoadingOverlay's
  // onReady to drive the actual router.push (after the optional game's
  // reveal delay if the user opted in).
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Broadcast generation on/off so the ambient HERO mascot (in a separate part
  // of the tree, with no access to this state) can pause its loops while the
  // LoadingOverlay covers the screen. The form's own mascots use the `loading`
  // prop directly. Cleanup resets the flag if the form unmounts mid-request.
  useEffect(() => {
    setGenerationActive(loading);
    return () => setGenerationActive(false);
  }, [loading]);
  // submitError drives the full-screen ErrorOverlay (used for upstream /
  // internal failures where the form is unactionable until the user retries).
  // inlineSubmitError drives a small message under the submit button (used
  // for validation rejections — the user can fix the field and retry).
  const [submitError, setSubmitError] = useState<
    { heading: string; sub: string } | null
  >(null);
  const [inlineSubmitError, setInlineSubmitError] = useState<string | null>(
    null,
  );
  // Confirmation banner when VibeSearch pre-selected a destination. The
  // name + kind together are the "anchor" we compare against to decide
  // auto-dismissal: if the user later changes mode or edits the selection
  // away from this value, the banner + highlight clear themselves.
  const [prefilled, setPrefilled] = useState<
    { name: string; kind: "city" | "region" } | null
  >(null);
  const [prefillHighlight, setPrefillHighlight] = useState(false);
  const [nightsWarning, setNightsWarning] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [today, setToday] = useState<Date | undefined>(undefined);
  const [maxDate, setMaxDate] = useState<Date | undefined>(undefined);
  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setToday(now);
    setMaxDate(addDays(now, 365));
  }, []);

  const nights = range?.from && range?.to ? computeNights(range.from, range.to) : 0;

  function handleRangeSelect(newRange: DateRange | undefined) {
    if (!newRange) { setRange(undefined); return; }
    if (newRange.from && newRange.to) {
      const n = differenceInDays(newRange.to, newRange.from);
      if (n > MAX_NIGHTS) {
        setRange({ from: newRange.from, to: addDays(newRange.from, MAX_NIGHTS) });
        setNightsWarning(true);
        setTimeout(() => setNightsWarning(false), 3000);
        return;
      }
    }
    setNightsWarning(false);
    setRange(newRange);
  }

  const stateRef = useRef({
    currentStep,
    onDestinationScreen,
    budget,
    range,
    travelers,
    vibe,
    originCity,
    destinationMode,
    regionSelection,
    exactCity,
    loading,
    // Mirror the selected currency here too so handleSubmit can stamp the
    // trip_generated event without closing over the reactive value directly
    // (keeps the keyboard-shortcut effect's empty dep array honest).
    selectedCurrency,
  });
  useEffect(() => {
    stateRef.current = {
      currentStep,
      onDestinationScreen,
      budget,
      range,
      travelers,
      vibe,
      originCity,
      destinationMode,
      regionSelection,
      exactCity,
      loading,
      selectedCurrency,
    };
  });

  useLayoutEffect(() => {
    return () => setLoading(false);
  }, []);

  // ── Scroll-into-view after layout-shifting actions ────────────────────────
  // The form lives far down a long page and scrolls the window. Revealing an
  // autocomplete (region/exact) or swapping the wizard step grows/replaces
  // content without moving the viewport, so the relevant element can land off
  // screen — worst on mobile. These refs + helpers bring the right element
  // into view (smooth, or instant under prefers-reduced-motion) and move focus
  // to the revealed input without a jarring double-jump. None of this touches
  // selection logic, analytics, or navigation.
  const formCardRef = useRef<HTMLDivElement>(null);
  const regionInputRef = useRef<HTMLInputElement>(null);
  const exactInputRef = useRef<HTMLInputElement>(null);

  const prefersReducedMotion = useCallback(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Scroll an element into view only when it isn't already comfortably placed,
  // so we never yank the page when the target is fine where it is.
  const scrollIntoViewSoft = useCallback(
    (el: HTMLElement | null, block: ScrollLogicalPosition) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // "Already placed" = fully visible with a little margin. We deliberately
      // do NOT require it to sit in the top third: pulling a perfectly visible
      // field up to the top is what made the tile lurch, because that scroll
      // competed with the collapse/expand layout animation. Only scroll when
      // the target is genuinely clipped off-screen.
      const fullyVisible = rect.top >= 8 && rect.bottom <= vh - 24;
      if (fullyVisible) return;
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block,
      });
    },
    [prefersReducedMotion],
  );

  // Bring a freshly revealed autocomplete input into view and focus it.
  // focus({ preventScroll }) keeps the browser from doing its own jump, so the
  // single smooth scroll above is the only motion (no double-jump). Focus still
  // lands keyboard/screen-reader users on the field.
  const revealInput = useCallback(
    (el: HTMLInputElement | null) => {
      if (!el) return;
      scrollIntoViewSoft(el, "center");
      el.focus({ preventScroll: true });
    },
    [scrollIntoViewSoft],
  );

  // Skip the initial mount so the page doesn't auto-scroll to the form on load.
  const navScrollReady = useRef(false);
  useEffect(() => {
    if (!navScrollReady.current) {
      navScrollReady.current = true;
      return;
    }
    // Entering a new step view (commit → Budget, advance/back/jump, or back to
    // the fork): bring the top of the form into view so the new heading — and
    // the step dots once framed — are visible. rAF lets the swapped content lay
    // out first.
    const id = requestAnimationFrame(() =>
      scrollIntoViewSoft(formCardRef.current, "start"),
    );
    return () => cancelAnimationFrame(id);
  }, [currentStep, onDestinationScreen, scrollIntoViewSoft]);

  // Exact-city reveal: rendered instantly, so scroll + focus on the next frame.
  // Keyed on destinationMode alone (read onDestinationScreen via the ref) so it
  // fires on the mode tap but NOT when merely returning to the fork — that path
  // changes onDestinationScreen, which this effect ignores. Region is handled
  // on its expand transitionend instead (it animates open over 300ms).
  useEffect(() => {
    if (!stateRef.current.onDestinationScreen) return;
    if (destinationMode !== "exact_city") return;
    // Wait for the other tiles' collapse to finish before focusing/scrolling so
    // the (possible) scroll never stacks on top of the layout animation and
    // flings the tile. Instant under reduced motion (collapse doesn't animate).
    const settle = prefersReducedMotion() ? 0 : 320;
    const id = window.setTimeout(
      () => revealInput(exactInputRef.current),
      settle,
    );
    return () => window.clearTimeout(id);
  }, [destinationMode, revealInput, prefersReducedMotion]);

  // Region reveal: the panel is rendered the instant "I know the region" is
  // tapped (no height animation any more — see collapsedSettled), so we wait
  // the same settle beat for the non-chosen tiles to fade + leave flow, then
  // scroll the input into view and focus it in a single move. Mirrors the
  // exact-city reveal above; replaces the old grid-template-rows transitionend
  // trigger. Instant under reduced motion.
  useEffect(() => {
    if (!stateRef.current.onDestinationScreen) return;
    if (destinationMode !== "specific") return;
    const settle = prefersReducedMotion() ? 0 : 320;
    const id = window.setTimeout(
      () => revealInput(regionInputRef.current),
      settle,
    );
    return () => window.clearTimeout(id);
  }, [destinationMode, revealInput, prefersReducedMotion]);

  // Surprise "fill, then carry you in": on tap the coral wash spreads across
  // the ticket, then after a short beat we commit + slide into the wizard — so
  // it reads as the tile filling and carrying you in, not an instant cut.
  // Under reduced motion the fill is shown at full (no spread) for a brief
  // beat, then advance. Does not change chooseDestination — only schedules it.
  const [surpriseCommitting, setSurpriseCommitting] = useState(false);
  // Coral commit curtain: a full-card coral overlay (rendered at card level,
  // below) that bridges the fork→budget swap so the surprise coral never reverts
  // to white. Decoupled from surpriseCommitting so we can (1) raise it BEFORE the
  // fork unmounts and (2) hold it until the budget has actually PAINTED
  // underneath — not a fixed timeout a throttled phone can miss.
  const [commitCurtain, setCommitCurtain] = useState(false);
  useEffect(() => {
    // Reset on return to the fork so the surprise ticket isn't stuck filled and
    // no stale curtain lingers.
    if (onDestinationScreen) {
      setSurpriseCommitting(false);
      setCommitCurtain(false);
    }
  }, [onDestinationScreen]);
  // Release the curtain only AFTER the budget step has painted underneath. Two
  // rAFs straddle a full frame (rAF callbacks run just before paint, so the
  // second fires after the browser has painted the just-mounted budget), then a
  // small floor for very slow devices. Only then do we fade the curtain out
  // (AnimatePresence exit) — so there is never a frame where the curtain is gone
  // but the budget isn't drawn. This is the robustness the old fixed 150ms hold
  // lacked. Instant under reduced motion.
  useEffect(() => {
    if (!commitCurtain || onDestinationScreen) return;
    let raf1 = 0;
    let raf2 = 0;
    let timer = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        timer = window.setTimeout(
          () => setCommitCurtain(false),
          prefersReducedMotion() ? 0 : 80,
        );
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timer);
    };
  }, [commitCurtain, onDestinationScreen, prefersReducedMotion]);

  // Coral suppression: the surprise tile's coral content (badge + dice) is
  // unmounted the instant a region/exact ticket is *pressed* (pointerdown),
  // not when the click commits. forkChoosing flips on the click, a few frames
  // later — by then the browser has already painted the pressed state with the
  // coral still mounted (the one-frame flash). Gating on pointerdown removes it
  // before that paint. forkChoosing keeps it gated after commit; this resets
  // whenever we're back to the neutral surprise default or the press is aborted.
  const [coralPressed, setCoralPressed] = useState(false);
  useEffect(() => {
    if (destinationMode === "surprise") setCoralPressed(false);
  }, [destinationMode]);
  function handleSurprise() {
    if (surpriseCommitting) return;
    setSurpriseCommitting(true);
    const delay = prefersReducedMotion() ? 200 : 360;
    window.setTimeout(() => {
      // Raise the coral curtain FIRST — it paints over the still-present, already
      // coral fork — THEN swap to the budget on the next frame, so the fork never
      // unmounts into an uncovered frame. Released later, once the budget has
      // painted underneath (see effect above).
      setCommitCurtain(true);
      window.requestAnimationFrame(() => chooseDestination("surprise"));
    }, delay);
  }

  // Sync the editable number-input mirror with the EUR canonical state,
  // converted into the user's selected currency. Re-runs when:
  //   - `budget` changes (slider drag, chip click, prefill from showcase)
  //   - `convert` identity changes (currency switch or rates load → user
  //     toggled the CurrencySelector and we need to re-render the big number
  //     in the new currency immediately).
  // Skipped while the input is focused so we never clobber a user's keystrokes.
  useEffect(() => {
    if (editingBudget) return;
    setBudgetInput(String(Math.round(convert(budget))));
    setBudgetError(null);
  }, [budget, convert, editingBudget]);

  function handleNumberFocus() {
    setEditingBudget(true);
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    markFormStarted();
    const raw = e.target.value;
    setBudgetInput(raw);
    // Strip currency symbols, thousands separators, whitespace before parsing
    // — the user might paste "12,500" or "$1,200" from elsewhere.
    const trimmed = raw.replace(/[^\d.]/g, "");
    if (trimmed === "") {
      setBudgetError(null);
      return;
    }
    const n = parseFloat(trimmed);
    if (!Number.isFinite(n)) {
      setBudgetError(null);
      return;
    }
    // Typed value is in the DISPLAY currency. Convert back to EUR before
    // validating against the canonical [BUDGET_MIN, BUDGET_MAX] range.
    const eur = displayToEur(n);
    if (eur < BUDGET_MIN || eur > BUDGET_MAX) {
      setBudgetError(BUDGET_RANGE_MSG);
      return;
    }
    setBudgetError(null);
    setBudget(Math.round(eur));
  }

  function handleNumberBlur() {
    setEditingBudget(false);
    const trimmed = budgetInput.replace(/[^\d.]/g, "");
    const n = parseFloat(trimmed);
    if (!Number.isFinite(n) || trimmed === "") {
      // Empty or unparseable on blur — restore the display from current budget.
      setBudgetInput(String(Math.round(convert(budget))));
      setBudgetError(null);
      return;
    }
    const eurRaw = displayToEur(n);
    const eurClamped = Math.max(
      BUDGET_MIN,
      Math.min(BUDGET_MAX, Math.round(eurRaw)),
    );
    setBudget(eurClamped);
    // Explicit input re-sync covers the case where eurClamped === budget
    // (e.g. user typed something that clamped to the same EUR value); the
    // sync useEffect wouldn't fire because `budget` didn't change, but the
    // input string still needs to snap from the typed text to the canonical.
    setBudgetInput(String(Math.round(convert(eurClamped))));
    setBudgetError(null);
  }

  // Magnetic snap on slider release: if the dragged value is within ±SNAP_PX
  // of a preset, snap exactly to it. Outside the threshold, keep the exact
  // dragged value — the slider stays continuous, not locked to presets.
  function handleSliderRelease() {
    // Annotated against the tuple element union so `nearest = p` doesn't
    // collide with the literal type inferred from `BUDGET_PRESETS[0]`
    // (which would otherwise narrow `nearest` to `500`).
    let nearest: (typeof BUDGET_PRESETS)[number] = BUDGET_PRESETS[0];
    for (const p of BUDGET_PRESETS) {
      if (Math.abs(p - budget) < Math.abs(nearest - budget)) nearest = p;
    }
    if (Math.abs(nearest - budget) <= BUDGET_SNAP_THRESHOLD) {
      setBudget(nearest);
    }
  }

  // Prefill from the VibeSearch hero section. Listening on `window` lets the
  // two components stay decoupled — VibeSearch doesn't need a ref or a
  // context to reach into this form. We never auto-submit: the user still
  // walks through the wizard, just with some fields pre-set.
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<PrefillPayload>).detail;
      if (!detail) return;
      if (detail.vibeQuery) {
        const mapped = deriveTripFormVibe(detail.vibeQuery);
        if (mapped) setVibe(mapped);
      }
      if (typeof detail.budget === "number") {
        setBudget(detail.budget);
      }
      if (detail.city) {
        const selection: CitySelection = {
          cityName: detail.city.cityName,
          countryName: detail.city.countryName,
          countryCode: detail.city.countryCode,
          lat: detail.city.lat,
          lng: detail.city.lng,
        };
        if (detail.city.kind === "region") {
          setDestinationMode("specific");
          setRegionSelection(selection);
        } else {
          setDestinationMode("exact_city");
          setExactCity(selection);
        }
        // Deep-link past the destination pre-screen: a VibeSearch prefill has
        // already decided the destination, so skip straight to Budget with the
        // selection set. The PrefillBanner carries the confirmation cue there.
        setOnDestinationScreen(false);
        // Light up the confirmation cue. The banner persists until the user
        // edits/clears the destination.
        setPrefilled({ name: detail.city.cityName, kind: detail.city.kind });
        setPrefillHighlight(true);
      }
    }
    window.addEventListener(PREFILL_EVENT, handler);
    return () => window.removeEventListener(PREFILL_EVENT, handler);
  }, []);

  // Highlight ring lifecycle: the destination inputs live on the pre-screen,
  // so when the user is on that screen with a live prefill, fade the ring
  // after 1.5s — a momentary "look here" rather than a permanent decoration.
  // (A VibeSearch prefill skips the pre-screen, so the ring simply won't show
  // there; the PrefillBanner carries the cue on Budget instead.) If the
  // highlight gets cleared earlier (by an edit, see below), this is a no-op.
  useEffect(() => {
    if (!onDestinationScreen || !prefillHighlight) return;
    const t = window.setTimeout(() => setPrefillHighlight(false), 1500);
    return () => window.clearTimeout(t);
  }, [onDestinationScreen, prefillHighlight]);

  // Auto-dismiss the banner + highlight when the user edits the destination
  // away from the pre-filled state. The cue is only for the initial arrival
  // — once they've engaged, we get out of the way.
  useEffect(() => {
    if (!prefilled) return;
    const sourceMode = prefilled.kind === "region" ? "specific" : "exact_city";
    const sourceValue =
      prefilled.kind === "region" ? regionSelection : exactCity;
    const stillValid =
      destinationMode === sourceMode && sourceValue?.cityName === prefilled.name;
    if (!stillValid) {
      setPrefilled(null);
      setPrefillHighlight(false);
    }
  }, [destinationMode, exactCity, regionSelection, prefilled]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (document.activeElement?.tagName === "TEXTAREA") return;
      const s = stateRef.current;
      if (s.loading) return;
      // On the destination pre-screen, Enter must not advance the numbered
      // wizard — the destination is committed by choosing an option instead.
      if (s.onDestinationScreen) return;
      if (s.currentStep < 3) {
        setSkipEntryAnim(false);
        setDirection("forward");
        setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
      } else {
        handleSubmit(
          s.budget,
          s.range,
          s.travelers,
          s.vibe,
          s.originCity,
          s.destinationMode,
          s.regionSelection,
          s.exactCity,
        );
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSubmit(
    b: number,
    r: DateRange | undefined,
    t: number,
    v: string,
    o: string,
    m: "surprise" | "specific" | "exact_city",
    region: CitySelection | null,
    city: CitySelection | null,
  ) {
    // Submitting is itself a meaningful interaction — guarantees
    // trip_form_started precedes trip_generated even on the keyboard-only
    // (Enter-to-advance) path that bypasses the field handlers. Inlined (rather
    // than calling markFormStarted) so handleSubmit doesn't close over a
    // component-scope function, which would make the keyboard-shortcut effect's
    // empty dep array noisy. No-op if already fired.
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      track("trip_form_started");
    }
    // Null-safe — `r` can be undefined if a retry fires before the user has
    // picked dates or any other edge case where state is stale. Without `?.`
    // the `.from` deref crashes.
    if (!r?.from || !r?.to) return;
    // Both autocomplete modes require a picked selection.
    if (m === "specific" && !region) return;
    if (m === "exact_city" && !city) return;
    // Clear any prior error so a retry cleanly shows the loading overlay
    // again instead of overlapping the error screen.
    setSubmitError(null);
    setInlineSubmitError(null);
    setLoading(true);
    try {
      // Build the wire-level `destinationInput` string from the picked
      // selection. Region (place:country) results have name===country, so
      // we collapse that to just the name. Cities/towns/states render as
      // "Name, Country".
      const labelOf = (sel: CitySelection): string =>
        sel.countryName && sel.countryName !== sel.cityName
          ? `${sel.cityName}, ${sel.countryName}`
          : sel.cityName;
      let destinationInput: string | undefined;
      if (m === "specific" && region) destinationInput = labelOf(region);
      else if (m === "exact_city" && city) destinationInput = labelOf(city);

      // Emit all three choices explicitly so the backend decides the
      // destination count deterministically instead of guessing. Internal UI
      // state uses `specific` for the region tile; map it to the wire value
      // `region`. `exact_city` and `surprise` pass through unchanged.
      const wireMode: "surprise" | "region" | "exact_city" =
        m === "surprise" ? "surprise" : m === "exact_city" ? "exact_city" : "region";

      const requestBody = {
        budget: b,
        checkIn: toIso(r.from),
        checkOut: toIso(r.to),
        travelers: t,
        vibe: v,
        originCity: o,
        destinationMode: wireMode,
        destinationInput,
      };

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        // Read the raw text first so we can log it even when JSON.parse
        // fails. The previous logger discarded everything except `error`,
        // so a body like `{error:"...",message:"...",stage:"...",detail:"..."}`
        // showed up in console as `{status: …, error: undefined}` once any
        // field name shifted.
        const rawText = await res.clone().text().catch(() => "");
        let body: {
          error?: string;
          stage?: string;
          detail?: string;
          message?: string;
          upstreamStatus?: number;
        } = {};
        try {
          body = rawText ? JSON.parse(rawText) : {};
        } catch {
          // leave body empty; rawText preserved for the log
        }
        console.error("[TripForm] Trip create failed:", {
          status: res.status,
          statusText: res.statusText,
          body,
          // Only include raw text when parsing failed, so JSON responses
          // don't double-log.
          rawBody: Object.keys(body).length === 0 ? rawText : undefined,
        });

        setLoading(false);

        // Validation rejections: inline message, user can fix and retry.
        // The form is still usable.
        if (body.stage === "validation" || body.stage === "parse") {
          setInlineSubmitError(
            body.detail ||
              body.message ||
              "Please check your inputs and try again.",
          );
          return;
        }

        // Upstream timeout — we waited 60s and n8n didn't answer.
        if (body.stage === "upstream_timeout" || res.status === 504) {
          setSubmitError({
            heading: "The trip planner timed out",
            sub: "It didn't respond in time. Please try again in a moment.",
          });
          return;
        }

        // Upstream unreachable or non-2xx — covers DNS, network, n8n 5xx,
        // and the legacy 503 from earlier versions of the route.
        if (
          body.stage === "upstream_unreachable" ||
          body.stage === "upstream_error" ||
          res.status === 503 ||
          body.error === "upstream_unavailable"
        ) {
          setSubmitError({
            heading: "Our trip planner didn't respond",
            sub: "Couldn't reach the planner service right now. Please try again in a moment.",
          });
          return;
        }

        // Anything else (internal / unknown) — generic mascot screen.
        setSubmitError({
          heading: "Something glitched",
          sub: body.detail || "Give it another shot in a moment.",
        });
        return;
      }
      const { tripId, firstDestinationId, destinationCount } =
        (await res.json()) as {
          tripId: string;
          firstDestinationId?: string | null;
          destinationCount?: number;
        };
      // A `specific` query can legitimately come back with multiple
      // destinations (a region like "Sardinia" → several cities). Only
      // deep-link to detail when exactly one destination was returned;
      // otherwise show the results selector.
      const target =
        destinationCount === 1 && firstDestinationId
          ? `/trip/${tripId}?d=${firstDestinationId}`
          : `/trip/${tripId}`;
      // Activation funnel: the n8n response came back OK and we have a trip to
      // render — this is the `trip_generated` conversion point. Fire-and-forget.
      track("trip_generated", {
        vibe: v,
        budget: b,
        nights: r?.from && r?.to ? computeNights(r.from, r.to) : null,
        travelers: t,
        origin: o,
        destination: destinationInput ?? null,
        currency: stateRef.current.selectedCurrency,
      });
      // Defer the actual navigation: hand the URL to the LoadingOverlay,
      // which fires `onReady` immediately in default-quote mode or after
      // the Pack-the-Suitcase reveal sequence when the user opted in.
      setPendingRedirect(target);
    } catch (err) {
      console.error("[TripForm] submit error:", err);
      // A thrown fetch() = network failure reaching our own API (offline,
      // CORS, request aborted). Same user-facing copy as upstream-down.
      setSubmitError({
        heading: "Our trip planner didn't respond",
        sub: "Couldn't reach the planner service right now. Please try again in a moment.",
      });
      setLoading(false);
    }
  }

  function handleNext() {
    markFormStarted();
    setSkipEntryAnim(false);
    setDirection("forward");
    setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  }

  function handleBack() {
    setSkipEntryAnim(false);
    setDirection("back");
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  }

  function handleJump(step: 1 | 2 | 3) {
    setSkipEntryAnim(false);
    setDirection("back");
    setCurrentStep(step);
  }

  // Commit a destination choice on the pre-screen: record which option was
  // taken (the funnel's "new screen" signal) and slide into the numbered
  // wizard at Budget. Surprise commits on tap; region/exact commit when a
  // place is selected (auto-advance). "specific" reports as "region" so the
  // event reads in the surprise/region/exact_city vocabulary.
  function chooseDestination(option: "surprise" | "specific" | "exact_city") {
    markFormStarted();
    setDestinationMode(option);
    track("destination_chosen", {
      option: option === "specific" ? "region" : option,
    });
    setDirection("forward");
    // Appear in the wizard instantly (no opacity fade) so the coral fill hands
    // straight off to the form — no white-card beat in between.
    setSkipEntryAnim(true);
    setOnDestinationScreen(false);
  }

  // Return from Budget to the destination pre-screen to change the choice.
  function handleBackToDestination() {
    setSkipEntryAnim(false);
    setDirection("back");
    setOnDestinationScreen(true);
  }

  const animClass = skipEntryAnim
    ? ""
    : direction === "forward"
    ? "animate-slide-in-right"
    : "animate-slide-in-left";

  // The "intent" path (user typed an exact city) skips the vibe selector
  // entirely. It's derived purely from destinationMode so the destination
  // screen, the Step 3 vibe visibility, and the progress label stay in sync.
  const isIntent = destinationMode === "exact_city";
  const stepLabels = isIntent ? STEP_LABELS_INTENT : STEP_LABELS_DISCOVERY;

  // Fork ticket model: by default all three are empty light "tickets" (colour
  // lives only in their icons). Choosing region/exact fills that ticket with
  // its colour and collapses the other two; "surprise" is the neutral default,
  // so it never reads as pre-selected. (Surprise commits on tap and the whole
  // fork slides away, so it has no persistent filled state here.)
  const forkChoosing =
    onDestinationScreen &&
    (destinationMode === "specific" || destinationMode === "exact_city");
  // A ticket is collapsed when another ticket is the active choice.
  const tileCollapsed = (selected: boolean) => forkChoosing && !selected;
  // While the surprise tile is being pressed-away (coralPressed, the pre-commit
  // window where the old coral-flash happened) or is leaving because a
  // region/exact ticket was chosen (forkChoosing, the lift-away exit), render
  // its content in a NEUTRAL (non-coral) palette instead of unmounting it. The
  // whole tile — dice, label, badge — then lifts away as one complete piece (no
  // empty white card), while no coral surface exists to paint a flash frame.
  const surpriseNeutral = forkChoosing || coralPressed;

  // Collapse is now Motion-driven (see the fork JSX below). Non-chosen tickets
  // simply `return null` the instant a choice is made; <AnimatePresence
  // mode="popLayout"> pops them out of flow and fades them (opacity, compositor)
  // while the chosen ticket's `layout` prop FLIP-slides it up into the vacated
  // space via transform — a real glide, not the old fade-then-reflow snap. No
  // grid-rows animation, no collapsedSettled timing flag any more.

  // Region + exact share ONE ticket template (rendered from this config) so
  // their fill / expand / collapse / checkmark behaviour can never drift apart.
  // Per-ticket colours are full literal class strings here (not interpolated)
  // so Tailwind statically generates them. The neutral "surprise" ticket is its
  // own block above the map because it commits on tap instead of revealing.
  const placeTickets = [
    {
      mode: "specific" as const,
      label: "I know the region",
      subtext: "Country or area",
      Icon: PinIcon,
      accent: "#0D7377",
      delay: "70ms",
      selection: regionSelection,
      fillClass: "bg-gradient-to-br from-[#0F8589] to-[#0D7377]",
      focusRing: "focus-visible:ring-[#0D7377]",
      selectedShadow: "shadow-[0_16px_38px_-10px_rgba(13,115,119,0.6)]",
      iconIdleClass: "bg-[#0D7377]/10 ring-[#0D7377]/15 text-[#0D7377]",
    },
    {
      mode: "exact_city" as const,
      label: "I know the exact city",
      subtext: "One city, detailed",
      Icon: TargetIcon,
      accent: "#1B3A4B",
      delay: "140ms",
      selection: exactCity,
      fillClass: "bg-gradient-to-br from-[#274C5E] to-[#1B3A4B]",
      focusRing: "focus-visible:ring-[#1B3A4B]",
      selectedShadow: "shadow-[0_16px_38px_-10px_rgba(27,58,75,0.55)]",
      iconIdleClass: "bg-[#1B3A4B]/10 ring-[#1B3A4B]/15 text-[#1B3A4B]",
    },
  ];

  return (
    <>
      <div
        ref={formCardRef}
        data-fork={onDestinationScreen}
        className={`relative w-full scroll-mt-6 ${
          onDestinationScreen
            ? ""
            : "bg-card rounded-3xl border border-accent/10 p-8 sm:p-10 md:p-14"
        }`}
        style={
          onDestinationScreen
            ? undefined
            : {
                boxShadow:
                  "0 25px 60px rgba(255, 107, 71, 0.08), 0 4px 20px rgba(0, 0, 0, 0.06)",
              }
        }
      >
        {/* Triply presence + step dots are form chrome — they belong to the
            numbered wizard, not the frameless "choose your adventure" fork.
            Both stay hidden until a mode is chosen and the white card begins. */}
        {!onDestinationScreen && (
          <TriplyFormPresence
            budget={budget}
            travelers={travelers}
            vibe={vibe}
            originCity={originCity}
            range={range}
            nights={nights}
            loading={loading}
          />
        )}
        {/* Dots count only the numbered wizard (Budget/When/Vibe-or-From).
            The destination pre-screen sits before them, so they stay hidden
            until the user commits a destination. */}
        {!onDestinationScreen && (
          <ProgressDots currentStep={currentStep} onJump={handleJump} labels={stepLabels} />
        )}

        {/* Mobile-only inline Triply, sits under the progress dots. The
            desktop variant above is hidden on small viewports; this one is
            hidden on md+, so each breakpoint sees exactly one Triply. */}
        {!onDestinationScreen && (
          <TriplyFormPresenceMobile
            budget={budget}
            travelers={travelers}
            vibe={vibe}
            originCity={originCity}
            range={range}
            nights={nights}
            loading={loading}
          />
        )}

        {prefilled && (
          <PrefillBanner
            cityName={prefilled.name}
            onDismiss={() => {
              setPrefilled(null);
              setPrefillHighlight(false);
            }}
          />
        )}

        <div
          key={onDestinationScreen ? "destination" : currentStep}
          className={animClass}
        >
          {/* ── Destination pre-screen ───────────────────────────────────
              Sits BEFORE the numbered wizard. Three full-width rows: the
              discovery pair (Surprise / Region) on top, a thin divider, then
              the accent-tinted exact-city row. Surprise commits on tap;
              region/exact reveal the relocated autocompletes and commit
              (auto-advance) when a place is selected. Tapping an already-
              selected region/exact row re-commits — the path back from Budget
              when the user only wanted to review. */}
          {onDestinationScreen ? (
            <div className="space-y-7">
              <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a]">
                  Where are we headed?
                </h2>
                <p className="text-sm md:text-base text-[#1a1a1a]/60 mt-3 font-medium">
                  Let us surprise you, narrow it to a region, or name the exact
                  city.
                </p>
              </div>

              {/* `relative` is REQUIRED: <AnimatePresence mode="popLayout">
                  yanks each exiting ticket to position:absolute so the chosen
                  ticket can slide up immediately. An absolutely-positioned
                  exiting tile anchors to its nearest positioned ancestor — so
                  without `relative` here it jumps far up the tree and jitters
                  out (the "stays a moment then janky disappears" bug). With it,
                  the leaving tile fades in place while the chosen one glides. */}
              <div className="relative">
                {/* Three empty light "tickets" by default — colour lives only
                    in each icon (coral / teal / ink). Choosing region or exact
                    fills that ticket with its colour via a spreading wash and
                    collapses the other two; the neutral "surprise" default
                    leaves all three equal. Non-chosen tickets exit via
                    AnimatePresence while the chosen one FLIP-slides up. */}

                {/* Surprise me — coral. Empty ticket with the POPULAR badge;
                    washes coral on press, then commits + slides away. */}
                <LayoutGroup>
                <AnimatePresence mode="popLayout">
                {!tileCollapsed(false) && (
                    <motion.div
                      key="surprise"
                      // layout="position" (not full layout) — the tiles never
                      // resize, they only move, so we animate position only. Full
                      // `layout` would also interpolate size and can stutter.
                      layout="position"
                      // Coral dice/badge are render-gated out via forkChoosing
                      // before this exit runs, so the tile leaving is plain white
                      // — no coral frame can paint.
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.3, ease: "easeOut" } }}
                      // Soft dissolve: fade in place only — no lift, no scale, no
                      // directional motion. `layout` (popLayout on the parent)
                      // closes the gap via transform on a gentle tween. Nothing
                      // flies away, so no half-gone tile ever exposes a gap, and
                      // surprise's already-neutral content just fades out calmly.
                      exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.24, ease: "easeOut" } }}
                      // Gap-close via transform (FLIP), calm ease-out settle, no
                      // spring overshoot. transform-gpu promotes the tile to its
                      // own compositor layer so the slide stays smooth at 4x CPU.
                      transition={{ layout: reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                      className="pb-3 w-full transform-gpu"
                    >
                      <button
                        type="button"
                        onClick={handleSurprise}
                        className={`group/surprise relative w-full overflow-hidden flex items-center gap-4 rounded-3xl px-5 py-5 text-left bg-white border text-[#1a1a1a] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B47] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFE4CC] ${
                          surpriseCommitting
                            ? "border-transparent shadow-[0_16px_38px_-10px_rgba(255,107,71,0.6)]"
                            : "border-[#1a1a1a]/10 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.16)] active:scale-[0.97] motion-safe:hover:-translate-y-0.5"
                        }`}
                        style={{ minHeight: "48px" }}
                      >
                        {/* Coral press wash on tap. Only mounted while surprise
                            is a live choice — kept out during the press-away /
                            leaving window (surpriseNeutral) so this full-bleed
                            coral can't bleed through another tile's selection
                            transition. (It only paints on the surprise button's
                            own :active, so removing it here changes nothing
                            visible — belt-and-suspenders against a coral frame.) */}
                        {!surpriseNeutral && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-[#FF6B47] opacity-0 transition-opacity duration-200 group-active/surprise:opacity-100 motion-reduce:transition-none"
                          />
                        )}
                        {/* Commit fill — the SAME cross-fade mechanism as the
                            region/exact tiles: opacity 0→1 over a soft coral
                            gradient (with the dice/label colours cross-fading in
                            sync below), NOT the old left-to-right scaleX wipe, so
                            all three tiles fill identically. Held during the beat
                            before sliding into the wizard. Instant under reduced
                            motion (initial=false → resting at full coverage). */}
                        {surpriseCommitting && (
                          <motion.span
                            aria-hidden
                            initial={reduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
                            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FF7A57] to-[#FF6B47]"
                          />
                        )}
                        {/* Dice chip — ALWAYS mounted so the tile lifts away as a
                            complete piece (no empty-white-card frame). Coral only
                            in the neutral-default and surprise-commit states; the
                            instant the tile is pressed-away / leaving
                            (surpriseNeutral) it flips to a NEUTRAL ink palette, so
                            there is no coral surface to flash during press/collapse.
                            Replaces the old unmount-on-press gate. */}
                        <span
                            className={`relative z-10 shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl ring-1 ring-inset transition-[transform,color,background-color] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-safe:group-hover/surprise:-rotate-12 motion-safe:group-active/surprise:-rotate-[24deg] motion-safe:group-active/surprise:scale-90 ${
                              surpriseNeutral
                                ? "bg-[#1a1a1a]/[0.05] ring-[#1a1a1a]/10 text-[#1a1a1a]/70"
                                : surpriseCommitting
                                ? "bg-white/20 ring-white/25 text-white"
                                : "bg-[#FF6B47]/10 ring-[#FF6B47]/15 text-[#FF6B47] group-active/surprise:bg-white/20 group-active/surprise:text-white"
                            }`}
                          >
                            {/* Inner wrapper carries the idle tumble so the chip's
                                hover/press rotate composes without conflict. */}
                            <span className="inline-flex animate-dice-idle">
                              <DiceIcon color="currentColor" size={30} />
                            </span>
                          </span>
                        <span className="relative z-10 flex-1 min-w-0 pr-20">
                          <span
                            className={`block text-xl font-bold leading-tight transition-colors duration-300 motion-reduce:transition-none ${
                              surpriseCommitting ? "text-white" : "group-active/surprise:text-white"
                            }`}
                          >
                            Surprise me
                          </span>
                          <span
                            className={`block text-sm mt-1 leading-snug transition-colors duration-300 motion-reduce:transition-none ${
                              surpriseCommitting
                                ? "text-white/85"
                                : "text-[#1a1a1a]/55 group-active/surprise:text-white/85"
                            }`}
                          >
                            Let Triply pick the perfect match for your vibe
                          </span>
                        </span>
                        {/* "Popular" badge — ALWAYS mounted so the leaving tile
                            stays complete. Coral outline (border + text on white,
                            no fill) in the neutral-default / commit states; flips
                            to a NEUTRAL grey outline the instant the tile is
                            pressed-away / leaving (surpriseNeutral), so no coral —
                            not even an outline — can paint a flash frame. */}
                        <span
                            className={`absolute z-10 top-4 right-4 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${
                              surpriseNeutral
                                ? "bg-white text-[#1a1a1a]/45 border-[#1a1a1a]/15"
                                : surpriseCommitting
                                ? "bg-white text-[#FF6B47] border-transparent"
                                : "bg-white text-[#FF6B47] border-[#FF6B47]/55 group-active/surprise:bg-transparent group-active/surprise:text-white group-active/surprise:border-white/70"
                            }`}
                          >
                            Popular
                          </span>
                      </button>
                    </motion.div>
                )}

                {/* Region + exact — rendered from ONE shared template
                    (placeTickets) so their fill / expand / collapse / checkmark
                    behaviour stays identical and can't drift. */}
                {placeTickets.map((cfg) => {
                  const Icon = cfg.Icon;
                  const selected = destinationMode === cfg.mode;
                  // Non-chosen tickets leave the DOM immediately; AnimatePresence
                  // fades them out (opacity) while the chosen ticket's `layout`
                  // prop FLIP-slides it up into the vacated space via transform —
                  // a real glide, not a reflow snap. No collapsedSettled gating.
                  if (tileCollapsed(selected)) return null;
                  // cfg.delay is "70ms" / "140ms" — parse to seconds for Motion's
                  // entrance stagger (skipped under reduced motion).
                  const entranceDelay = reduceMotion ? 0 : parseInt(cfg.delay, 10) / 1000;
                  return (
                        <motion.div
                          key={cfg.mode}
                          layout="position"
                          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.3, ease: "easeOut", delay: entranceDelay } }}
                          // Soft dissolve: fade in place only; `layout` closes the
                          // gap via transform (gentle tween, no spring overshoot).
                          exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.24, ease: "easeOut" } }}
                          transition={{ layout: reduceMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                          className="pb-3 w-full transform-gpu"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              selected && cfg.selection
                                ? chooseDestination(cfg.mode)
                                : setDestinationMode(cfg.mode)
                            }
                            // Drop the surprise tile's coral the moment this tile
                            // is pressed — before the browser paints the pressed
                            // state — so no coral frame survives into the collapse.
                            // Restored if the press is abandoned (pointer leaves /
                            // cancels) without selecting.
                            onPointerDown={() => setCoralPressed(true)}
                            onPointerLeave={() => setCoralPressed(false)}
                            onPointerCancel={() => setCoralPressed(false)}
                            aria-expanded={selected}
                            // Transition ONLY transform (not box-shadow): the
                            // selected shadow is a large blurred layer whose
                            // per-frame repaint was the audit's #1 jank source.
                            // It now snaps on instantly, fully masked by the fill
                            // cross-fade below, so nothing paints per frame here.
                            className={`group/place relative w-full overflow-hidden flex items-center gap-4 rounded-3xl px-5 py-5 text-left transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFE4CC] ${cfg.focusRing} ${
                              selected
                                ? `bg-white text-white border border-transparent ${cfg.selectedShadow}`
                                : "bg-white border border-[#1a1a1a]/10 text-[#1a1a1a] shadow-[0_4px_16px_-6px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.16)] active:scale-[0.97] motion-safe:hover:-translate-y-0.5"
                            }`}
                            style={{ minHeight: "48px" }}
                          >
                            {/* Fill = soft opacity cross-fade (no directional
                                wipe). The icon/label/subtext colours transition in
                                sync (below) so the label never sits white-on-white
                                while the colour dissolves up — the chosen tile
                                stays fully legible throughout. */}
                            {selected && (
                              <motion.span
                                aria-hidden
                                initial={reduceMotion ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
                                className={`pointer-events-none absolute inset-0 ${cfg.fillClass}`}
                              />
                            )}
                            <span
                              className={`relative z-10 shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl ring-1 ring-inset transition-[transform,color,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none motion-safe:group-hover/place:scale-110 motion-safe:group-active/place:scale-100 ${
                                selected ? "bg-white/20 ring-white/25 text-white" : cfg.iconIdleClass
                              }`}
                            >
                              <Icon color="currentColor" size={28} />
                            </span>
                            <span className="relative z-10 flex-1 min-w-0">
                              <span
                                className={`block text-xl font-bold leading-tight transition-colors duration-300 motion-reduce:transition-none ${
                                  selected ? "text-white" : "text-[#1a1a1a]"
                                }`}
                              >
                                {cfg.label}
                              </span>
                              <span
                                className={`block text-sm mt-1 leading-snug transition-colors duration-300 motion-reduce:transition-none ${
                                  selected ? "text-white/85" : "text-[#1a1a1a]/55"
                                }`}
                              >
                                {cfg.subtext}
                              </span>
                            </span>
                            {selected && (
                              <motion.span
                                // Confirmation "settle" — a gentle spring pop
                                // (transform + opacity only) a beat after the fill
                                // starts, so selection feels acknowledged. Instant
                                // under reduced motion.
                                initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={
                                  reduceMotion
                                    ? { duration: 0 }
                                    : { type: "spring", stiffness: 500, damping: 24, delay: 0.1 }
                                }
                                className="relative z-10 shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm transform-gpu"
                              >
                                <CheckIcon color={cfg.accent} size={18} />
                              </motion.span>
                            )}
                          </button>
                        </motion.div>
                  );
                })}
                </AnimatePresence>
                </LayoutGroup>

                {/* Region autocomplete — rendered the instant the region ticket
                    is chosen (scroll + focus handled by the region reveal effect
                    above), mirroring the exact-city block below. No grid-rows
                    height animation any more: the non-chosen tickets fade out and
                    unmount, so this simply appears in the settled layout — one
                    reflow, no per-frame thrash. Selecting a region auto-advances. */}
                {destinationMode === "specific" && (
                  <motion.div
                    // Eases in a beat after the tiles settle: opacity + a 4px
                    // transform rise (NOT a layout change — it stays in flow, so
                    // the 320ms scroll/focus reveal reads a stable rect and can't
                    // be fought). transform-gpu keeps the rise on the compositor.
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut", delay: reduceMotion ? 0 : 0.08 }}
                    className={`mt-3 rounded-2xl transform-gpu transition-shadow duration-500 ${
                      prefillHighlight && prefilled?.kind === "region"
                        ? "ring-2 ring-[#0D7377]/55 ring-offset-2"
                        : ""
                    }`}
                  >
                    <CityAutocomplete
                      mode="region"
                      value={regionSelection}
                      innerInputRef={regionInputRef}
                      onChange={(sel) => {
                        setRegionSelection(sel);
                        if (sel) chooseDestination("specific");
                      }}
                      placeholder="e.g. Portugal, Sicily, Bali..."
                    />
                    <p className="mt-2 text-xs text-muted">
                      Country, region, or island — we&apos;ll find 3 great
                      spots there.
                    </p>
                  </motion.div>
                )}

                {/* Exact-city autocomplete. Selecting a city auto-advances. */}
                {destinationMode === "exact_city" && (
                  <motion.div
                    // Eases in like the region block above: opacity + 4px rise,
                    // no layout change (stable rect for the scroll/focus effect).
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut", delay: reduceMotion ? 0 : 0.08 }}
                    className={`mt-3 rounded-2xl transform-gpu transition-shadow duration-500 ${
                      prefillHighlight && prefilled?.kind === "city"
                        ? "ring-2 ring-[#0D7377]/55 ring-offset-2"
                        : ""
                    }`}
                  >
                    <CityAutocomplete
                      value={exactCity}
                      innerInputRef={exactInputRef}
                      onChange={(sel) => {
                        setExactCity(sel);
                        if (sel) chooseDestination("exact_city");
                      }}
                      placeholder="Type a city — Lisbon, Athens, Reykjavík…"
                    />
                    <p className="mt-2 text-xs text-muted">
                      Pick a specific city — we&apos;ll plan a detailed trip
                      there.
                    </p>
                  </motion.div>
                )}

                {/* Back affordance — returns to the neutral three-ticket state
                    by resetting to the "surprise" default (no commit). Only
                    shown while a region/exact ticket is filled. */}
                {forkChoosing && (
                  <button
                    type="button"
                    onClick={() => setDestinationMode("surprise")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-[#1a1a1a]/55 hover:text-[#1a1a1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFE4CC]"
                  >
                    <ArrowLeftIcon color="currentColor" size={16} />
                    Choose differently
                  </button>
                )}
              </div>
            </div>
          ) : (
          <>
          {/* Step 1 — Budget (pure) */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Heading */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
                  What&apos;s your budget per person?
                </h2>
              </div>

              {/* Currency picker */}
              <div className="flex items-center justify-center gap-2.5 text-sm text-[#1a1a1a]/60">
                <span className="font-medium">Choose your currency</span>
                <CurrencySelector />
              </div>

              {/* Hero: editable big number. Acts as both display and the
                  exact-amount entry field. The number shown reflects the
                  user's selected currency (EUR canonical state ×
                  exchange rate); typed values are parsed in the selected
                  currency and converted back to EUR for the canonical
                  state. Symbol sits in a sibling span so it always matches
                  the locale `format()` is using internally. */}
              <div className="text-center py-4">
                <div className="inline-flex items-baseline justify-center gap-2">
                  <span
                    aria-hidden="true"
                    className="text-3xl md:text-5xl font-bold text-[#FF6B47]/55 tabular-nums leading-none"
                  >
                    {currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={budgetInput}
                    onFocus={handleNumberFocus}
                    onChange={handleNumberChange}
                    onBlur={handleNumberBlur}
                    // `size` drives the input's intrinsic width — without it,
                    // an <input type=text> defaults to size=20 (~20ch wide at
                    // current font-size), which at text-8xl renders a ~960px
                    // box. text-center then centers the digits inside that
                    // giant box and the value escapes the card to the right.
                    // Sizing to the value length makes the input hug its
                    // content so it sits flush next to the € prefix.
                    size={Math.max(budgetInput.length, 1)}
                    aria-label={`Budget per person in ${selectedCurrency}`}
                    aria-invalid={budgetError ? "true" : undefined}
                    aria-describedby={budgetError ? "budget-error" : undefined}
                    className="budget-input text-7xl md:text-8xl font-bold text-[#FF6B47] leading-none tabular-nums tracking-tight bg-transparent border-0 text-center focus:outline-none"
                  />
                </div>
                <p className="text-sm text-[#1a1a1a]/50 mt-2 font-medium">
                  per person
                </p>
                {budgetError && (
                  <p
                    id="budget-error"
                    role="alert"
                    className="text-sm text-rose-600 mt-3 font-medium"
                  >
                    {budgetError}
                  </p>
                )}
              </div>

              {/* Slider with magnetic snap on release */}
              <div className="px-2">
                <input
                  type="range"
                  min={BUDGET_MIN}
                  max={BUDGET_MAX}
                  step={BUDGET_STEP}
                  value={budget}
                  onChange={(e) => {
                    markFormStarted();
                    setBudget(Number(e.target.value));
                  }}
                  onPointerUp={handleSliderRelease}
                  onTouchEnd={handleSliderRelease}
                  className="triply-slider w-full"
                  aria-label={`Budget per person in ${selectedCurrency}`}
                  aria-valuemin={BUDGET_MIN}
                  aria-valuemax={BUDGET_MAX}
                  aria-valuenow={budget}
                  style={{
                    background: `linear-gradient(to right, #FF6B47 0%, #FF6B47 ${((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%, rgba(26,26,26,0.1) ${((budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100}%, rgba(26,26,26,0.1) 100%)`,
                  }}
                />
                {/* Tick marks at presets — purely visual cue. Sit just below
                    the track so they don't crowd the thumb. */}
                <div
                  aria-hidden="true"
                  className="relative h-2 mt-1"
                >
                  {BUDGET_PRESETS.map((p) => {
                    const leftPct =
                      ((p - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
                    return (
                      <div
                        key={p}
                        className="absolute -translate-x-1/2 w-0.5 h-2 rounded-sm bg-[#1a1a1a]/25"
                        style={{ left: `${leftPct}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-[#1a1a1a]/40 font-medium">
                  <span>{format(BUDGET_MIN, { rounded: true })}</span>
                  <span>{format(BUDGET_MAX, { rounded: true })}</span>
                </div>
              </div>

              {/* Preset chips — exact-match the showcase tiers */}
              <div className="flex justify-center gap-2">
                {BUDGET_PRESETS.map((p) => {
                  const isActive = budget === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        markFormStarted();
                        setBudget(p);
                      }}
                      aria-pressed={isActive}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-[#0D7377] text-white shadow-md scale-[1.02]"
                          : "bg-[#F5F5F5] text-[#1a1a1a] hover:bg-[#0D7377]/10"
                      }`}
                    >
                      {format(p, { rounded: true })}
                    </button>
                  );
                })}
              </div>

              {/* Total helper — same wording, swept along by the new range */}
              {budget > 0 && (
                <div className="text-center">
                  <p className="text-sm text-[#1a1a1a]/55 font-medium">
                    <span className="text-[#1a1a1a]/30 mr-1.5">·</span>
                    {travelers === 1 ? (
                      <>{format(budget, { rounded: true })} solo trip budget</>
                    ) : (
                      <>
                        <span className="tabular-nums">{format(budget * travelers, { rounded: true })}</span>
                        {" "}total for {travelers} travelers
                      </>
                    )}
                  </p>
                </div>
              )}

              {fxWarning && (
                <p
                  role="status"
                  className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center font-medium"
                >
                  {fxWarning}
                </p>
              )}

              <div className="flex justify-between items-center">
                {/* Back to the destination pre-screen to change the choice. */}
                <button
                  type="button"
                  onClick={handleBackToDestination}
                  className="text-muted hover:text-[#374151] font-medium transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <Button
                  onClick={handleNext}
                  className="sm:min-w-[160px] text-lg py-4"
                  disabled={
                    !!budgetError ||
                    !!fxWarning ||
                    (destinationMode === "specific" && !regionSelection) ||
                    (destinationMode === "exact_city" && !exactCity)
                  }
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Date range + Travelers */}
          {currentStep === 2 && (
            <div>
              <div className="mb-10">
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
                  Travel Dates
                </label>

                {/* Status hint */}
                <div className="mb-3 min-h-[1.25rem]">
                  {range?.from && range?.to ? (
                    <div className="text-xs text-[#0D7377] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span>
                        {formatShort(toIso(range.from))} – {formatShort(toIso(range.to))} · {nights} {nights === 1 ? "night" : "nights"}
                        {nightsWarning && <span className="ml-2 text-amber-600">(max {MAX_NIGHTS})</span>}
                      </span>
                    </div>
                  ) : range?.from ? (
                    <p className="text-xs text-accent">Now pick your check-out day →</p>
                  ) : (
                    <div className="text-xs text-muted/60 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd"/>
                      </svg>
                      <span>Click your check-in day, then your check-out day</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  {today && (
                    <div className="rounded-2xl bg-[#FF6B47]/5 border border-[#FF6B47]/15 p-5 shadow-sm">
                    <TripCalendar
                      selected={range}
                      onSelect={handleRangeSelect}
                      today={today}
                      maxDate={maxDate}
                      onClear={() => setRange(undefined)}
                    />
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Travelers
                  </p>
                  <p className="text-xs text-muted/70">Affects recommendations</p>
                </div>
                <p className="text-xs text-muted/70 mb-4">Who&apos;s going?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TRAVELER_PRESETS.map((preset) => {
                    const isActive = travelers === preset.count;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setTravelers(preset.count)}
                        className={`
                          group relative overflow-hidden rounded-2xl py-4 px-4
                          flex flex-col items-center justify-center gap-1
                          transition-all duration-200 cursor-pointer
                          ${isActive ? "shadow-md scale-[1.02]" : "hover:scale-[1.01]"}
                        `}
                        style={{
                          backgroundColor: isActive ? preset.activeBg : "#F5F5F5",
                          color: isActive ? preset.activeText : "#1a1a1a",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = preset.hoverTint;
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) e.currentTarget.style.backgroundColor = "#F5F5F5";
                        }}
                      >
                        <div className="mb-2 h-6 flex items-center justify-center group-hover:scale-105 transition-transform">
                          {renderBubble(preset.bubble, isActive, preset.accent)}
                        </div>
                        <span className="text-base font-semibold">{preset.label}</span>
                        <span className={`text-xs ${isActive ? "opacity-90" : "opacity-50"}`}>
                          {preset.count === 1 ? "1 person" : `${preset.count}${preset.count === 5 ? "+" : ""} people`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {(() => {
                  const active = TRAVELER_PRESETS.find((p) => p.count === travelers);
                  if (!active) return null;
                  return (
                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: active.accent }}
                      />
                      <span className="text-sm text-[#1a1a1a]/70">
                        AI will suggest{" "}
                        <span className="font-semibold" style={{ color: active.accent }}>
                          {active.flavor}
                        </span>
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-muted hover:text-[#374151] font-medium transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <Button
                  onClick={handleNext}
                  disabled={!range?.from || !range?.to || nights < 1}
                  className="sm:min-w-[160px] text-lg py-4"
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — Vibe (discovery only) + Origin. The destination pick
              moved to the top of Step 1, so this step is now just the trip
              vibe and the home airport. The intent path skips the vibe block
              entirely. */}
          {currentStep === 3 && (
            <div className="space-y-8 px-1 sm:px-0">
              {!isIntent && (
                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60">
                      Trip Vibe
                    </p>
                  </div>
                  <p className="text-sm text-[#1a1a1a]/70 mb-4">What are you into?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {VIBE_PRESETS.map((preset) => {
                      const isActive = vibe === preset.value;
                      const iconColor = isActive ? "#ffffff" : preset.accent;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setVibe(preset.value)}
                          className={`
                            relative rounded-2xl py-4 px-3
                            flex flex-col items-center justify-center gap-2
                            transition-all duration-200
                            ${isActive ? "shadow-md scale-[1.02]" : "hover:scale-[1.01]"}
                          `}
                          style={{
                            backgroundColor: isActive ? preset.activeBg : "#F5F5F5",
                            color: isActive ? "#ffffff" : "#1a1a1a",
                            minHeight: "92px",
                          }}
                        >
                          <preset.Icon color={iconColor} size={32} />
                          <span className="text-sm font-semibold">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60">
                    Flying From
                  </p>
                </div>
                <p className="text-sm text-[#1a1a1a]/70 mb-4">Search for your home airport</p>
                <AirportSearch
                  defaultAirport={DEFAULT_AIRPORT}
                  onChange={(city) => setOriginCity(city)}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-muted hover:text-[#374151] font-medium transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <TagButton
                  onClick={() =>
                    handleSubmit(
                      budget,
                      range,
                      travelers,
                      vibe,
                      originCity,
                      destinationMode,
                      regionSelection,
                      exactCity,
                    )
                  }
                  disabled={
                    loading ||
                    !range?.from ||
                    !range?.to ||
                    !!fxWarning ||
                    (destinationMode === "specific" && !regionSelection) ||
                    (destinationMode === "exact_city" && !exactCity)
                  }
                  size="md"
                >
                  {loading
                    ? destinationMode === "exact_city" && exactCity
                      ? `Planning your trip to ${exactCity.cityName}…`
                      : destinationMode === "specific" && regionSelection
                        ? `Planning your trip to ${regionSelection.cityName}…`
                        : "Finding your trip…"
                    : "Find my trip →"}
                </TagButton>
              </div>

              {/* Inline validation rejection — small message under the
                  submit row so the user can fix the field without dismissing
                  a full-screen overlay. Upstream failures use ErrorOverlay
                  instead (mounted below). */}
              {inlineSubmitError && (
                <p
                  role="alert"
                  className="text-sm text-rose-600 mt-3 text-center sm:text-right font-medium"
                >
                  {inlineSubmitError}
                </p>
              )}
            </div>
          )}
          </>
          )}
        </div>

        {/* Coral commit curtain — bridges the fork→budget key-swap so the
            Surprise tile's coral NEVER reverts to white. It lives here at the
            card level (a sibling of the keyed content div, which unmounts on
            commit), so it survives the swap. Gated to appear only once the fork
            has left (surpriseCommitting && !onDestinationScreen): it mounts the
            exact frame the coral tile unmounts, already fully coral
            (initial=false → no fade-in) and matching the tile fill, holds while
            the budget paints underneath, then fades out (AnimatePresence exit)
            to reveal the form. Coral on every frame from click until the budget
            is on screen — no white frame between. Instant under reduced motion. */}
        <AnimatePresence>
          {commitCurtain && (
            <motion.div
              key="coral-commit-curtain"
              aria-hidden
              className="pointer-events-none absolute -inset-px z-40 rounded-3xl bg-gradient-to-br from-[#FF7A57] to-[#FF6B47]"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.3, ease: "easeOut" } }}
            />
          )}
        </AnimatePresence>
      </div>

      {loading && (
        <LoadingOverlay
          loadingComplete={pendingRedirect !== null}
          onReady={() => {
            if (pendingRedirect) router.push(pendingRedirect);
          }}
        />
      )}

      {submitError && (
        <ErrorOverlay
          heading={submitError.heading}
          sub={submitError.sub}
          onRetry={() =>
            handleSubmit(
              budget,
              range,
              travelers,
              vibe,
              originCity,
              destinationMode,
              regionSelection,
              exactCity,
            )
          }
          onDismiss={() => setSubmitError(null)}
        />
      )}
    </>
  );
}

function PrefillBanner({
  cityName,
  onDismiss,
}: {
  cityName: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-6 flex items-center gap-3 rounded-2xl border border-[#0D7377]/15 bg-[#0D7377]/[0.06] px-4 py-3"
    >
      <span
        className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0D7377] text-white"
        aria-hidden="true"
      >
        <CheckIcon color="currentColor" size={15} />
      </span>
      <p className="flex-1 text-sm text-[#1A1A1A] leading-snug">
        <span className="font-semibold">{cityName}</span> is locked in — set
        your budget and dates below, then plan.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-full text-[#0D7377]/70 hover:text-[#0D7377] hover:bg-[#0D7377]/10 transition-colors"
      >
        <CloseIcon color="currentColor" size={14} />
      </button>
    </div>
  );
}
