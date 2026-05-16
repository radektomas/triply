"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getCurrencyName } from "@/lib/currencyNames";
import { getCurrencySymbol } from "@/lib/formatCurrency";

function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const PINNED: readonly string[] = ["EUR", "USD", "GBP", "CZK", "PLN", "CHF"];

export function CurrencySelector() {
  const { selectedCurrency, setCurrency, rates, loading, error } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sorted list of all codes the rates feed returned, alphabetical.
  const codes = useMemo<string[]>(
    () => (rates ? Object.keys(rates).sort() : [selectedCurrency]),
    [rates, selectedCurrency],
  );

  // Pinned-then-divider-then-alphabetical view, used when no search query.
  // `null` entries represent the visual divider between the two groups.
  const groupedView = useMemo<Array<string | null>>(() => {
    const present = new Set(codes);
    const pinned = PINNED.filter((c) => present.has(c));
    const pinnedSet = new Set(pinned);
    const rest = codes.filter((c) => !pinnedSet.has(c));
    if (pinned.length === 0) return rest;
    return [...pinned, null, ...rest];
  }, [codes]);

  // Search matches the full set (pinned + rest) and disables the grouping
  // — once the user is filtering, alphabetical-with-matches is more useful.
  const filtered = useMemo<Array<string | null>>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groupedView;
    return codes.filter((code) => {
      if (code.toLowerCase().includes(q)) return true;
      return getCurrencyName(code).toLowerCase().includes(q);
    });
  }, [codes, groupedView, query]);

  // Close on outside click (desktop dropdown). On mobile the backdrop handles
  // dismissal, but the listener fires there too — both paths are safe.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  // Escape closes, autofocus search input on open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSelect(code: string) {
    setCurrency(code);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-black/10 text-sm font-medium text-[#1A1A1A] hover:bg-white transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${selectedCurrency}. Click to change.`}
      >
        <span>{selectedCurrency}</span>
        <ChevronDownIcon
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Mobile-only backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel: bottom sheet on mobile, anchored dropdown on sm+ */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:bottom-auto sm:top-full sm:right-0 sm:inset-x-auto sm:mt-2 sm:w-80 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-black/5 overflow-hidden"
            role="listbox"
            aria-label="Select currency"
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 sm:hidden">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                Select currency
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] -mr-1.5 p-1.5"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Search */}
            <div className="relative px-3 py-2.5 border-b border-black/5">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40">
                <SearchIcon />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search currency or code…"
                className="w-full pl-7 pr-2 py-1 text-sm bg-transparent border-0 outline-none placeholder:text-[#1A1A1A]/40"
              />
            </div>

            {/* List */}
            <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[#1A1A1A]/50">
                  No matches
                </div>
              ) : (
                filtered.map((code, idx) => {
                  if (code === null) {
                    return (
                      <div
                        key={`divider-${idx}`}
                        className="border-t border-black/5 my-1"
                        role="separator"
                        aria-hidden="true"
                      />
                    );
                  }
                  const isSelected = code === selectedCurrency;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-[#0D7377]/8 text-[#1A1A1A]"
                          : "hover:bg-black/5 text-[#1A1A1A]"
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="min-w-0">
                        <span className="font-semibold">{code}</span>
                        <span className="text-[#1A1A1A]/55">
                          {" — "}
                          {getCurrencyName(code)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[#1A1A1A]/45 text-xs tabular-nums">
                        {getCurrencySymbol(code)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {(loading || error) && (
              <div className="px-4 py-2 text-xs text-[#1A1A1A]/55 border-t border-black/5">
                {loading ? "Loading rates…" : error}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
