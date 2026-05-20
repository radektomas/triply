"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CityAutocomplete,
  type CitySelection,
} from "@/components/shared/CityAutocomplete";

// "Pick your own city" escape hatch on the destination-selector page. Wraps
// the shared CityAutocomplete with the picker section's collapse toggle,
// submit button, and phased loading panel. Posts the chosen city + the
// existing trip params to the n8n single-city webhook; expects { id | tripId }
// back so we can navigate to the new trip detail page.

interface TripParams {
  budget: number;
  nights: number;
  travelers: number;
  vibe: string;
  originCity: string;
  checkIn: string;
  checkOut: string;
}

interface Props {
  tripParams: TripParams;
}

function PinIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M 12 2.5 C 8 2.5 5 5.4 5 9 c 0 4.5 7 12.5 7 12.5 s 7 -8 7 -12.5 c 0 -3.6 -3 -6.5 -7 -6.5 z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  );
}

function ArrowRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function CustomCityPicker({ tripParams }: Props) {
  const router = useRouter();
  const reactId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<CitySelection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // 0=Finding spots · 1=Crafting itinerary · 2=Calculating budget · 3=Almost there · 4=Taking longer
  const [loadingPhase, setLoadingPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Cycle through phased loading messages while a submit is in flight.
  useEffect(() => {
    if (!submitting) return;
    setLoadingPhase(0);
    const t1 = setTimeout(() => setLoadingPhase(1), 4000);
    const t2 = setTimeout(() => setLoadingPhase(2), 8000);
    const t3 = setTimeout(() => setLoadingPhase(3), 12000);
    const t4 = setTimeout(() => setLoadingPhase(4), 30000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [submitting]);

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Unified single-destination flow: same /api/trips call the header
      // search uses, with the actual trip context (budget / dates / vibe /
      // origin / travelers) so the "same budget and vibe" promise holds.
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: tripParams.budget,
          travelers: tripParams.travelers,
          vibe: tripParams.vibe,
          originCity: tripParams.originCity,
          checkIn: tripParams.checkIn,
          checkOut: tripParams.checkOut,
          destinationMode: "specific",
          destinationInput: selected.cityName,
        }),
      });
      if (!res.ok) {
        const errBody = (await res
          .clone()
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(
          errBody.error ?? `Trip request failed (${res.status})`,
        );
      }
      const { tripId, firstDestinationId, destinationCount } =
        (await res.json()) as {
          tripId: string;
          firstDestinationId?: string | null;
          destinationCount?: number;
        };
      // Single destination → detail page; multiple (e.g. a region like
      // "Sardinia" returned several cities) → results grid for picking.
      const target =
        destinationCount === 1 && firstDestinationId
          ? `/trip/${tripId}?d=${firstDestinationId}`
          : `/trip/${tripId}`;
      router.push(target);
    } catch (err) {
      console.error("[CustomCityPicker] submit failed:", err);
      setSubmitError("Couldn't plan that trip. Please try again.");
      setSubmitting(false);
    }
  }

  function toggleOpen() {
    setIsOpen((prev) => !prev);
  }

  return (
    <section className="mt-12 mx-auto max-w-2xl">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A]">
              Nothing here? Pick your own city
            </h2>
            <p className="text-sm text-muted mt-1">
              We&apos;ll plan a trip there with the same budget and vibe.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOpen}
            aria-expanded={isOpen}
            aria-controls={`city-picker-panel-${reactId}`}
            className="inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-white text-sm font-semibold px-5 py-3 rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <PinIcon size={16} className="opacity-90" />
            <span>{isOpen ? "Hide" : "Choose city"}</span>
            <span
              className="transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
            >
              <ChevronDownIcon size={14} />
            </span>
          </button>
        </div>

        {isOpen && (
          <div
            id={`city-picker-panel-${reactId}`}
            className="mt-6 pt-6 border-t border-border"
          >
            <label
              htmlFor={`city-input-${reactId}`}
              className="block text-xs font-semibold uppercase tracking-widest text-muted mb-2"
            >
              City
            </label>

            <CityAutocomplete
              value={selected}
              onChange={setSelected}
              placeholder="Lisbon, Athens, Reykjavík…"
              disabled={submitting}
              inputId={`city-input-${reactId}`}
            />

            <div className="mt-6">
              {submitting ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="animate-fade-in-overlay flex flex-col items-end gap-2"
                >
                  <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-full pl-4 pr-5 py-3">
                    <span className="relative inline-flex w-2.5 h-2.5">
                      <span className="absolute inset-0 rounded-full bg-accent opacity-60 animate-ping" />
                      <span className="relative w-2.5 h-2.5 rounded-full bg-accent" />
                    </span>
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {loadingPhase === 0 &&
                        `Finding the best spots in ${selected?.cityName ?? "your destination"}…`}
                      {loadingPhase === 1 && "Crafting your itinerary…"}
                      {loadingPhase === 2 && "Calculating budget estimates…"}
                      {loadingPhase === 3 && "Almost there…"}
                      {loadingPhase === 4 &&
                        "Taking a bit longer than usual — hold tight"}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {loadingPhase < 4
                      ? "This usually takes 10–20 seconds"
                      : "Still working on it…"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3">
                  {submitError && (
                    <p className="text-xs text-rose-600 mr-auto">{submitError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="inline-flex items-center justify-center gap-2 bg-accent text-white text-sm font-semibold px-5 py-3 rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100"
                  >
                    <span>
                      {selected
                        ? `Plan trip to ${selected.cityName}`
                        : "Plan this trip"}
                    </span>
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
