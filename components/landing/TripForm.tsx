"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { DateRange } from "react-day-picker";
import { addDays, differenceInDays } from "date-fns";

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
  // "Expand has settled" flag for the region panel. Drives an
  // overflow-hidden → overflow-visible swap so the autocomplete dropdown
  // isn't clipped by the panel boundary, while still letting the
  // grid-template-rows collapse animation clip content during open/close.
  // (The exact-city input is rendered directly in the Step 1 intent state,
  // not inside a collapsing panel, so it needs no equivalent flag.)
  const [specificExpanded, setSpecificExpanded] = useState(false);
  // Reset the flag synchronously (before paint) on every mode change so we
  // always re-clip during the next transition cycle.
  useLayoutEffect(() => {
    setSpecificExpanded(false);
  }, [destinationMode]);
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

      // Both region and exact-city wizard options now route through the
      // unified single-destination `specific` flow on the server. The two
      // UI options stay (different labels/placeholders) but funnel into one
      // n8n path so the app maintains a single single-destination pipeline.
      const wireMode: "surprise" | "specific" =
        m === "surprise" ? "surprise" : "specific";

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
    setDirection("forward");
    setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  }

  function handleBack() {
    setDirection("back");
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  }

  function handleJump(step: 1 | 2 | 3) {
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
    setOnDestinationScreen(false);
  }

  // Return from Budget to the destination pre-screen to change the choice.
  function handleBackToDestination() {
    setDirection("back");
    setOnDestinationScreen(true);
  }

  const animClass =
    direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  // The "intent" path (user typed an exact city) skips the vibe selector
  // entirely. It's derived purely from destinationMode so the destination
  // screen, the Step 3 vibe visibility, and the progress label stay in sync.
  const isIntent = destinationMode === "exact_city";
  const stepLabels = isIntent ? STEP_LABELS_INTENT : STEP_LABELS_DISCOVERY;

  return (
    <>
      <div
        className="relative bg-card rounded-3xl border border-accent/10 p-8 sm:p-10 md:p-14 w-full"
        style={{
          boxShadow:
            "0 25px 60px rgba(255, 107, 71, 0.08), 0 4px 20px rgba(0, 0, 0, 0.06)",
        }}
      >
        <TriplyFormPresence
          budget={budget}
          travelers={travelers}
          vibe={vibe}
          originCity={originCity}
          range={range}
          nights={nights}
          loading={loading}
        />
        {/* Dots count only the numbered wizard (Budget/When/Vibe-or-From).
            The destination pre-screen sits before them, so they stay hidden
            until the user commits a destination. */}
        {!onDestinationScreen && (
          <ProgressDots currentStep={currentStep} onJump={handleJump} labels={stepLabels} />
        )}

        {/* Mobile-only inline Triply, sits under the progress dots. The
            desktop variant above is hidden on small viewports; this one is
            hidden on md+, so each breakpoint sees exactly one Triply. */}
        <TriplyFormPresenceMobile
          budget={budget}
          travelers={travelers}
          vibe={vibe}
          originCity={originCity}
          range={range}
          nights={nights}
          loading={loading}
        />

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
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
                  Where are we headed?
                </h2>
                <p className="text-sm text-[#1a1a1a]/60 mt-2 font-medium">
                  Let us surprise you, narrow it to a region, or name the exact
                  city.
                </p>
              </div>

              <div className="space-y-3">
                {/* Surprise me — commits immediately. */}
                <button
                  type="button"
                  onClick={() => chooseDestination("surprise")}
                  className="w-full flex items-center gap-3.5 rounded-2xl bg-[#F5F5F5] hover:bg-[#0D7377]/10 px-4 py-3.5 text-left transition-colors"
                  style={{ minHeight: "48px" }}
                >
                  <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm">
                    <DiceIcon color="#0D7377" size={22} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-semibold text-[#1a1a1a]">
                      Surprise me
                    </span>
                    <span className="block text-xs text-[#1a1a1a]/55">
                      Let Triply pick the perfect match
                    </span>
                  </span>
                  <ArrowRightIcon color="#1a1a1a" size={16} />
                </button>

                {/* I know the region — reveals the region autocomplete. */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      destinationMode === "specific" && regionSelection
                        ? chooseDestination("specific")
                        : setDestinationMode("specific")
                    }
                    aria-expanded={destinationMode === "specific"}
                    className={`w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                      destinationMode === "specific"
                        ? "bg-[#0D7377]/10"
                        : "bg-[#F5F5F5] hover:bg-[#0D7377]/10"
                    }`}
                    style={{ minHeight: "48px" }}
                  >
                    <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm">
                      <PinIcon color="#0D7377" size={22} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-base font-semibold text-[#1a1a1a]">
                        I know the region
                      </span>
                      <span className="block text-xs text-[#1a1a1a]/55">
                        Country, island, or area — we&apos;ll find the spots
                      </span>
                    </span>
                    <ArrowRightIcon color="#1a1a1a" size={16} />
                  </button>

                  {/* Region autocomplete — same expand-transition + overflow-
                      swap pattern (relocated) so the dropdown isn't clipped.
                      Selecting a region auto-advances to Budget. */}
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: destinationMode === "specific" ? "1fr" : "0fr" }}
                    onTransitionEnd={(e) => {
                      if (
                        e.propertyName === "grid-template-rows" &&
                        destinationMode === "specific"
                      ) {
                        setSpecificExpanded(true);
                      }
                    }}
                  >
                    <div
                      className={
                        specificExpanded && destinationMode === "specific"
                          ? "overflow-visible"
                          : "overflow-hidden"
                      }
                    >
                      <div
                        className={`mt-3 rounded-2xl transition-shadow duration-500 ${
                          prefillHighlight && prefilled?.kind === "region"
                            ? "ring-2 ring-[#0D7377]/55 ring-offset-2"
                            : ""
                        }`}
                      >
                        <CityAutocomplete
                          mode="region"
                          value={regionSelection}
                          onChange={(sel) => {
                            setRegionSelection(sel);
                            if (sel) chooseDestination("specific");
                          }}
                          placeholder="e.g. Portugal, Sicily, Bali..."
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        Country, region, or island — we&apos;ll find 3 great
                        spots there.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Divider into the "already decided" path. */}
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-[#1a1a1a]/10" />
                  <span className="text-xs font-medium uppercase tracking-wider text-[#1a1a1a]/40">
                    or, already decided?
                  </span>
                  <span className="h-px flex-1 bg-[#1a1a1a]/10" />
                </div>

                {/* I know the exact city — accent-tinted, reveals the city
                    autocomplete. Selecting a city auto-advances to Budget. */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      destinationMode === "exact_city" && exactCity
                        ? chooseDestination("exact_city")
                        : setDestinationMode("exact_city")
                    }
                    aria-expanded={destinationMode === "exact_city"}
                    className={`w-full flex items-center gap-3.5 rounded-2xl border border-[#FF6B47]/30 px-4 py-3.5 text-left transition-colors ${
                      destinationMode === "exact_city"
                        ? "bg-[#FF6B47]/[0.14]"
                        : "bg-[#FF6B47]/[0.08] hover:bg-[#FF6B47]/[0.14]"
                    }`}
                    style={{ minHeight: "48px" }}
                  >
                    <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm">
                      <TargetIcon color="#FF6B47" size={22} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-base font-semibold text-[#1a1a1a]">
                        I know the exact city
                      </span>
                      <span className="block text-xs text-[#1a1a1a]/55">
                        Plan a detailed trip to one city
                      </span>
                    </span>
                    <ArrowRightIcon color="#FF6B47" size={16} />
                  </button>

                  {destinationMode === "exact_city" && (
                    <div
                      className={`mt-3 rounded-2xl transition-shadow duration-500 ${
                        prefillHighlight && prefilled?.kind === "city"
                          ? "ring-2 ring-[#0D7377]/55 ring-offset-2"
                          : ""
                      }`}
                    >
                      <CityAutocomplete
                        value={exactCity}
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
                    </div>
                  )}
                </div>
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
