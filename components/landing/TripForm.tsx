"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, DayButton, getDefaultClassNames, type DayButtonProps } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { addDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import { TagButton } from "@/components/ui/TagButton";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";
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

const DEFAULT_AIRPORT = AIRPORTS.find((a) => a.iata === "PRG");

const MAX_NIGHTS = 14;

interface ModeIconProps {
  color: string;
  size?: number;
}

function SurpriseIcon({ color, size = 18 }: ModeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <circle cx="9" cy="9" r="1.4" fill={color} />
      <circle cx="12" cy="12" r="1.4" fill={color} />
      <circle cx="15" cy="15" r="1.4" fill={color} />
    </svg>
  );
}

function PinIcon({ color, size = 18 }: ModeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2.5C8 2.5 5 5.4 5 9c0 4.5 7 12 7 12s7-7.5 7-12c0-3.6-3-6.5-7-6.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.3" fill={color} />
    </svg>
  );
}

function CrosshairIcon({ color, size = 18 }: ModeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.6" fill={color} />
      <line x1="12" y1="2.5" x2="12" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="21.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="2.5" y1="12" x2="6" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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

const STEP_LABELS = ["Budget", "When", "Vibe"];


function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function TriplyDayButton({ day, modifiers, ...buttonProps }: DayButtonProps) {
  const isRangeStart = !!modifiers.range_start;
  const isRangeEnd = !!modifiers.range_end;
  const isRangeMiddle = !!modifiers.range_middle;
  const isSelected = !!modifiers.selected;
  const isToday = !!modifiers.today;
  const isDisabled = !!modifiers.disabled;
  const isOutside = !!modifiers.outside;
  const isSingleDay = isRangeStart && isRangeEnd;

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      !isSingleDay && (isRangeStart || isRangeEnd || isRangeMiddle)
        ? "rgba(255, 107, 71, 0.15)"
        : "transparent",
    borderTopLeftRadius: isRangeStart && !isSingleDay ? "9999px" : isRangeMiddle || isRangeEnd ? "0" : "9999px",
    borderBottomLeftRadius: isRangeStart && !isSingleDay ? "9999px" : isRangeMiddle || isRangeEnd ? "0" : "9999px",
    borderTopRightRadius: isRangeEnd && !isSingleDay ? "9999px" : isRangeMiddle || isRangeStart ? "0" : "9999px",
    borderBottomRightRadius: isRangeEnd && !isSingleDay ? "9999px" : isRangeMiddle || isRangeStart ? "0" : "9999px",
  };

  const isEndpoint = isRangeStart || isRangeEnd || (isSelected && !isRangeMiddle);

  const buttonStyle: React.CSSProperties = {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    fontWeight: isEndpoint ? 600 : isToday ? 700 : 500,
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "background-color 150ms, color 150ms",
    border: isToday && !isEndpoint ? "2px solid rgba(13, 115, 119, 0.5)" : "none",
    backgroundColor: isEndpoint ? "#FF6B47" : "transparent",
    color: isEndpoint ? "#ffffff" : isToday && !isEndpoint ? "#0D7377" : "#1a1a1a",
    opacity: isDisabled || isOutside ? 0.3 : 1,
    position: "relative",
    flexShrink: 0,
  };

  const showTooltip = (isSelected || isRangeStart || isRangeEnd || isRangeMiddle) && !isDisabled;

  return (
    <div style={containerStyle}>
      <button
        {...buttonProps}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!isEndpoint && !isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(13, 115, 119, 0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isEndpoint && !isDisabled) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }
        }}
      >
        {day.date.getDate()}
      </button>
      {showTooltip && (
        <span
          className="triply-tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1a1a1a",
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            opacity: 0,
            pointerEvents: "none",
            transition: "opacity 150ms",
            zIndex: 50,
          }}
        >
          Double-click to clear
        </span>
      )}
    </div>
  );
}

function ProgressDots({
  currentStep,
  onJump,
}: {
  currentStep: 1 | 2 | 3;
  onJump: (step: 1 | 2 | 3) => void;
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
              aria-label={`Step ${step}: ${STEP_LABELS[step - 1]}`}
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
        Step {currentStep} of 3 — {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );
}

export function TripForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [budget, setBudget] = useState(500);
  const [travelers, setTravelers] = useState(2);
  const [vibe, setVibe] = useState("beach");
  const [originCity, setOriginCity] = useState("Prague");
  const [destinationMode, setDestinationMode] = useState<
    "surprise" | "specific" | "exact_city"
  >("surprise");
  const [destinationInput, setDestinationInput] = useState("");
  const [exactCity, setExactCity] = useState<CitySelection | null>(null);
  // Tracks whether the exact_city collapsible panel has finished its
  // expand animation. Drives an overflow-hidden → overflow-visible swap so
  // the autocomplete dropdown isn't clipped by the panel boundary, while
  // still allowing the grid-template-rows collapse animation to clip
  // content during open/close transitions.
  const [exactCityExpanded, setExactCityExpanded] = useState(false);
  // Reset the expanded flag synchronously (before paint) on every mode
  // change so we always re-clip during the next transition cycle.
  useLayoutEffect(() => {
    setExactCityExpanded(false);
  }, [destinationMode]);
  const [loading, setLoading] = useState(false);
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

  const rdp = getDefaultClassNames();

  const stateRef = useRef({
    currentStep,
    budget,
    range,
    travelers,
    vibe,
    originCity,
    destinationMode,
    destinationInput,
    exactCity,
    loading,
  });
  useEffect(() => {
    stateRef.current = {
      currentStep,
      budget,
      range,
      travelers,
      vibe,
      originCity,
      destinationMode,
      destinationInput,
      exactCity,
      loading,
    };
  });

  useLayoutEffect(() => {
    return () => setLoading(false);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      if (document.activeElement?.tagName === "TEXTAREA") return;
      const s = stateRef.current;
      if (s.loading) return;
      if (s.currentStep < 3) {
        setDirection("forward");
        setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
      } else {
        handleSubmit(
          s.budget,
          s.range!,
          s.travelers,
          s.vibe,
          s.originCity,
          s.destinationMode,
          s.destinationInput,
          s.exactCity,
        );
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSubmit(
    b: number,
    r: DateRange,
    t: number,
    v: string,
    o: string,
    m: "surprise" | "specific" | "exact_city",
    d: string,
    city: CitySelection | null,
  ) {
    if (!r.from || !r.to) return;
    // Guard: exact_city mode requires a picked city object, not just typed text.
    if (m === "exact_city" && !city) return;
    setLoading(true);
    try {
      // Build the destinationInput per mode: region text for "specific",
      // "City, Country" for "exact_city", omitted for "surprise".
      let destinationInput: string | undefined;
      if (m === "specific") {
        destinationInput = d.trim();
      } else if (m === "exact_city" && city) {
        destinationInput = city.countryName
          ? `${city.cityName}, ${city.countryName}`
          : city.cityName;
      }

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: b,
          checkIn: toIso(r.from),
          checkOut: toIso(r.to),
          travelers: t,
          vibe: v,
          originCity: o,
          destinationMode: m,
          destinationInput,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to create trip");
      }
      const { tripId, firstDestinationId } = (await res.json()) as {
        tripId: string;
        firstDestinationId?: string | null;
      };
      // exact_city deep-links straight to the chosen city's detail view;
      // surprise/specific land on the destination selector as before.
      if (m === "exact_city" && firstDestinationId) {
        router.push(`/trip/${tripId}?d=${firstDestinationId}`);
      } else {
        router.push(`/trip/${tripId}`);
      }
    } catch (err) {
      console.error("[TripForm] submit error:", err);
      setLoading(false);
    }
  }

  function handleNext() {
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

  const animClass =
    direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <>
      <div
        className="bg-card rounded-3xl border border-accent/10 p-8 sm:p-10 md:p-14 w-full"
        style={{
          boxShadow:
            "0 25px 60px rgba(255, 107, 71, 0.08), 0 4px 20px rgba(0, 0, 0, 0.06)",
        }}
      >
        <ProgressDots currentStep={currentStep} onJump={handleJump} />

        <div key={currentStep} className={animClass}>
          {/* Step 1 — Budget */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Heading */}
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60 mb-2">
                  Step 1 of 3 — Budget
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
                  What&apos;s your budget?
                </h2>
              </div>

              {/* Hero: big €N + "per person" subtitle */}
              <div className="text-center py-4">
                <span className="text-7xl md:text-8xl font-bold text-[#FF6B47] leading-none tabular-nums tracking-tight">
                  €{budget}
                </span>
                <p className="text-sm text-[#1a1a1a]/50 mt-2 font-medium">per person</p>
              </div>

              {/* Slider */}
              <div className="px-2">
                <input
                  type="range"
                  min={100}
                  max={1000}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="triply-slider w-full"
                  aria-label="Budget in euros"
                  style={{
                    background: `linear-gradient(to right, #FF6B47 0%, #FF6B47 ${((budget - 100) / 900) * 100}%, rgba(26,26,26,0.1) ${((budget - 100) / 900) * 100}%, rgba(26,26,26,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between mt-3 text-xs text-[#1a1a1a]/40 font-medium">
                  <span>€100</span>
                  <span>€1,000</span>
                </div>
              </div>

              {budget > 0 && (
                <div className="text-center">
                  <p className="text-sm text-[#1a1a1a]/55 font-medium">
                    <span className="text-[#1a1a1a]/30 mr-1.5">·</span>
                    {travelers === 1 ? (
                      <>€{budget} solo trip budget</>
                    ) : (
                      <>
                        <span className="tabular-nums">€{budget * travelers}</span>
                        {" "}total for {travelers} travelers
                      </>
                    )}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleNext} className="sm:min-w-[160px] text-lg py-4">
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
                    <DayPicker
                      mode="range"
                      selected={range}
                      onSelect={handleRangeSelect}
                      numberOfMonths={1}
                      weekStartsOn={1}
                      disabled={{ before: today }}
                      startMonth={today}
                      endMonth={maxDate}
                      showOutsideDays={false}
                      defaultMonth={range?.from ?? today}
                      classNames={{
                        root: rdp.root,
                        month: `${rdp.month} w-full`,
                        month_caption: `${rdp.month_caption} pb-3 flex justify-center`,
                        caption_label: `${rdp.caption_label} text-[#1a1a1a] font-bold text-base`,
                        button_previous: rdp.button_previous,
                        button_next: rdp.button_next,
                        chevron: rdp.chevron,
                        weekday: `${rdp.weekday} text-[#1a1a1a]/40 text-xs font-semibold uppercase pb-2`,
                        day: rdp.day,
                      }}
                      components={{
                        DayButton: (props) => (
                          <TriplyDayButton
                            {...props}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRange(undefined);
                            }}
                          />
                        ),
                      }}
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

          {/* Step 3 — Destination + Vibe + Origin */}
          {currentStep === 3 && (
            <div className="space-y-8 px-1 sm:px-0">
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#1a1a1a]/60">
                    Destination
                  </p>
                </div>
                <p className="text-sm text-[#1a1a1a]/70 mb-4">Let us pick, or tell us where</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: "surprise" as const,   label: "Surprise me",          Icon: SurpriseIcon  },
                    { value: "specific" as const,   label: "I know the region",    Icon: PinIcon       },
                    { value: "exact_city" as const, label: "I know the exact city", Icon: CrosshairIcon },
                  ]).map(({ value, label, Icon }) => {
                    const isActive = destinationMode === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDestinationMode(value)}
                        className={`rounded-2xl py-3 px-3 flex items-center justify-center gap-2 transition-all duration-200 ${
                          isActive ? "shadow-md scale-[1.02]" : "hover:scale-[1.01]"
                        }`}
                        style={{
                          backgroundColor: isActive ? "#FF6B47" : "#F5F5F5",
                          color: isActive ? "#ffffff" : "#1a1a1a",
                          minHeight: "48px",
                        }}
                      >
                        <Icon color={isActive ? "#ffffff" : "#FF6B47"} size={18} />
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Region text input — visible only in "specific" mode. Smooth
                    grid-row expand keeps the layout from jumping. */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: destinationMode === "specific" ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <input
                      type="text"
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                      placeholder="Where in Europe? (e.g. Portugal, Tuscany...)"
                      maxLength={80}
                      className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#FF6B47]/40 focus:border-[#FF6B47]"
                    />
                    <p className="mt-2 text-xs text-muted">
                      Tell us a country or area — we&apos;ll find 3 great spots.
                    </p>
                  </div>
                </div>

                {/* Photon city autocomplete — visible only in "exact_city" mode.
                    The inner wrapper swaps overflow-hidden → overflow-visible
                    once the expand transition completes so the dropdown can
                    extend below the panel without being clipped. */}
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: destinationMode === "exact_city" ? "1fr" : "0fr" }}
                  onTransitionEnd={(e) => {
                    if (
                      e.propertyName === "grid-template-rows" &&
                      destinationMode === "exact_city"
                    ) {
                      setExactCityExpanded(true);
                    }
                  }}
                >
                  <div
                    className={
                      exactCityExpanded && destinationMode === "exact_city"
                        ? "overflow-visible"
                        : "overflow-hidden"
                    }
                  >
                    <div className="mt-3">
                      <CityAutocomplete
                        value={exactCity}
                        onChange={setExactCity}
                        placeholder="Type a city — Lisbon, Athens, Reykjavík…"
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Pick a specific city — we&apos;ll plan a detailed trip there.
                    </p>
                  </div>
                </div>
              </div>

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
                      range!,
                      travelers,
                      vibe,
                      originCity,
                      destinationMode,
                      destinationInput,
                      exactCity,
                    )
                  }
                  disabled={
                    loading ||
                    !range?.from ||
                    !range?.to ||
                    (destinationMode === "specific" &&
                      destinationInput.trim().length < 2) ||
                    (destinationMode === "exact_city" && !exactCity)
                  }
                  size="md"
                >
                  {loading
                    ? destinationMode === "exact_city" && exactCity
                      ? `Planning your trip to ${exactCity.cityName}…`
                      : "Finding your trip…"
                    : "Find my trip →"}
                </TagButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingOverlay />}
    </>
  );
}
