"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AIRPORTS, type Airport } from "@/lib/data/airports";

interface Props {
  defaultAirport?: Airport;
  onChange: (city: string, airport?: Airport) => void;
  placeholder?: string;
}

const MAX_RESULTS = 5;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function rankAirport(a: Airport, query: string): number {
  const nq = normalize(query);
  if (!nq) return -1;
  const niata = a.iata.toLowerCase();
  const ncity = normalize(a.city);
  const nname = normalize(a.name);
  const akas = (a.aka ?? []).map(normalize);

  if (niata === nq) return 1000;
  if (niata.startsWith(nq)) return 900;
  if (ncity === nq) return 800;
  if (akas.some((x) => x === nq)) return 800;
  if (ncity.startsWith(nq)) return 700;
  if (akas.some((x) => x.startsWith(nq))) return 650;
  if (ncity.includes(nq)) return 500;
  if (akas.some((x) => x.includes(nq))) return 450;
  if (nname.includes(nq)) return 200;
  return -1;
}

function displayLabel(a: Airport): string {
  return `${a.city} (${a.iata})`;
}

export function AirportSearch({
  defaultAirport,
  onChange: emit,
  placeholder = "Where are you flying from?",
}: Props) {
  const reactId = useId();
  const listboxId = `airport-listbox-${reactId}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Set to true right before a programmatic blur (pick / Escape) so onBlur
  // doesn't run its restore-from-stale-`selected` logic and overwrite the
  // freshly-picked query.
  const skipBlurRestoreRef = useRef(false);

  const [selected, setSelected] = useState<Airport | null>(defaultAirport ?? null);
  const [query, setQuery] = useState(defaultAirport ? displayLabel(defaultAirport) : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    if (!open || !query.trim()) return [];
    return AIRPORTS.map((a) => ({ a, score: rankAirport(a, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((x) => x.a);
  }, [open, query]);

  useEffect(() => {
    if (activeIndex >= results.length) setActiveIndex(0);
  }, [results.length, activeIndex]);

  function pick(a: Airport) {
    skipBlurRestoreRef.current = true;
    setSelected(a);
    setQuery(displayLabel(a));
    setOpen(false);
    emit(a.city, a);
    inputRef.current?.blur();
  }

  function onFocus() {
    // Let the user type fresh; restore label on blur if they don't pick anything
    if (selected) setQuery("");
    setOpen(true);
    setActiveIndex(0);
  }

  function onBlur(e: React.FocusEvent<HTMLInputElement>) {
    // If a pick or Escape just fired, the query is already correct — don't restore from stale `selected`.
    if (skipBlurRestoreRef.current) {
      skipBlurRestoreRef.current = false;
      return;
    }
    // If focus moved into the dropdown, don't close
    if (containerRef.current?.contains(e.relatedTarget as Node)) return;
    setOpen(false);
    if (selected) setQuery(displayLabel(selected));
    else setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (results.length === 0 ? 0 : Math.min(i + 1, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && results[activeIndex]) {
        e.preventDefault();
        pick(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      // Close + restore label from the existing selection. Don't clear `selected`.
      skipBlurRestoreRef.current = true;
      setOpen(false);
      if (selected) setQuery(displayLabel(selected));
      inputRef.current?.blur();
    }
  }

  const activeId = open && results[activeIndex] ? `${listboxId}-opt-${results[activeIndex].iata}` : undefined;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          setActiveIndex(0);
          // Empty input → clear selection and notify parent
          if (v.trim() === "" && selected) {
            setSelected(null);
            emit("", undefined);
          }
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-[#1a1a1a] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#FF6B47]/40 focus:border-[#FF6B47]"
      />

      <span aria-live="polite" className="sr-only">
        {open && results.length > 0 ? `${results.length} airports found` : ""}
      </span>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-2 w-full bg-card rounded-2xl border border-border shadow-lg overflow-hidden"
          >
            {results.map((a, i) => (
              <li
                key={a.iata}
                id={`${listboxId}-opt-${a.iata}`}
                role="option"
                aria-selected={i === activeIndex}
                title={a.name}
                onPointerDown={(e) => {
                  // Pointer events unify mouse + touch + pen.
                  // preventDefault keeps the input focused so the synchronous
                  // blur path is controlled by pick() (with skipBlurRestoreRef),
                  // not by the browser's default focus-shift on pointerdown.
                  e.preventDefault();
                  pick(a);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-4 flex items-center justify-between cursor-pointer transition-colors duration-150 min-h-[48px] ${
                  i === activeIndex ? "bg-accent-light" : "hover:bg-accent-light/60"
                }`}
              >
                <div className="min-w-0 mr-3">
                  <div className="text-sm font-semibold text-[#1a1a1a] truncate">{a.city}</div>
                  <div className="text-xs text-muted truncate">{a.country}</div>
                </div>
                <span className="shrink-0 inline-flex items-center justify-center font-mono text-xs font-bold tracking-wider bg-cream text-[#1a1a1a] rounded-md px-2 py-1">
                  {a.iata}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
