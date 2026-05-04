"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

// "Pick your own city" escape hatch on the destination-selector page. Self-
// contained section that collapses/expands inline, runs a Photon autocomplete
// against OpenStreetMap, and POSTs the chosen city + the existing trip params
// straight to the n8n single-city webhook. n8n is expected to return
// { tripId } so we can navigate to the new trip detail page.

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

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    country?: string;
    countrycode?: string;
    type?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

interface CitySuggestion {
  key: string;
  cityName: string;
  countryName: string;
  countryCode: string;
  lat: number;
  lng: number;
}

const PHOTON_URL = "https://photon.komoot.io/api/";
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;

// Stable empty-array reference. `setSuggestions([])` with a fresh literal
// clobbers identity even when the previous value was already empty, which
// triggers a needless re-render. Reusing one constant keeps no-op clears
// no-op all the way through React's bail-out path.
const EMPTY_SUGGESTIONS: CitySuggestion[] = [];

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

function suggestionLabel(s: CitySuggestion): string {
  return s.countryName ? `${s.cityName}, ${s.countryName}` : s.cityName;
}

function mapPhotonFeature(f: PhotonFeature): CitySuggestion | null {
  const name = f.properties.name?.trim();
  if (!name) return null;
  const [lng, lat] = f.geometry.coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const osmKey = `${f.properties.osm_type ?? ""}-${f.properties.osm_id ?? ""}`;
  return {
    key: `${osmKey}-${name}-${lat.toFixed(4)},${lng.toFixed(4)}`,
    cityName: name,
    countryName: f.properties.country?.trim() ?? "",
    countryCode: f.properties.countrycode?.trim().toUpperCase() ?? "",
    lat,
    lng,
  };
}

export function CustomCityPicker({ tripParams }: Props) {
  const router = useRouter();
  const reactId = useId();
  const listboxId = `city-listbox-${reactId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Tracks the in-flight Photon fetch so the next keystroke can abort it
  // before kicking off a new one — prevents stale results clobbering newer.
  const abortRef = useRef<AbortController | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>(EMPTY_SUGGESTIONS);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState<CitySuggestion | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  // 0=Finding spots · 1=Crafting itinerary · 2=Calculating budget · 3=Almost there · 4=Taking longer
  const [loadingPhase, setLoadingPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Cycle through phased loading messages while a submit is in flight.
  // Multiple `setTimeout`s at fixed offsets (instead of one `setInterval`)
  // because the gates aren't all 4s apart — phase 4 only triggers at 30s.
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

  // The input is bound to `query` so keystrokes are reflected synchronously.
  // The search side-effect uses a DEFERRED copy of the query — when the user
  // types fast, React can drop intermediate values and only run the (more
  // expensive) effect for the latest committed value. Eliminates input lag
  // even on slow devices.
  const deferredQuery = useDeferredValue(query);

  // Debounced Photon fetch with abort-on-new-keystroke. The error state itself
  // is cleared synchronously in the input's `onChange` so users don't see a
  // stale error while typing — this effect only sets a NEW error when a
  // request actually fails.
  useEffect(() => {
    const trimmed = deferredQuery.trim();

    // Skip when query is too short to be meaningful, or when the input
    // already displays the currently-selected city's label.
    if (
      trimmed.length < 2 ||
      selected?.cityName === trimmed.split(",")[0]?.trim()
    ) {
      // Use the stable empty array so React can bail out if `suggestions` was
      // already empty.
      setSuggestions((prev) => (prev.length === 0 ? prev : EMPTY_SUGGESTIONS));
      setLoadingSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel any prior in-flight request before launching a new one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingSearch(true);
      try {
        // Photon requires `osm_tag` to be repeated as a separate param per
        // value — comma-joined values produce a 400.
        const params = new URLSearchParams();
        params.set("q", trimmed);
        params.set("limit", String(MAX_RESULTS));
        params.append("osm_tag", "place:city");
        params.append("osm_tag", "place:town");
        params.set("lang", "en");
        const url = `${PHOTON_URL}?${params.toString()}`;

        // Dev-only verification log: confirms the debounce truly fires once
        // per pause-in-typing rather than per keystroke.
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[CustomCityPicker] photon fetch", url);
        }

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Photon returned ${res.status}`);
        const data = (await res.json()) as PhotonResponse;
        const next = data.features
          .map(mapPhotonFeature)
          .filter((x): x is CitySuggestion => x !== null);
        setSuggestions(next.length > 0 ? next : EMPTY_SUGGESTIONS);
        setActiveIndex(0);
        setSearchError(null);
      } catch (err) {
        // Abort is expected (every keystroke kills the prior fetch).
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchError("Couldn't search right now. Try again.");
        setSuggestions(EMPTY_SUGGESTIONS);
      } finally {
        setLoadingSearch(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [deferredQuery, selected]);

  function pick(s: CitySuggestion) {
    setSelected(s);
    setQuery(suggestionLabel(s));
    setShowDropdown(false);
    setSuggestions(EMPTY_SUGGESTIONS);
    setSubmitError(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const item = suggestions[activeIndex];
      if (item) {
        e.preventDefault();
        pick(item);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setShowDropdown(false);
  }

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_SINGLE_CITY_WEBHOOK;
      if (!webhookUrl) throw new Error("Webhook not configured");

      // Field names match the n8n "Validate & Prepare" node contract:
      // `city` / `country` (NOT `cityName` / `countryName`). The Photon
      // response is read into `selected.cityName / countryName` for internal
      // clarity, but we rename on the wire.
      const payload = {
        // Selected city (from Photon result)
        city: selected.cityName,
        country: selected.countryName,
        countryCode: selected.countryCode,
        lat: selected.lat,
        lng: selected.lng,
        // Existing trip context (budget, dates, vibe, origin)
        budget: tripParams.budget,
        nights: tripParams.nights,
        travelers: tripParams.travelers,
        vibe: tripParams.vibe,
        originCity: tripParams.originCity,
        checkIn: tripParams.checkIn,
        checkOut: tripParams.checkOut,
      };

      // Diagnostic — paste this into the bug report if validation still fails.
      // Strip after the integration is verified.
      console.log(
        "[CustomCityPicker] submitting payload:",
        JSON.stringify(payload, null, 2),
      );

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      // Read as text first so we can diagnose empty / malformed bodies
      // without the cryptic "did not match the expected pattern" SyntaxError
      // that `res.json()` throws on Content-Length: 0.
      const rawText = await res.text();
      console.log("[CustomCityPicker] raw response:", rawText);
      console.log("[CustomCityPicker] response status:", res.status);
      console.log(
        "[CustomCityPicker] response headers:",
        Object.fromEntries(res.headers.entries()),
      );
      if (!rawText || rawText.trim() === "") {
        throw new Error(
          "Empty response from trip planner. The webhook may be misconfigured.",
        );
      }

      let data: { id?: string; tripId?: string };
      try {
        data = JSON.parse(rawText) as { id?: string; tripId?: string };
      } catch (parseErr) {
        console.error("[CustomCityPicker] JSON parse failed. Raw:", rawText, parseErr);
        throw new Error("Invalid JSON response from trip planner");
      }

      // n8n returns the full trip record with an `id` field; older mock /
      // alternate paths used `tripId`. Accept either.
      const tripId = data.id || data.tripId;
      if (!tripId) {
        console.error("[CustomCityPicker] No tripId in response. Full data:", data);
        throw new Error("No trip ID returned from webhook");
      }
      router.push(`/trip/${tripId}`);
    } catch (err) {
      console.error("[CustomCityPicker] submit failed:", err);
      const message = err instanceof Error ? err.message : "";
      // Surface the empty-webhook case directly so the dev sees what to fix.
      if (message.startsWith("Empty response")) {
        setSubmitError("Webhook returned empty response — check n8n workflow");
      } else {
        setSubmitError("Couldn't plan that trip. Please try again.");
      }
      setSubmitting(false);
    }
  }

  function toggleOpen() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    // give the picker a tick to render before focusing
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const activeId =
    showDropdown && suggestions[activeIndex]
      ? `${listboxId}-opt-${suggestions[activeIndex].key}`
      : undefined;

  const displayedHelpText = useMemo(() => {
    if (loadingSearch) return "Searching…";
    if (searchError) return searchError;
    // Only surface "no results" when we've actually searched the deferred
    // value (matching the fetch guard) and the request settled with zero hits.
    if (
      showDropdown &&
      deferredQuery.trim().length >= 2 &&
      suggestions.length === 0
    ) {
      return "No cities found.";
    }
    return null;
  }, [loadingSearch, searchError, showDropdown, deferredQuery, suggestions.length]);

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

            <div ref={containerRef} className="relative">
              <input
                ref={inputRef}
                id={`city-input-${reactId}`}
                type="text"
                role="combobox"
                aria-controls={listboxId}
                aria-expanded={showDropdown && suggestions.length > 0 && !submitting}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                autoComplete="off"
                spellCheck={false}
                disabled={submitting}
                value={query}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                  // Clear any prior error immediately on input change — don't
                  // wait the 300ms debounce to wipe it.
                  setSearchError(null);
                  if (selected && e.target.value !== suggestionLabel(selected)) {
                    setSelected(null);
                  }
                }}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                placeholder="Lisbon, Athens, Reykjavík…"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F8F7F5]"
              />

              {showDropdown && suggestions.length > 0 && !submitting && (
                <ul
                  id={listboxId}
                  role="listbox"
                  className="absolute left-0 right-0 z-20 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <li
                      key={s.key}
                      id={`${listboxId}-opt-${s.key}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseEnter={() => setActiveIndex(i)}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        pick(s);
                      }}
                      className={`px-4 py-3 cursor-pointer transition-colors duration-150 min-h-[48px] flex items-center gap-2.5 ${
                        i === activeIndex ? "bg-accent-light" : "hover:bg-accent-light/60"
                      }`}
                    >
                      <PinIcon size={15} className="text-accent shrink-0" />
                      <span className="text-sm text-[#1A1A1A] truncate">
                        <span className="font-semibold">{s.cityName}</span>
                        {s.countryName && (
                          <span className="text-muted">, {s.countryName}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {displayedHelpText && (
              <p className="mt-2 text-xs text-muted">{displayedHelpText}</p>
            )}

            <div className="mt-6">
              {submitting ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="animate-fade-in-overlay flex flex-col items-end gap-2"
                >
                  <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-full pl-4 pr-5 py-3">
                    {/* Pulsing dot — same accent color as the brand CTA, ping
                        ring suggests live activity without being noisy. */}
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
