"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import type { BudgetCategory } from "@/lib/types/trip";

interface Props {
  total: number;
  range: { min: number; max: number };
  breakdown: BudgetCategory[];
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

export function BudgetBreakdown({ total, range, breakdown }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(barRef, { once: true });
  const shouldReduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  const sum = breakdown.reduce((acc, c) => acc + c.amount, 0);

  const ariaLabel = `Budget breakdown: ${breakdown
    .map((c) => `${c.label} €${c.amount}`)
    .join(", ")} — total €${total}`;

  return (
    <div className="space-y-6">
      {/* Hero number */}
      <div className="text-center sm:text-left">
        <p
          className="font-bold text-[#FF6B47] leading-none"
          style={{ fontSize: "clamp(2.5rem, 10vw, 4.5rem)" }}
        >
          €{total}
        </p>
        <p className="text-[#0D7377] text-xs font-bold uppercase tracking-widest mt-2">
          Total Trip · €{range.min}–€{range.max} range
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

      {/* Legend row */}
      <div className="flex flex-wrap gap-x-1 gap-y-1 pt-1">
        {breakdown.map((cat) => {
          const pct = Math.round((cat.amount / sum) * 100);
          const isActive = active === cat.label;
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => setActive((a) => (a === cat.label ? null : cat.label))}
              aria-expanded={isActive}
              aria-label={`${cat.label} — €${cat.amount}, ${pct}% of total`}
              className="flex items-center gap-2 min-h-[44px] px-2 py-1.5 rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B47]/50 focus-visible:ring-offset-1 hover:bg-[rgba(13,115,119,0.04)]"
              style={{
                opacity: active && !isActive ? 0.5 : 1,
                transition: "opacity 200ms, background-color 150ms",
                backgroundColor: isActive ? "rgba(13,115,119,0.04)" : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-left">
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {cat.icon} {cat.label}
                </span>
                <span className="text-xs text-[#0D7377] ml-1.5">
                  €{cat.amount} · {pct}%
                </span>
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
                className="flex-shrink-0 ml-0.5 transition-transform duration-200"
                style={{
                  opacity: isActive ? 0.7 : 0.4,
                  transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          );
        })}
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
                              €{cat.amount}
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
                            {cat.perUnit}
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
