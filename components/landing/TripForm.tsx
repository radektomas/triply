"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInDays } from "date-fns";
// NOTE: the repo ships `framer-motion` (not the `motion` package), and every
// animated component here imports from "framer-motion" — so we do too. The
// AGENTS.md `motion/react` path would not resolve.
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";

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
  PlaneIcon,
  CarIcon,
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
import { type CitySelection } from "@/components/shared/CityAutocomplete";
import { DestinationFork } from "@/components/landing/DestinationFork";
import type { DestinationMode, TransportMode } from "@/lib/types";
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

// P0-4: is the currently-focused element one that owns the Enter key itself?
// Used to stop the global Enter-to-advance handler from double-firing when the
// user presses Enter inside a form control or an open autocomplete/combobox
// (picking an airport, toggling a chip, submitting a field). Guards against a
// null/SSR activeElement.
function isInteractiveEnterTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "BUTTON" ||
    tag === "A"
  ) {
    return true;
  }
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  const role = el.getAttribute("role");
  if (
    role === "option" ||
    role === "combobox" ||
    role === "listbox" ||
    role === "menuitem"
  ) {
    return true;
  }
  // Focus sitting anywhere inside an open autocomplete/combobox/dropdown.
  return !!el.closest(
    '[role="combobox"],[role="listbox"],[aria-expanded="true"]',
  );
}

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

// "How are you traveling?" segmented toggle. Plane is the default (and the
// only historical behavior); Car swaps the airport picker for a departure
// city + max-driving-time radius. Teal is the selected-chip token here,
// matching the budget preset chips.
const TRANSPORT_OPTIONS = [
  { value: "plane" as const, label: "Plane", Icon: PlaneIcon },
  { value: "car" as const, label: "Car", Icon: CarIcon },
];

// Max-driving-time chips (car mode). Values are what `maxDriveHours` submits;
// 12 renders as "12h+" — the open-ended top bucket.
const DRIVE_HOUR_OPTIONS = [
  { hours: 3, label: "3h" },
  { hours: 6, label: "6h" },
  { hours: 9, label: "9h" },
  { hours: 12, label: "12h+" },
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

// Ease-out family for content arriving (matches EASE_ENTER in DestinationFork
// so the whole fork→wizard gesture shares one motion vocabulary).
const CONTENT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
// Fork↔wizard swap: an in-place crossfade — nothing travels, nothing changes
// shape. Exits are always faster than entrances, and they OVERLAP: the
// entering branch starts SWAP_OVERLAP_DELAY_S after the exit begins, so the
// swap never shows an empty beat. Total feel ≈300ms.
const SWAP_EXIT_S = 0.18;
const SWAP_ENTER_S = 0.25;
const SWAP_OVERLAP_DELAY_S = 0.06;
// The wizard content stagger starts almost with the card fade (there's no
// morph to wait for anymore) — card and content arrive nearly together.
const CONTENT_DELAY_S = 0.08;
const CONTENT_STAGGER_S = 0.045;


function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Desktop media query for the wizard content's blur-in gate (the one viewport
// boolean that must live in JS — it feeds a framer variant, not a class).
// Subscribed via useSyncExternalStore below; module-level so the subscribe
// function identity is stable across renders (no re-subscribe churn).
const DESKTOP_MQ = "(min-width: 768px)";
function subscribeDesktopMq(onChange: () => void): () => void {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// ── Unified journey progress bar ─────────────────────────────────────────────
// ONE segmented bar for the whole planner — Destination (the fork) plus the
// three wizard steps — rendered once in the persistent parent BELOW the
// fork/wizard slot, so on commit it just advances a segment in place instead of
// blinking or jumping from a bottom bar to top dots. Replaces both the old
// top ProgressDots and the desktop-only fork JourneyBar.
//
// State per segment, keyed off the 0-based activeIndex (0 = Destination):
//   i <  activeIndex → done     (muted accent fill)
//   i === activeIndex → active  (full accent)
//   i >  activeIndex → upcoming (neutral grey)
// Tokens match the design: var(--color-accent) is #FF6B47, so the muted-done
// fill/label are that same coral at reduced alpha; upcoming reuses the old
// dots' #E5E7EB bar / #9CA3AF label. Colour advance animates via CSS
// transition-colors and is instant under prefers-reduced-motion. Per-segment
// labels are desktop-only — four uppercase labels crowd a phone — but the bars
// themselves render on every size.
function ProgressBar({
  activeIndex,
  steps,
}: {
  activeIndex: number;
  steps: string[];
}) {
  return (
    <div
      className="mt-8"
      role="group"
      aria-label={`Planner progress: step ${activeIndex + 1} of ${steps.length}, ${steps[activeIndex] ?? ""}`}
    >
      <div className="flex items-start gap-2.5">
        {steps.map((label, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div key={label} className="flex-1">
              <div
                aria-hidden
                className="h-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none"
                style={{
                  backgroundColor: active
                    ? "var(--color-accent)"
                    : done
                    ? "rgba(255,107,71,0.45)"
                    : "#E5E7EB",
                }}
              />
              <span
                aria-hidden
                className="mt-2 hidden md:block text-center text-[11px] font-semibold uppercase tracking-widest transition-colors duration-300 motion-reduce:transition-none"
                style={{
                  color: active
                    ? "var(--color-accent)"
                    : done
                    ? "rgba(255,107,71,0.75)"
                    : "#9CA3AF",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
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
  // Layer-1 anti-duplicate lock for trip generation. A synchronous ref (not
  // state — state updates lag a tick, so two rapid taps/Enters could both pass
  // a state check) that drops any submit while a request is already in flight.
  // Set just before the fetch, released in handleSubmit's finally on every
  // path (success incl. pending navigation, and error). The `loading` state
  // still drives the visual disable; this ref is the hard gate.
  const isSubmittingRef = useRef(false);

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
  // before the numbered wizard. While this is true we render that screen;
  // choosing an option flips it false and reveals the numbered wizard starting
  // at Budget. Kept separate from currentStep (1-3) so the unified ProgressBar
  // can treat Destination as its own segment (index 0) without the wizard step
  // counter ever including the pre-screen.
  const [onDestinationScreen, setOnDestinationScreen] = useState(true);
  // Bumped when a fork/wizard crossfade branch finishes exiting (AnimatePresence
  // onExitComplete). That unmount changes the shared grid cell's height without
  // re-rendering this component — the bump forces a render so the ProgressBar's
  // layout="position" can measure and animate the settle instead of snapping.
  const [swapEpoch, setSwapEpoch] = useState(0);
  // Whether the user has ever LEFT the fork for the wizard this session — lets
  // the fork tell a RETURN (Budget → Back: tiles reassemble with a stagger)
  // apart from the initial page load (tiles are simply there). A ref is enough:
  // it's read at render time on the re-render that shows the fork again, which
  // is always after this effect has run at least once with the wizard visible.
  const wizardVisitedRef = useRef(false);
  useEffect(() => {
    if (!onDestinationScreen) wizardVisitedRef.current = true;
  }, [onDestinationScreen]);
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
  // Plane keeps the historical form exactly as-is; Car swaps the airport
  // picker for departureCity + maxDriveHours below. Plane is the default so
  // untouched sessions submit the same payload as before (plus the additive
  // transportMode field).
  const [transportMode, setTransportMode] = useState<TransportMode>("plane");
  const [departureCity, setDepartureCity] = useState("");
  const [maxDriveHours, setMaxDriveHours] = useState(6);
  const [destinationMode, setDestinationMode] = useState<DestinationMode>("surprise");
  // Both `region` and `exact_city` modes use Photon autocomplete —
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
    transportMode,
    departureCity,
    maxDriveHours,
    destinationMode,
    regionSelection,
    exactCity,
    loading,
    // Mirror validation state so the Enter-key handler can honor the exact same
    // disabled conditions as the Next/Submit buttons (P0-4).
    budgetError,
    fxWarning,
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
      transportMode,
      departureCity,
      maxDriveHours,
      destinationMode,
      regionSelection,
      exactCity,
      loading,
      budgetError,
      fxWarning,
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

  // (revealInput + the region/exact reveal effects moved into DestinationFork.)

  // Skip the initial mount so the page doesn't auto-scroll to the form on load.
  const navScrollReady = useRef(false);
  useEffect(() => {
    if (!navScrollReady.current) {
      navScrollReady.current = true;
      return;
    }
    // Entering a new step view (commit → Budget, advance/back/jump, or back to
    // the fork): re-anchor the viewport. The target is the section's
    // data-planner-frame wrapper — heading + card together — NOT the card
    // alone: the "Let's find your escape." heading unhides at the exact commit
    // moment (data-fork flips false), and anchoring the card would shove that
    // newly-visible heading off the top of the viewport. On the fork the
    // heading is display:none, so the wrapper's top equals the card's top and
    // fork/Back framing is identical to before. Falls back to the card if
    // TripForm is ever mounted outside PlannerSection. rAF lets the swapped
    // content lay out first so the scroll runs WITH the crossfade.
    const id = requestAnimationFrame(() => {
      const frame =
        formCardRef.current?.closest<HTMLElement>("[data-planner-frame]") ??
        formCardRef.current;
      scrollIntoViewSoft(frame, "start");
    });
    return () => cancelAnimationFrame(id);
  }, [currentStep, onDestinationScreen, scrollIntoViewSoft]);

  // The fork→wizard transition is a fast IN-PLACE crossfade under the
  // AnimatePresence below (the earlier coral commit curtain and the layoutId
  // shared-element morph that replaced it are both gone — the morph read as
  // elements flying around the screen). Old scene fades out, new scene fades
  // in, overlapping, in the same grid cell. DestinationFork calls
  // onCommit(option) = chooseDestination directly. With no layout animation
  // there's nothing to clip mid-flight, so the card is statically
  // overflow-visible and the inline-absolute dropdowns are never at risk.

  // Desktop-only blur on the wizard content entrance. Animating `filter` is
  // expensive, and ~90% of traffic is mobile — so mobile keeps opacity+y only
  // and md+ adds the 3px blur-in. This is the ONLY viewport boolean in the
  // fork/wizard tree, and it gates ONLY this framer blur variant (which can't
  // be a Tailwind class) — all tile/fork SIZING is pure CSS md:/max-md:
  // classes with no JS involvement. useSyncExternalStore (not useState+effect)
  // so the value is read synchronously from matchMedia on mount and after
  // every change event: it can never start stale, lag a resize, or stick
  // after a mobile↔desktop round trip. Server snapshot is false (mobile-first,
  // matching the CSS default).
  const desktopFx = useSyncExternalStore(
    subscribeDesktopMq,
    () => window.matchMedia(DESKTOP_MQ).matches,
    () => false,
  );

  // Wizard content entrance: children stagger in (opacity + y, blur on md+)
  // starting at ~60% of the card morph. Under reduced motion the container
  // mounts with initial={false}, so these variants never animate — the end
  // state is identical, just instant.
  const contentContainer: Variants = {
    hidden: {},
    show: {
      transition: {
        delayChildren: CONTENT_DELAY_S,
        staggerChildren: CONTENT_STAGGER_S,
      },
    },
  };
  const contentItem: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
      ...(desktopFx ? { filter: "blur(3px)" } : {}),
    },
    show: {
      opacity: 1,
      y: 0,
      ...(desktopFx ? { filter: "blur(0px)" } : {}),
      transition: { duration: 0.4, ease: CONTENT_EASE },
    },
  };

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
          setDestinationMode("region");
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
    const sourceMode = prefilled.kind === "region" ? "region" : "exact_city";
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
      // P0-4: do nothing when focus is on an interactive control. Enter there
      // belongs to that control (pick an airport from the dropdown, toggle a
      // vibe/traveler chip, submit a field) — NOT to advancing the wizard.
      // Previously only TEXTAREA was excluded, so Enter double-fired: it
      // selected the control AND advanced/submitted, and it bypassed the
      // disabled-button validation (e.g. advanced past the dates step with no
      // dates picked).
      if (isInteractiveEnterTarget(document.activeElement)) return;

      const s = stateRef.current;
      if (s.loading) return;
      // On the destination pre-screen, Enter must not advance the numbered
      // wizard — the destination is committed by choosing an option instead.
      if (s.onDestinationScreen) return;

      const nights =
        s.range?.from && s.range?.to
          ? computeNights(s.range.from, s.range.to)
          : 0;

      if (s.currentStep < 3) {
        // Mirror the current step's Next-button disabled condition exactly so
        // Enter can never advance past a step whose Next button is disabled.
        if (s.currentStep === 1) {
          // matches the Step-1 Next button (budget/fx/destination validation)
          if (s.budgetError || s.fxWarning) return;
          if (s.destinationMode === "region" && !s.regionSelection) return;
          if (s.destinationMode === "exact_city" && !s.exactCity) return;
        } else if (s.currentStep === 2) {
          // matches the Step-2 Next button (dates picked, ≥1 night)
          if (!s.range?.from || !s.range?.to || nights < 1) return;
        }
        setSkipEntryAnim(false);
        setDirection("forward");
        setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
      } else {
        // Mirror the Step-3 submit-button disabled condition exactly.
        if (!s.range?.from || !s.range?.to) return;
        if (s.fxWarning) return;
        if (s.destinationMode === "region" && !s.regionSelection) return;
        if (s.destinationMode === "exact_city" && !s.exactCity) return;
        if (s.transportMode === "car" && s.departureCity.trim().length < 2)
          return;
        handleSubmit(
          s.budget,
          s.range,
          s.travelers,
          s.vibe,
          s.originCity,
          s.destinationMode,
          s.regionSelection,
          s.exactCity,
          s.transportMode,
          s.departureCity,
          s.maxDriveHours,
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
    m: DestinationMode,
    region: CitySelection | null,
    city: CitySelection | null,
    transport: TransportMode,
    depCity: string,
    driveHours: number,
  ) {
    // A generation request is already in flight — drop this call entirely so
    // double-taps / repeated Enter can never fire a second POST /api/trips.
    if (isSubmittingRef.current) return;
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
    if (m === "region" && !region) return;
    if (m === "exact_city" && !city) return;
    // Car mode requires a typed departure city (mirrors the submit-button
    // disabled condition — this is the last-resort guard for stale calls).
    const isCar = transport === "car";
    const trimmedDeparture = depCity.trim();
    if (isCar && trimmedDeparture.length < 2) return;
    // Clear any prior error so a retry cleanly shows the loading overlay
    // again instead of overlapping the error screen.
    setSubmitError(null);
    setInlineSubmitError(null);
    isSubmittingRef.current = true;
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
      if (m === "region" && region) destinationInput = labelOf(region);
      else if (m === "exact_city" && city) destinationInput = labelOf(city);

      // Emit all three choices explicitly so the backend decides the
      // destination count deterministically instead of guessing. Internal UI
      // state now uses the same vocabulary as the wire
      // (`surprise`/`region`/`exact_city`), so this is a straight pass-through.
      // (The region tile's internal value used to differ and was remapped here;
      // it no longer does, and the wire payload is byte-identical to before.)
      const wireMode: DestinationMode = m;

      // Car mode submits the typed departure city as originCity too — the
      // API requires a non-empty originCity, and every downstream consumer
      // (cache key, history, display) reads it as "where the trip starts".
      // Plane keeps the airport-derived originCity byte-identical to before;
      // transportMode itself is additive, and departureCity/maxDriveHours
      // are only sent for car, so plane payloads stay backwards compatible.
      const effectiveOrigin = isCar ? trimmedDeparture : o;
      const requestBody = {
        budget: b,
        checkIn: toIso(r.from),
        checkOut: toIso(r.to),
        travelers: t,
        vibe: v,
        originCity: effectiveOrigin,
        destinationMode: wireMode,
        destinationInput,
        transportMode: transport,
        ...(isCar
          ? {
              departureCity: trimmedDeparture,
              // No drive radius for an exact city — the chips are hidden
              // there, so `driveHours` could be a stale pick from an earlier
              // surprise/region session. Omitting it (rather than sending the
              // hidden value) lets normalizeInput apply its uniform default
              // of 6, which also keeps the cache key stable for exact_city
              // car trips.
              ...(m === "exact_city" ? {} : { maxDriveHours: driveHours }),
            }
          : {}),
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

        // Upstream timeout — we waited 120s and n8n didn't answer.
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

        // P1-11: rate limited (HTTP 429). Two sources: the per-user daily cap
        // enforced in the route (stage "rate_limit", carries a specific detail)
        // and the per-IP burst throttle in proxy.ts (raw 429, no stage). Show
        // the real reason instead of the generic "Something glitched".
        if (res.status === 429 || body.stage === "rate_limit") {
          if (body.stage === "rate_limit") {
            setSubmitError({
              heading: "Daily limit reached",
              sub:
                body.detail ||
                "You've hit today's trip-generation limit. It resets at midnight UTC.",
            });
          } else {
            setSubmitError({
              heading: "You're going a bit fast",
              sub:
                body.detail ||
                body.message ||
                "Too many requests in a short time. Give it a moment and try again.",
            });
          }
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
      // A `region` query can legitimately come back with multiple
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
        origin: effectiveOrigin,
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
    } finally {
      // Release the anti-duplicate lock on every path. On success `loading`
      // stays true (LoadingOverlay owns the pending navigation), so the button
      // remains disabled — the ref just stops being the gate.
      isSubmittingRef.current = false;
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

  // Commit a destination choice on the pre-screen: record which option was
  // taken (the funnel's "new screen" signal) and slide into the numbered
  // wizard at Budget. Surprise commits on tap; region/exact commit when a
  // place is selected (auto-advance). The internal mode vocabulary now matches
  // both the wire and the analytics vocabulary (surprise/region/exact_city).
  function chooseDestination(option: DestinationMode) {
    markFormStarted();
    setDestinationMode(option);
    track("destination_chosen", { option });
    setDirection("forward");
    // Suppress the per-step CSS slide for the wizard's FIRST paint after commit —
    // the card crossfade + content stagger own that transition, so a competing
    // slide would double up. skipEntryAnim still drives the step 1↔2↔3
    // slides (handleBack/handleBackToDestination clear it).
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

  // The fork ticket model (forkChoosing / tileCollapsed / surpriseNeutral) and
  // the region/exact placeTickets config now live inside <DestinationFork>.

  // "Your trip to X" context pill above the wizard card. Only when a concrete
  // destination is known (region/exact with a picked selection) — never for
  // surprise (destination unknown until results) and never on the fork. Reads
  // the same display field the submit-button copy uses (selection.cityName).
  const tripPillName =
    destinationMode === "region"
      ? regionSelection?.cityName ?? null
      : destinationMode === "exact_city"
        ? exactCity?.cityName ?? null
        : null;

  return (
    <>
      <div
        ref={formCardRef}
        data-fork={onDestinationScreen}
        // scroll-margin for the block:"start" nav-scroll (scrollIntoViewSoft on
        // commit / Back / step change). Desktop bumps it to 80px so the heading
        // clears the 56px fixed header with breathing room and lands at the same
        // height as the #planner anchor arrival (section md:pt-20); mobile keeps
        // its original 24px.
        //
        // NOTE: the fork's fill-the-viewport min-height lives on the FORK
        // BRANCH inside the crossfade cell below (md:min-h on key="fork"), NOT
        // here as a state-conditional class. A conditional class on this
        // container was removed in the exact commit render, snapping the whole
        // container's height at the worst possible frame; on the branch it
        // rides the exit animation instead and releases only when the fork
        // finishes fading out.
        className="relative w-full scroll-mt-6 md:scroll-mt-20"
      >
        {/* Fork↔wizard is an in-place crossfade: both branches render in the
            SAME single-cell grid slot ([grid-area:1/1]) and fade over each
            other — nothing travels, nothing changes shape, and there's no
            double-height jump. mode="sync" keeps the exiting branch mounted
            through the overlap; the entrance's delay (SWAP_OVERLAP_DELAY_S)
            starts it ~60ms after the exit begins so there's never an empty
            beat. Per-step slides (1↔2↔3) stay a CSS animation on the inner
            keyed div. */}
        {/* "Your trip to X" — informational context label riding the heading
            region above the card, for the whole wizard once a region/exact
            destination is picked. Deliberately NOT clickable (changing the
            destination goes through the existing Back button). Teal is the
            region identity / selected-chip token (#0D7377), understated tint
            like PrefillBanner's. Lives OUTSIDE the crossfade + keyed step
            content, so it persists across Budget → When → Vibe without
            re-animating; truncation guards long place names. No entrance
            animation (appears with the section heading at commit), so reduced
            motion needs no special casing. */}
        {!onDestinationScreen && tripPillName && (
          <div className="mb-6 flex justify-center">
            <span className="inline-flex max-w-full items-center rounded-full bg-[#0D7377]/10 ring-1 ring-inset ring-[#0D7377]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#0D7377]">
              <span className="truncate">Your trip to {tripPillName}</span>
            </span>
          </div>
        )}

        {/* data-swap-epoch ties the onExitComplete re-render to the DOM (and
            keeps the state genuinely used): when an exiting branch unmounts,
            the crossfade cell can settle to the survivor's height — the bump
            re-renders this tree so the ProgressBar's layout="position" FLIP
            measures the shift and glides instead of teleporting. */}
        <div className="grid" data-swap-epoch={swapEpoch}>
          <AnimatePresence
            mode="sync"
            initial={false}
            onExitComplete={() => setSwapEpoch((e) => e + 1)}
          >
            {onDestinationScreen ? (
              <motion.div
                key="fork"
                // w-full so the fork fills the shared grid cell to the same
                // width as the wizard card. Without it, this single-item grid
                // track collapses to the fork's (narrow, centered) content
                // width when the wizard isn't mounted, leaving the tiles
                // narrow and left-aligned on the pre-screen.
                //
                // md:min-h = the fork-state fill-the-viewport guard (was
                // 100vh−12rem on the outer container; −16rem here because the
                // ProgressBar + its mt-8 [~4rem] now sit outside this cell).
                // Living on the branch, it stays applied while the fork EXITS,
                // so the crossfade cell holds its height through the dissolve
                // instead of snapping at the commit frame.
                className="[grid-area:1/1] w-full md:min-h-[calc(100vh_-_16rem)]"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: reduceMotion ? 1 : 0.985,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : { duration: SWAP_EXIT_S, ease: "easeOut" },
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: SWAP_ENTER_S, ease: CONTENT_EASE, delay: SWAP_OVERLAP_DELAY_S }
                }
              >
                <DestinationFork
                  destinationMode={destinationMode}
                  regionSelection={regionSelection}
                  exactCity={exactCity}
                  onDestinationModeChange={setDestinationMode}
                  onRegionSelectionChange={setRegionSelection}
                  onExactCityChange={setExactCity}
                  onCommit={chooseDestination}
                  prefillHighlight={prefillHighlight}
                  prefilledKind={prefilled?.kind ?? null}
                  reduceMotion={reduceMotion}
                  enterAnimated={wizardVisitedRef.current}
                />
              </motion.div>
            ) : (
              <motion.div
                key="wizard"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  transition: reduceMotion
                    ? { duration: 0 }
                    : { duration: SWAP_EXIT_S, ease: "easeOut" },
                }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: SWAP_ENTER_S, ease: CONTENT_EASE, delay: SWAP_OVERLAP_DELAY_S }
                }
                // w-full to match the fork's width exactly (identical grid
                // cell) so fork↔wizard share the same left/right edges.
                // self-start: grid items stretch by default, so during the
                // crossfade the card would be drawn at the (taller) fork cell
                // height and its bottom border/shadow would snap up when the
                // fork unmounts. Top-anchored at its own content height, the
                // card's box is identical from its first frame to its last —
                // the coral simply resolves into it in place.
                className="[grid-area:1/1] self-start w-full relative bg-card rounded-3xl border border-accent/10 p-8 sm:p-10 md:p-14 overflow-visible"
                style={{
                  boxShadow:
                    "0 25px 60px rgba(255, 107, 71, 0.08), 0 4px 20px rgba(0, 0, 0, 0.06)",
                }}
              >
                {/* Content staggers in nearly together with the card fade.
                    Instant under reduced motion (initial={false} → children
                    mount at their "show" state). */}
                <motion.div
                  className="relative"
                  variants={contentContainer}
                  initial={reduceMotion ? false : "hidden"}
                  animate="show"
                >
                  {/* Triply presence + step dots are form chrome — they belong to
                      the numbered wizard, so they live inside the morphed card.
                      The desktop presence stays OUTSIDE the stagger: it's
                      absolute-positioned against this wrapper (top/right %), so
                      a transformed stagger item would become its containing
                      block and re-anchor it mid-entrance — and it already has
                      its own scroll-linked fade. */}
                  <TriplyFormPresence
                    budget={budget}
                    travelers={travelers}
                    vibe={vibe}
                    // The mascot reacts to wherever the trip actually starts —
                    // the typed departure city in car mode, the airport city
                    // otherwise (its 800ms debounce absorbs the typing).
                    originCity={transportMode === "car" ? departureCity : originCity}
                    transportMode={transportMode}
                    range={range}
                    nights={nights}
                    loading={loading}
                  />
                  <motion.div variants={contentItem}>
                    <TriplyFormPresenceMobile
                      budget={budget}
                      travelers={travelers}
                      vibe={vibe}
                      originCity={transportMode === "car" ? departureCity : originCity}
                      transportMode={transportMode}
                      range={range}
                      nights={nights}
                      loading={loading}
                    />
                  </motion.div>
                  {prefilled && (
                    <motion.div variants={contentItem}>
                      <PrefillBanner
                        cityName={prefilled.name}
                        onDismiss={() => {
                          setPrefilled(null);
                          setPrefillHighlight(false);
                        }}
                      />
                    </motion.div>
                  )}
                  {/* The stagger item is OUTSIDE the keyed div: the keyed div
                      remounts on step navigation for its CSS slide, and must
                      not re-run the entrance variant when it does. */}
                  <motion.div variants={contentItem}>
                  <div key={currentStep} className={animClass}>
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
                    (destinationMode === "region" && !regionSelection) ||
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

              {/* Transport toggle — Plane keeps the airport picker exactly as
                  before; Car swaps in a departure-city input + max-drive-time
                  chips. The active pill slides via layoutId (transform-only
                  FLIP), and the field sets crossfade in a shared grid cell —
                  the same [grid-area:1/1] + SWAP-constant pattern as the
                  fork↔wizard swap above, so nothing animates a layout prop. */}
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60">
                    How are you traveling?
                  </p>
                </div>
                <div
                  role="radiogroup"
                  aria-label="How are you traveling?"
                  className="inline-flex rounded-full bg-[#F5F5F5] p-1 mb-6"
                >
                  {TRANSPORT_OPTIONS.map((opt) => {
                    const isActive = transportMode === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => {
                          markFormStarted();
                          setTransportMode(opt.value);
                        }}
                        className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                          isActive ? "text-white" : "text-[#1a1a1a] hover:text-[#0D7377]"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="transport-active-pill"
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full bg-[#0D7377] shadow-md"
                            transition={
                              reduceMotion
                                ? { duration: 0 }
                                : { type: "spring", stiffness: 500, damping: 38 }
                            }
                          />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-2">
                          <opt.Icon
                            color={isActive ? "#ffffff" : "#0D7377"}
                            size={18}
                          />
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid">
                  <AnimatePresence mode="sync" initial={false}>
                    {transportMode === "plane" ? (
                      <motion.div
                        key="plane-fields"
                        className="[grid-area:1/1] self-start w-full"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          transition: reduceMotion
                            ? { duration: 0 }
                            : { duration: SWAP_EXIT_S, ease: "easeOut" },
                        }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                duration: SWAP_ENTER_S,
                                ease: CONTENT_EASE,
                                delay: SWAP_OVERLAP_DELAY_S,
                              }
                        }
                      >
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
                      </motion.div>
                    ) : (
                      <motion.div
                        key="car-fields"
                        className="[grid-area:1/1] self-start w-full space-y-6"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          transition: reduceMotion
                            ? { duration: 0 }
                            : { duration: SWAP_EXIT_S, ease: "easeOut" },
                        }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : {
                                duration: SWAP_ENTER_S,
                                ease: CONTENT_EASE,
                                delay: SWAP_OVERLAP_DELAY_S,
                              }
                        }
                      >
                        <div>
                          <div className="flex items-baseline gap-2 mb-3">
                            <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60">
                              Driving From
                            </p>
                          </div>
                          <p className="text-sm text-[#1a1a1a]/70 mb-4">Which city are you starting from?</p>
                          <input
                            type="text"
                            value={departureCity}
                            onChange={(e) => {
                              markFormStarted();
                              setDepartureCity(e.target.value);
                            }}
                            placeholder="e.g. Prague"
                            autoComplete="off"
                            maxLength={50}
                            aria-label="Departure city"
                            className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#FF6B47]/40 focus:border-[#FF6B47]"
                          />
                        </div>

                        {/* Drive radius only makes sense when the destination
                            is still open (surprise/region) — an exact city has
                            nothing to filter. No enter/exit animation needed:
                            destinationMode is committed on the pre-screen and
                            can't change while Step 3 is visible, so this
                            renders statically inside the car-fields crossfade.
                            The submit payload omits maxDriveHours in this case
                            (see handleSubmit). */}
                        {!isIntent && (
                          <div>
                            <div className="flex items-baseline gap-2 mb-3">
                              <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60">
                                Max Driving Time
                              </p>
                            </div>
                            <p className="text-sm text-[#1a1a1a]/70 mb-4">How far are you willing to drive?</p>
                            <div className="flex flex-wrap gap-2">
                              {DRIVE_HOUR_OPTIONS.map((opt) => {
                                const isActive = maxDriveHours === opt.hours;
                                return (
                                  <button
                                    key={opt.hours}
                                    type="button"
                                    onClick={() => setMaxDriveHours(opt.hours)}
                                    aria-pressed={isActive}
                                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                      isActive
                                        ? "bg-[#0D7377] text-white shadow-md scale-[1.02]"
                                        : "bg-[#F5F5F5] text-[#1a1a1a] hover:bg-[#0D7377]/10"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                      transportMode,
                      departureCity,
                      maxDriveHours,
                    )
                  }
                  disabled={
                    loading ||
                    !range?.from ||
                    !range?.to ||
                    !!fxWarning ||
                    (destinationMode === "region" && !regionSelection) ||
                    (destinationMode === "exact_city" && !exactCity) ||
                    (transportMode === "car" && departureCity.trim().length < 2)
                  }
                  size="md"
                >
                  {loading
                    ? destinationMode === "exact_city" && exactCity
                      ? `Planning your trip to ${exactCity.cityName}…`
                      : destinationMode === "region" && regionSelection
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
                  </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unified progress bar — rendered here in the persistent parent,
            below the fork/wizard slot, so it stays put across the commit swap.
            Fork → Destination active (index 0); wizard → currentStep active
            (1 Budget / 2 When / 3 Vibe|From) with Destination shown done.
            layout="position" (sanctioned FLIP, transform-only): when the
            crossfade cell above settles to the surviving branch's height, the
            bar glides to its new Y over a short ease instead of teleporting.
            Instant under reduced motion. */}
        <motion.div
          layout="position"
          transition={
            reduceMotion
              ? { duration: 0 }
              : { layout: { duration: 0.25, ease: CONTENT_EASE } }
          }
        >
          <ProgressBar
            activeIndex={onDestinationScreen ? 0 : currentStep}
            steps={["Destination", ...stepLabels]}
          />
        </motion.div>
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
              transportMode,
              departureCity,
              maxDriveHours,
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
