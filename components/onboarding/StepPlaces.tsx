"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getGradient } from "@/lib/utils/gradient";
import { flagEmoji } from "@/lib/data/countryCodes";
import { MAX_VISITED_PLACES, type VisitedPlace } from "@/lib/traveler";
import type { GlobeCountry } from "./CountryGlobe";
import { StepShell, Pill } from "./StepShell";

// d3-geo + topojson + the 110m atlas only load when this step mounts.
const CountryGlobe = dynamic(
  () => import("./CountryGlobe").then((m) => m.CountryGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full rounded-full bg-teal/15 animate-pulse" />
    ),
  },
);

interface Props {
  places: VisitedPlace[];
  /** Set of place ids with a photo upload in flight. */
  uploading: ReadonlySet<string>;
  onAdd: (country: GlobeCountry) => void;
  onRemove: (id: string) => void;
  onPhoto: (id: string, file: File) => void;
}

function CameraIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function StepPlaces({ places, uploading, onAdd, onRemove, onPhoto }: Props) {
  const reduceMotion = useReducedMotion();
  const [countries, setCountries] = useState<GlobeCountry[]>([]);
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const full = places.length >= MAX_VISITED_PLACES;

  const selected = useMemo(
    () => new Set(places.map((p) => p.countryCode).filter(Boolean)),
    [places],
  );

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return countries
      .map((c) => {
        const n = normalize(c.name);
        const score = n === q ? 3 : n.startsWith(q) ? 2 : n.includes(q) ? 1 : 0;
        return { c, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name))
      .slice(0, 6)
      .map((r) => r.c);
  }, [countries, query]);

  function toggle(c: GlobeCountry) {
    if (selected.has(c.alpha2)) {
      const p = places.find((x) => x.countryCode === c.alpha2);
      if (p) onRemove(p.id);
    } else if (!full) {
      onAdd(c);
    }
    // Retrigger the focus animation even for the same country twice.
    setFocus(null);
    requestAnimationFrame(() => setFocus(c.alpha2));
  }

  function pickResult(c: GlobeCountry) {
    toggle(c);
    setQuery("");
    setActiveIdx(0);
  }

  return (
    <StepShell
      eyebrow="Step 2 · Been there"
      title={
        <>
          Which countries have you <span className="text-teal">already been to?</span>
        </>
      }
      sub="Spin the globe and tap them. It helps Triply get to know your taste. Photos are optional and stay private."
    >
      {/* Search first — it has to be obvious that typing is an option for
          anyone who can't find their country on the sphere. */}
      <div className="max-w-xl mx-auto w-full -mt-2">
      <div className="relative">
        <label htmlFor="country-search" className="sr-only">
          Find a country
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40">
          <SearchIcon />
        </span>
        <input
          id="country-search"
          type="text"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="country-results"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          value={query}
          disabled={full}
          placeholder={full ? "That's a full passport" : "Can't find it? Type a country…"}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              if (results[activeIdx]) {
                e.preventDefault();
                pickResult(results[activeIdx]);
              }
            } else if (e.key === "Escape") {
              setQuery("");
            }
          }}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 disabled:opacity-60"
        />
        {results.length > 0 && (
          <ul
            id="country-results"
            role="listbox"
            className="absolute z-20 mt-2 w-full rounded-2xl bg-white border border-border shadow-lg overflow-hidden"
          >
            {results.map((c, i) => {
              const isSel = selected.has(c.alpha2);
              return (
                <li key={c.alpha2} role="option" aria-selected={i === activeIdx}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickResult(c)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      i === activeIdx ? "bg-accent-light" : "bg-white"
                    }`}
                  >
                    <span className="text-lg leading-none">{flagEmoji(c.alpha2)}</span>
                    <span className="font-medium text-[#1a1a1a] flex-1">{c.name}</span>
                    <span className="text-[11px] font-semibold text-[#1a1a1a]/45">
                      {isSel ? "Remove" : "Add"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-8 md:gap-10 items-start">
        {/* Globe */}
        <div className="mx-auto w-full max-w-[440px] md:sticky md:top-20">
          <CountryGlobe
            selected={selected}
            onToggle={toggle}
            onReady={setCountries}
            focusAlpha2={focus}
          />
          <p className="mt-2 text-center text-xs text-[#1a1a1a]/50 font-medium">
            Drag to spin · pinch or scroll to zoom · tap a country to stamp it · or search above
          </p>
        </div>

        {/* Search + stamps */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55">
              Your passport
            </p>
            <Pill tone={places.length ? "teal" : "neutral"}>
              {places.length} {places.length === 1 ? "stamp" : "stamps"}
            </Pill>
          </div>

          {places.length === 0 ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border-2 border-dashed border-[#1a1a1a]/12 bg-white/40 px-6 py-10 text-center"
            >
              <p className="font-display text-xl font-bold text-[#1a1a1a]/70">No stamps yet.</p>
              <p className="text-sm text-[#1a1a1a]/50 mt-1">
                Tap a country on the globe and it lands here. Or skip — you can fill this in any time.
              </p>
            </motion.div>
          ) : (
            <motion.ul
              layout
              className="grid grid-cols-2 gap-4"
              aria-label="Countries you've visited"
            >
              <AnimatePresence initial={false}>
                {places.map((place, i) => (
                  <PlaceStamp
                    key={place.id}
                    place={place}
                    tilt={i % 2 === 0 ? -1.2 : 1.2}
                    uploading={uploading.has(place.id)}
                    onRemove={() => onRemove(place.id)}
                    onPhoto={(file) => onPhoto(place.id, file)}
                    reduceMotion={!!reduceMotion}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </div>
    </StepShell>
  );
}

function PlaceStamp({
  place,
  tilt,
  uploading,
  onRemove,
  onPhoto,
  reduceMotion,
}: {
  place: VisitedPlace;
  tilt: number;
  uploading: boolean;
  onRemove: () => void;
  onPhoto: (file: File) => void;
  reduceMotion: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const pending = place.id.startsWith("tmp-");
  const photo = place.photoUrl ?? place.stockPhotoUrl;
  const ownPhoto = !!place.photoUrl;
  const flag = flagEmoji(place.countryCode);

  return (
    <motion.li
      layout
      initial={reduceMotion ? false : { opacity: 0, scale: 0.8, rotate: tilt * 4 }}
      animate={{ opacity: 1, scale: 1, rotate: tilt }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.02 }}
      className="relative aspect-square rounded-3xl overflow-hidden shadow-[0_14px_36px_-14px_rgba(13,115,119,0.4)] bg-white ring-4 ring-white"
      style={{ willChange: "transform" }}
    >
      {photo ? (
        // Plain <img>: signed Supabase URLs, blob: previews and Pexels CDN
        // links are outside next/image's remotePatterns or change per load.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={place.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: getGradient(place.id) }}
        >
          <span className="text-7xl select-none drop-shadow">{flag || place.name.charAt(0)}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 p-4 text-white flex items-end gap-2.5">
        {flag && <span className="text-2xl leading-none drop-shadow">{flag}</span>}
        <p className="font-display font-bold text-xl leading-tight drop-shadow-sm truncate">
          {place.name}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        aria-label={`Remove ${place.name}`}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer disabled:opacity-40"
      >
        <XIcon />
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading || pending}
        aria-label={ownPhoto ? `Change your photo for ${place.name}` : `Add your own photo for ${place.name}`}
        className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 text-[#1a1a1a] px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
      >
        <CameraIcon />
        {ownPhoto ? "Change" : "My photo"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(f);
          e.target.value = "";
        }}
      />

      {(uploading || pending) && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-[#FF6B47]/30 border-t-[#FF6B47] animate-spin" />
        </div>
      )}
    </motion.li>
  );
}
