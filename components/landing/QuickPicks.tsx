"use client";

// Note: filename kept as QuickPicks for revert-friendliness — this used to
// be the curated-trips gallery and now plays the role of the budget-based
// results showcase. The QuickPickCard / lib/data/getQuickPick code paths
// are still used by /trips/<slug> routes, so they stay; only the landing
// page slot's contents changed.

import { useMemo, useState } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  BUDGET_TIERS,
  DEFAULT_TIER_VALUE,
} from "@/lib/budgetShowcase";
import { BudgetShowcaseCard } from "./BudgetShowcaseCard";

export function QuickPicks() {
  const { format } = useCurrency();
  const [tierValue, setTierValue] = useState<number>(DEFAULT_TIER_VALUE);

  const activeTier = useMemo(
    () =>
      BUDGET_TIERS.find((t) => t.value === tierValue) ?? BUDGET_TIERS[0],
    [tierValue],
  );

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-8 md:mb-10 text-center md:text-left">
          <div className="h-0.5 w-8 bg-accent mb-3 mx-auto md:mx-0" />
          <p className="font-serif uppercase tracking-[0.2em] font-medium text-accent text-xs mb-3">
            Real example trips
          </p>
          <h2
            className="font-semibold text-[#1A1A1A] leading-tight mb-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Here&apos;s what your budget actually gets you.
          </h2>
          <p
            className="text-[15px] sm:text-base"
            style={{ color: "rgba(13,115,119,0.7)" }}
          >
            Example trips Triply has planned. Pick a budget to see the range.
          </p>
        </div>

        {/* Tier toggle — brand teal active, neutral inactive. Labels run
            through the currency formatter so the pill values stay consistent
            with the per-card prices below regardless of selected currency. */}
        <div
          role="tablist"
          aria-label="Budget tiers"
          className="flex justify-center gap-2 mb-8"
        >
          {BUDGET_TIERS.map((tier) => {
            const isActive = tier.value === tierValue;
            return (
              <button
                key={tier.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTierValue(tier.value)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#0D7377] text-white shadow-md scale-[1.02]"
                    : "bg-[#F5F5F5] text-[#1a1a1a] hover:bg-[#0D7377]/10"
                }`}
              >
                {format(tier.value, { rounded: true })}
              </button>
            );
          })}
        </div>

        {/* Cards — keyed by tier so React rebuilds the list on swap rather
            than mutating in place; matches the spec's "do not rely on hidden
            tiers" guidance. */}
        <div
          key={tierValue}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {activeTier.examples.map((example) => (
            <BudgetShowcaseCard
              key={`${tierValue}-${example.city}-${example.country}`}
              example={example}
              budget={tierValue}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Example trips · per person, all-in · prices vary by dates.
        </p>
      </div>
    </section>
  );
}
