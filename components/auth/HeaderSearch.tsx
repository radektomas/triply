"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/landing/LoadingOverlay";
import {
  CityAutocomplete,
  type CitySelection,
} from "@/components/shared/CityAutocomplete";

// Header-level quick search. Reuses the form's Photon-backed CityAutocomplete
// (slim "header" variant) for suggestions, then submits via the existing
// single-destination /api/trips flow — the same path the detail page uses,
// which returns one destination in ~13s.

const DEFAULT_BUDGET = 500;
const DEFAULT_TRAVELERS = 2;
const DEFAULT_NIGHTS = 3;
const DEFAULT_VIBE = "city";
const DEFAULT_ORIGIN = "Prague";
const DAYS_FROM_NOW = 21; // ~3 weeks out

function isoDateAddingDays(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function SearchIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function HeaderSearch() {
  const router = useRouter();
  const [selection, setSelection] = useState<CitySelection | null>(null);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileWrapRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileOpen) mobileInputRef.current?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onClick(e: MouseEvent) {
      if (!mobileWrapRef.current?.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [mobileOpen]);

  async function submit(rawCity: string) {
    const city = rawCity.trim();
    // The autocomplete labels regions as "Name, Country"; for the trip
    // request we only need the city portion.
    const cityOnly = city.split(",")[0]?.trim() ?? city;
    if (cityOnly.length < 2 || submitting) return;
    setError(null);
    setSubmitting(true);

    const checkIn = isoDateAddingDays(DAYS_FROM_NOW);
    const checkOut = isoDateAddingDays(DAYS_FROM_NOW + DEFAULT_NIGHTS);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: DEFAULT_BUDGET,
          travelers: DEFAULT_TRAVELERS,
          vibe: DEFAULT_VIBE,
          originCity: DEFAULT_ORIGIN,
          checkIn,
          checkOut,
          destinationMode: "specific",
          destinationInput: cityOnly,
        }),
      });
      if (!res.ok) {
        const body = (await res
          .clone()
          .json()
          .catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Trip request failed (${res.status})`);
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
      setRedirectTo(target);
    } catch (err) {
      console.error("[HeaderSearch] submit failed:", err);
      setError("Couldn't search that city. Try again.");
      setSubmitting(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(selection?.cityName ?? typed);
  }

  function handleSelectionChange(sel: CitySelection | null) {
    // Picking a suggestion only fills the input (CityAutocomplete handles
    // the label fill internally). Submit happens on Enter or button click,
    // not on selection — matches the main planning form's behaviour.
    setSelection(sel);
  }

  // Shared body — input + submit button. Magnifier sits absolutely on the
  // left of the input (the CityAutocomplete header variant has pl-9 reserved
  // for it); the submit button is a sibling on the right.
  function renderField({
    inputRef,
    extraClose,
    inputWidthClass,
  }: {
    inputRef?: React.RefObject<HTMLInputElement | null>;
    extraClose?: React.ReactNode;
    inputWidthClass: string;
  }) {
    return (
      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2"
        role="search"
        aria-label="Search destinations"
      >
        <div className={`relative ${inputWidthClass}`}>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 z-10 text-[#0D7377]">
            <SearchIcon size={16} />
          </span>
          <CityAutocomplete
            mode="city"
            variant="header"
            value={selection}
            onChange={handleSelectionChange}
            onQueryChange={setTyped}
            disabled={submitting}
            placeholder="Search a city — Lisbon, Athens…"
            innerInputRef={inputRef}
          />
          {extraClose}
        </div>
        <button
          type="submit"
          disabled={
            submitting ||
            ((selection?.cityName?.trim().length ?? 0) < 2 &&
              typed.trim().length < 2)
          }
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#0D7377] hover:bg-[#0A5D60] text-cream text-sm font-semibold shadow-md ring-1 ring-[#0D7377]/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
        >
          <span>Take off</span>
          <span aria-hidden="true">→</span>
        </button>
      </form>
    );
  }

  return (
    <>
      {/* Desktop: helper label above + always-visible input + submit button */}
      <div className="hidden md:block">
        <p className="text-[11px] italic text-[#1A1A1A]/55 mb-1 pl-2">
          Know exactly where you want to go?
        </p>
        <div>{renderField({ inputWidthClass: "w-[260px] lg:w-[300px]" })}</div>
        {error && (
          <p className="mt-1 text-[11px] text-rose-600 bg-white/90 px-2 py-0.5 rounded inline-block">
            {error}
          </p>
        )}
      </div>

      {/* Mobile: icon-only button → expands inline to an autocomplete field */}
      <div ref={mobileWrapRef} className="md:hidden relative">
        {!mobileOpen ? (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Search destinations"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-[#0D7377]/15 shadow-sm text-[#0D7377] hover:bg-white transition-colors cursor-pointer"
          >
            <SearchIcon size={16} />
          </button>
        ) : (
          <div className="animate-fade-in-overlay">
            {renderField({
              inputRef: mobileInputRef,
              inputWidthClass: "w-[44vw] max-w-[180px]",
              extraClose: (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setTyped("");
                    setSelection(null);
                    setError(null);
                  }}
                  aria-label="Close search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex items-center justify-center w-6 h-6 rounded-full text-[#1A1A1A]/55 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-colors cursor-pointer"
                >
                  <CloseIcon size={14} />
                </button>
              ),
            })}
            {error && (
              <p className="mt-1 text-[11px] text-rose-600 bg-white/90 px-2 py-0.5 rounded inline-block">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {submitting && (
        <LoadingOverlay
          loadingComplete={redirectTo !== null}
          onReady={() => {
            if (redirectTo) router.push(redirectTo);
          }}
        />
      )}
    </>
  );
}
