"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TagButton } from "@/components/ui/TagButton";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

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
  const [month, setMonth] = useState("june");
  const [nights, setNights] = useState(4);
  const [travelers, setTravelers] = useState(2);

  useEffect(() => {
    setMonth(MONTHS[(new Date().getMonth() + 2) % 12].toLowerCase());
  }, []);
  const [vibe, setVibe] = useState("beach");
  const [originCity, setOriginCity] = useState("Prague");
  const [loading, setLoading] = useState(false);

  const stateRef = useRef({ currentStep, budget, month, nights, travelers, vibe, originCity, loading });
  useEffect(() => {
    stateRef.current = { currentStep, budget, month, nights, travelers, vibe, originCity, loading };
  });

  // Reset loading when Activity hides this page (prevents overlay re-appearing on browser back)
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
        submitTrip(s.budget, s.month, s.nights, s.travelers, s.vibe, s.originCity);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  async function submitTrip(b: number, m: string, n: number, t: number, v: string, o: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: b, month: m, nights: n, travelers: t, vibe: v, originCity: o }),
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

        {/* Step 2 — Month + Nights */}
        {currentStep === 2 && (
          <div>
            <div className="mb-10">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
                Travel Month
              </label>
              <p className="text-xs text-muted/70 mb-4">When do you want to go?</p>
              <div className="month-grid">
                {MONTHS.map((m) => {
                  const value = m.toLowerCase();
                  const selected = month === value;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonth(value)}
                      className={`${pillBase} ${selected ? pillSelected : pillIdle}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-10">
              <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
                Number of Nights
              </label>
              <p className="text-xs text-muted/70 mb-4">How long&apos;s the escape?</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setNights((n) => Math.max(1, n - 1))}
                  disabled={nights === 1}
                  aria-label="Decrease nights"
                  className="w-11 h-11 rounded-xl bg-gray-100 text-[#374151] text-xl font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  −
                </button>
                <span className="text-3xl font-bold w-10 text-center tabular-nums">
                  {nights}
                </span>
                <button
                  type="button"
                  onClick={() => setNights((n) => Math.min(7, n + 1))}
                  disabled={nights === 7}
                  aria-label="Increase nights"
                  className="w-11 h-11 rounded-xl bg-gray-100 text-[#374151] text-xl font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  +
                </button>
                <span className="text-muted font-medium">
                  {nights === 1 ? "night" : "nights"}
                </span>
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
              <Button onClick={handleNext} className="sm:min-w-[160px] text-lg py-4">
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
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <button
                  type="button"
                  onClick={() => submitTrip(budget, month, nights, 2, "beach", "Prague")}
                  disabled={loading}
                  className="text-sm text-muted hover:text-[#374151] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Skip & find my trip →
                </button>
                <TagButton
                  onClick={() => submitTrip(budget, month, nights, travelers, vibe, originCity)}
                  disabled={loading}
                  size="md"
                >
                  {loading ? "Finding your trip…" : "Find my trip →"}
                </TagButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {loading && <LoadingOverlay />}
    </>
  );
}
