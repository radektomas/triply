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

const MAX_NIGHTS = 14;

function computeNights(from: Date, to: Date): number {
  return Math.max(0, differenceInDays(to, from));
}

const VIBES = [
  { value: "beach", label: "🏖️ Beach" },
  { value: "city", label: "🏙️ City" },
  { value: "mountains", label: "⛰️ Mountains" },
  { value: "party", label: "🎉 Party" },
  { value: "culture", label: "🎨 Culture" },
  { value: "adventure", label: "🧗 Adventure" },
];

const ORIGIN_CITIES = [
  "Prague", "Vienna", "Berlin", "Warsaw", "Budapest", "London", "Amsterdam",
];

const STEP_LABELS = ["Budget", "When", "Vibe"];

const pillBase =
  "w-full py-3 px-4 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer text-center";
const pillSelected = "bg-accent text-white shadow-md scale-[1.03]";
const pillIdle = "bg-gray-100 text-[#374151] hover:bg-gray-200";

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

  const stateRef = useRef({ currentStep, budget, range, travelers, vibe, originCity, loading });
  useEffect(() => {
    stateRef.current = { currentStep, budget, range, travelers, vibe, originCity, loading };
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
        handleSubmit(s.budget, s.range!, s.travelers, s.vibe, s.originCity);
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
    o: string
  ) {
    if (!r.from || !r.to) return;
    setLoading(true);
    try {
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
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to create trip");
      }
      const { tripId } = await res.json() as { tripId: string };
      router.push(`/trip/${tripId}`);
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
            <div>
              <div className="mb-10">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted">
                      Total Budget
                    </label>
                    <p className="text-xs text-muted/70 mt-0.5">All-in, per person</p>
                  </div>
                  <span className="text-2xl font-bold text-accent">€{budget}</span>
                </div>
                <div className="mt-3">
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full"
                    aria-label="Budget in euros"
                  />
                  <div className="flex justify-between text-xs text-muted mt-2">
                    <span>€100</span>
                    <span>€1,000</span>
                  </div>
                </div>
              </div>

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
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
                  Travelers
                </label>
                <p className="text-xs text-muted/70 mb-4">Who&apos;s going?</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { value: 1, label: "Solo" },
                    { value: 2, label: "Couple" },
                    { value: 4, label: "Family" },
                    { value: 6, label: "Group" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTravelers(opt.value)}
                      className={`${pillBase} ${travelers === opt.value ? pillSelected : pillIdle}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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

          {/* Step 3 — Vibe + Origin */}
          {currentStep === 3 && (
            <div>
              <div className="mb-10">
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
                  Trip Vibe
                </label>
                <p className="text-xs text-muted/70 mb-4">What are you into?</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {VIBES.map((v) => {
                    const selected = vibe === v.value;
                    return (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setVibe(v.value)}
                        className={`${pillBase} ${selected ? pillSelected : pillIdle}`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
                  Flying From
                </label>
                <p className="text-xs text-muted/70 mb-4">Pick your home airport</p>
                <div className="grid grid-cols-4 gap-2">
                  {ORIGIN_CITIES.map((city) => {
                    const selected = originCity === city;
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setOriginCity(city)}
                        className={`${pillBase} ${selected ? pillSelected : pillIdle}`}
                      >
                        {city}
                      </button>
                    );
                  })}
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
                  onClick={() => handleSubmit(budget, range!, travelers, vibe, originCity)}
                  disabled={loading || !range?.from || !range?.to}
                  size="md"
                >
                  {loading ? "Finding your trip…" : "Find my trip →"}
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
