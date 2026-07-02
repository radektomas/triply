"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { BudgetCategory } from "@/lib/types/trip";

interface Props {
  total: number;
  range: { min: number; max: number };
  breakdown: BudgetCategory[];
  travelers?: number;
}

const CATEGORY_DEFAULTS: Record<string, { typical?: string; tips?: string[] }> = {
  Flights: {
    typical: "Budget airline round-trip",
    tips: ["Book 6–8 weeks ahead", "Tuesday/Wednesday flights are cheapest"],
  },
  Hotel: {
    typical: "Mid-tier 3★ hotel or Airbnb",
    tips: [
      "Compare Booking.com and direct hotel rates",
      "Look 15+ min walk from centre for better prices",
    ],
  },
  Food: {
    typical: "Mix of local restaurants and one nice dinner",
    tips: ["Breakfast in cafés, not hotels", "Lunch menu of the day is cheapest"],
  },
  Activities: {
    typical: "2–3 paid activities + free sightseeing",
    tips: [
      "Book tours 1 week ahead for better prices",
      "Free walking tours available in most cities",
    ],
  },
  Transport: {
    typical: "Public transit + occasional taxi",
    tips: ["Get a day pass if using 3+ rides", "Walk when possible — you'll see more"],
  },
};

function getCategoryDefaults(cat: BudgetCategory) {
  return CATEGORY_DEFAULTS[cat.label] ?? {};
}

// `travelers` is intentionally not consumed — every figure here is per-person.
// Kept in Props so existing call sites remain valid.
export function BudgetBreakdown({ total, range, breakdown }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(barRef, { once: true });
  const shouldReduce = useReducedMotion() ?? false;
  const { format } = useCurrency();
  const fmt = (eur: number) => format(eur, { rounded: true });

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  const sum = Math.max(breakdown.reduce((acc, c) => acc + (c.amount || 0), 0), 1);

  const ariaLabel = `Budget breakdown: ${breakdown
    .map((c) => `${c.label} ${fmt(c.amount)}`)
    .join(", ")} — total ${fmt(total)}`;

  return (
    <div className="space-y-5">
      {/* Hero number */}
      <div className="text-center sm:text-left">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-1.5">
          Per person
        </p>
        <p
          className="font-bold text-[#FF6B47] leading-none"
          style={{ fontSize: "clamp(2.5rem, 10vw, 4.5rem)" }}
        >
          {fmt(total)}
        </p>
        <p className="text-[#0D7377] text-xs font-bold uppercase tracking-widest mt-2">
          Range · {fmt(range.min)}–{fmt(range.max)} per person
        </p>
      </div>

      {/* Stacked bar */}
      <div ref={barRef} className="relative py-4 -my-4">
        {/* Visual layer — overflow-hidden gives pill shape */}
        <div
          role="img"
          aria-label={ariaLabel}
          className="h-2.5 sm:h-3 rounded-full overflow-hidden bg-[#FFE4CC] flex gap-px"
          style={{ boxShadow: "0 2px 8px rgba(13,115,119,0.08)" }}
        >
          {breakdown.map((cat, idx) => {
            const pct = (cat.amount / sum) * 100;
            const isActive = active === cat.label;
            return (
              <motion.div
                key={cat.label}
                className="h-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: cat.color,
                  transformOrigin: "left center",
                  filter: isActive ? "brightness(1.1)" : "none",
                  transition: "filter 200ms",
                }}
                initial={{ scaleX: shouldReduce ? 1 : 0, opacity: 1 }}
                animate={{
                  scaleX: isInView || shouldReduce ? 1 : 0,
                  opacity: active && !isActive ? 0.65 : 1,
                }}
                transition={{
                  scaleX: {
                    delay: shouldReduce ? 0 : idx * 0.08,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  },
                  opacity: { duration: 0.2 },
                }}
              />
            );
          })}
        </div>

        {/* Button overlay — sits on top, expands to 44px hit area via py-4 -my-4 parent */}
        <div
          className="absolute inset-0 flex"
          aria-hidden="true"
        >
          {breakdown.map((cat) => {
            const pct = (cat.amount / sum) * 100;
            return (
              <button
                key={cat.label}
                type="button"
                style={{ width: `${pct}%` }}
                className="h-full cursor-pointer"
                tabIndex={-1}
                onClick={() => setActive((a) => (a === cat.label ? null : cat.label))}
              />
            );
          })}
        </div>
      </div>

      {/* Legend section — single-column stacked list. The whole page is
          per-person (matching the hero above and the breakdown amounts, which
          are per-person), so the eyebrow says "per person" too. (Was "total for
          N travelers", which contradicted the per-person hero and the
          never-multiplied-by-travelers amounts.) */}
      <div className="pt-1">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-2.5">
          Breakdown · per person
        </p>
        <div className="flex flex-col">
          {breakdown.map((cat) => {
            const pct = Math.round((cat.amount / sum) * 100);
            const isActive = active === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActive((a) => (a === cat.label ? null : cat.label))}
                aria-expanded={isActive}
                aria-label={`${cat.label} — ${fmt(cat.amount)}, ${pct}% of total`}
                className="flex items-center justify-between gap-3 min-h-[44px] px-2 py-2 rounded-lg w-full text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B47]/50 focus-visible:ring-offset-1 hover:bg-[rgba(13,115,119,0.04)]"
                style={{
                  opacity: active && !isActive ? 0.5 : 1,
                  transition: "opacity 200ms, background-color 150ms",
                  backgroundColor: isActive ? "rgba(13,115,119,0.04)" : undefined,
                }}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span aria-hidden="true" className="text-base leading-none">
                    {cat.icon}
                  </span>
                  <span className="text-sm font-medium text-[#1A1A1A] truncate">
                    {cat.label}
                  </span>
                </span>
                <span className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-[#1A1A1A] tabular-nums">
                    {fmt(cat.amount)}
                  </span>
                  <span className="text-xs text-[#0D7377] tabular-nums w-9 text-right">
                    {pct}%
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0D7377"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{
                      opacity: isActive ? 0.7 : 0.4,
                      transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded detail card */}
      <div aria-live="polite">
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl bg-[#FFF8F5] border-2 border-[#FF6B47]/20 p-5 mt-1">
                <AnimatePresence mode="wait">
                  {(() => {
                    const cat = breakdown.find((c) => c.label === active);
                    if (!cat) return null;
                    const defs = getCategoryDefaults(cat);
                    const tips = cat.tips ?? defs.tips ?? [];
                    const typical = cat.typical ?? defs.typical;
                    const pct = Math.round((cat.amount / sum) * 100);
                    return (
                      <motion.div
                        key={active}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl leading-none">{cat.icon}</span>
                            <div>
                              <p className="font-semibold text-[#1A1A1A] leading-tight">
                                {cat.label}
                              </p>
                              <p className="text-xs text-muted">{pct}% of total</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-[#FF6B47]">
                              {fmt(cat.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActive(null)}
                              aria-label="Close detail"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-[#1A1A1A] hover:bg-black/5 transition-colors text-xl leading-none -mr-1"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="h-px bg-border mb-3" />

                        {cat.perUnit && (
                          <p className="text-sm font-medium text-[#1A1A1A] mb-2">
                            {cat.perUnit.amount !== undefined && (
                              <>
                                {fmt(cat.perUnit.amount)}
                                {cat.perUnit.amountMax !== undefined && (
                                  <>–{fmt(cat.perUnit.amountMax)}</>
                                )}
                              </>
                            )}
                            {cat.perUnit.unit ?? ""}
                          </p>
                        )}
                        {typical && (
                          <p className="text-sm text-muted mb-3">
                            <span className="font-medium text-[#374151]">Typical: </span>
                            {typical}
                          </p>
                        )}
                        {tips.length > 0 && (
                          <ul className="space-y-1.5">
                            {tips.map((tip, i) => (
                              <li
                                key={i}
                                className="text-sm text-[#374151] flex items-start gap-2"
                              >
                                <span className="text-[#0D7377] font-bold flex-shrink-0 mt-px">
                                  →
                                </span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        )}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
