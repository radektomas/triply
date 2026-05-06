"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// Photon-backed city/town autocomplete. Self-contained UI primitive — input +
// dropdown + inline spinner + helper text. No submit logic, no redirects: the
// parent owns whatever happens on selection (`onChange` callback).
//
// Used by:
//   - components/CustomCityPicker.tsx (the "/results" escape hatch)
//   - components/landing/TripForm.tsx (Step 3 "I know the exact city" mode)

export interface CitySelection {
  cityName: string;
  countryName: string;
  countryCode: string;
  lat: number;
  lng: number;
}

/** What kind of place suggestions to fetch from Photon.
 *  - 'city'   → place:city / place:town  (e.g. Lisbon, Barcelona)
 *  - 'region' → place:country / place:state / place:region  (e.g. Portugal, Tuscany, Bali) */
export type CityAutocompleteMode = "city" | "region";

interface Props {
  value: CitySelection | null;
  onChange: (selection: CitySelection | null) => void;
  placeholder?: string;
  disabled?: boolean;
  /** id passed through to the <input> so callers can wire <label htmlFor=...> */
  inputId?: string;
  /** Filters Photon results by OSM place tag. Defaults to 'city'. */
  mode?: CityAutocompleteMode;
}

const PHOTON_URL = "https://photon.komoot.io/api/";
const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;

interface CitySuggestion extends CitySelection {
  key: string;
}

const EMPTY: CitySuggestion[] = [];

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

// Module-level guard so the warmup ping fires at most once per page session,
// no matter how many CityAutocomplete instances mount.
let warmupFired = false;
function warmupPhoton() {
  if (warmupFired || typeof window === "undefined") return;
  warmupFired = true;
  // Vercel cold-start + first transAtlantic hop to komoot.io can add several
  // seconds to the first real search. Pre-fire a no-op so DNS/TLS/CDN warm
  // up while the user is reading the page. Fire-and-forget.
  fetch(`${PHOTON_URL}?q=warmup&limit=1`, {
    mode: "cors",
    priority: "low",
  } as RequestInit).catch(() => {});
}

function suggestionLabel(s: CitySelection): string {
  // For Photon's place:country results, name and country are identical
  // ("Portugal, Portugal"). Dedupe so the label reads cleanly.
  if (!s.countryName || s.countryName === s.cityName) return s.cityName;
  return `${s.cityName}, ${s.countryName}`;
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

function PinIcon({
  size = 15,
  className,
}: {
  size?: number;
  className?: string;
}) {
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

// Default placeholder copy by mode — overridable via the `placeholder` prop.
const PLACEHOLDER_BY_MODE: Record<CityAutocompleteMode, string> = {
  city: "Lisbon, Barcelona, Tokyo…",
  region: "Portugal, Tuscany, Bali…",
};

// Photon `osm_tag` values per mode. Each tag is appended as a separate
// query param (Photon rejects comma-joined values).
const OSM_TAGS_BY_MODE: Record<CityAutocompleteMode, readonly string[]> = {
  city: ["place:city", "place:town"],
  region: ["place:country", "place:state", "place:region"],
};

export function CityAutocomplete({
  value,
  onChange,
  placeholder,
  disabled = false,
  inputId,
  mode = "city",
}: Props) {
  const effectivePlaceholder = placeholder ?? PLACEHOLDER_BY_MODE[mode];
  const reactId = useId();
  const listboxId = `city-listbox-${reactId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState<string>(() =>
    value ? suggestionLabel(value) : "",
  );
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>(EMPTY);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Warm Photon on first mount of any CityAutocomplete instance.
  useEffect(() => {
    warmupPhoton();
  }, []);

  // Defer the value used by the search effect so a fast typer's keystrokes
  // are never blocked by the side-effects below. The input itself stays
  // bound to `query` (synchronous) — only the fetch trigger is deferred.
  const deferredQuery = useDeferredValue(query);

  // Debounced Photon fetch with abort-on-new-keystroke.
  useEffect(() => {
    const trimmed = deferredQuery.trim();

    if (
      trimmed.length < 2 ||
      value?.cityName === trimmed.split(",")[0]?.trim()
    ) {
      setSuggestions((prev) => (prev.length === 0 ? prev : EMPTY));
      setLoadingSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingSearch(true);
      try {
        // Photon requires `osm_tag` repeated as a separate param per value
        // (comma-joined values produce a 400). The list is driven by `mode`.
        const params = new URLSearchParams();
        params.set("q", trimmed);
        params.set("limit", String(MAX_RESULTS));
        for (const tag of OSM_TAGS_BY_MODE[mode]) {
          params.append("osm_tag", tag);
        }
        params.set("lang", "en");
        const url = `${PHOTON_URL}?${params.toString()}`;

        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("[CityAutocomplete] photon fetch", url);
        }

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Photon returned ${res.status}`);
        const data = (await res.json()) as PhotonResponse;
        const next = data.features
          .map(mapPhotonFeature)
          .filter((x): x is CitySuggestion => x !== null);
        setSuggestions(next.length > 0 ? next : EMPTY);
        setActiveIndex(0);
        setSearchError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchError("Couldn't search right now. Try again.");
        setSuggestions(EMPTY);
      } finally {
        setLoadingSearch(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [deferredQuery, value, mode]);

  function pick(s: CitySuggestion) {
    onChange({
      cityName: s.cityName,
      countryName: s.countryName,
      countryCode: s.countryCode,
      lat: s.lat,
      lng: s.lng,
    });
    setQuery(suggestionLabel(s));
    setShowDropdown(false);
    setSuggestions(EMPTY);
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

  // Photon can return duplicate `s.key` values for the same place + coords,
  // which breaks React's reconciler. Suffix the index so each rendered row
  // has a unique key/id within the list — and so aria-activedescendant
  // stays in sync with the actual DOM ids.
  const activeId =
    showDropdown && suggestions[activeIndex]
      ? `${listboxId}-opt-${suggestions[activeIndex].key}-${activeIndex}`
      : undefined;

  const helpText: string | null = (() => {
    if (loadingSearch) return "Searching…";
    if (searchError) return searchError;
    if (
      showDropdown &&
      deferredQuery.trim().length >= 2 &&
      suggestions.length === 0
    ) {
      return "No cities found.";
    }
    return null;
  })();

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={showDropdown && suggestions.length > 0 && !disabled}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={query}
        onFocus={() => setShowDropdown(true)}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setShowDropdown(true);
          setSearchError(null);
          // If the user is editing a previously-picked label, the parent's
          // value becomes stale — invalidate it.
          if (value && v !== suggestionLabel(value)) {
            onChange(null);
          }
          // Show "searching" instantly, before the 300ms debounce fires.
          if (v.trim().length >= 2) {
            setLoadingSearch(true);
          } else {
            setLoadingSearch(false);
          }
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={effectivePlaceholder}
        className="w-full rounded-xl border border-border bg-white pl-4 pr-10 py-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F8F7F5]"
      />

      {loadingSearch && !disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin"
        />
      )}

      {showDropdown && suggestions.length > 0 && !disabled && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.key}-${i}`}
              id={`${listboxId}-opt-${s.key}-${i}`}
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

      {helpText && <p className="mt-2 text-xs text-muted">{helpText}</p>}
    </div>
  );
}
