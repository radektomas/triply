"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AirportSearch } from "@/components/landing/AirportSearch";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AIRPORTS, type Airport } from "@/lib/data/airports";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_PRESETS,
  BUDGET_STEP,
  PARTY_PRESETS,
} from "@/lib/traveler";
import { StepShell } from "./StepShell";

interface Props {
  budgetEur: number;
  homeAirport: string | null;
  travelParty: number;
  onBudget: (eur: number) => void;
  onAirport: (a: Airport) => void;
  onParty: (count: number) => void;
}

export function StepBudget({
  budgetEur,
  homeAirport,
  travelParty,
  onBudget,
  onAirport,
  onParty,
}: Props) {
  const reduceMotion = useReducedMotion();
  const { format } = useCurrency();
  const pct = ((budgetEur - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const defaultAirport = AIRPORTS.find((a) => a.iata === (homeAirport ?? "PRG"));

  return (
    <StepShell
      eyebrow="Step 3 · Budget & base"
      title={
        <>
          What does a trip <span className="text-accent">usually cost you?</span>
        </>
      }
      sub="Per person, the whole trip — flights, bed, food, fun. We'll only show you places that fit."
    >
      {/* Hero number */}
      <div className="text-center">
        <motion.div
          key={Math.round(budgetEur / 50)}
          initial={reduceMotion ? false : { scale: 0.97, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="font-display text-7xl md:text-8xl font-bold text-accent leading-none tabular-nums tracking-tight"
          aria-live="polite"
        >
          {format(budgetEur, { rounded: true })}
        </motion.div>
        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-[#1a1a1a]/55 font-medium">
          <span>per person</span>
          <span aria-hidden className="text-[#1a1a1a]/30">·</span>
          <CurrencySelector />
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full space-y-8">
        {/* Slider */}
        <div className="px-1">
          <input
            type="range"
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            value={budgetEur}
            onChange={(e) => onBudget(Number(e.target.value))}
            aria-label="Usual budget per person"
            aria-valuemin={BUDGET_MIN}
            aria-valuemax={BUDGET_MAX}
            aria-valuenow={budgetEur}
            style={{
              background: `linear-gradient(to right, #FF6B47 0%, #FF6B47 ${pct}%, rgba(26,26,26,0.16) ${pct}%, rgba(26,26,26,0.16) 100%)`,
            }}
          />
          <div className="flex justify-between text-[11px] font-semibold text-[#1a1a1a]/45 mt-2 tabular-nums">
            <span>{format(BUDGET_MIN, { rounded: true })}</span>
            <span>{format(BUDGET_MAX, { rounded: true })}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {BUDGET_PRESETS.map((p) => {
              const active = budgetEur === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onBudget(p)}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer ring-1 ${
                    active
                      ? "bg-teal text-white ring-teal"
                      : "bg-white/70 text-[#1a1a1a] ring-black/5 hover:bg-white"
                  }`}
                >
                  {format(p, { rounded: true })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Travel party */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55 mb-3">
            Who&apos;s usually coming?
          </p>
          <div
            role="radiogroup"
            aria-label="Usual travel party"
            className="inline-flex flex-wrap rounded-full bg-white/60 p-1 gap-0.5"
          >
            {PARTY_PRESETS.map((opt) => {
              const active = travelParty === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onParty(opt.count)}
                  className={`relative px-4 sm:px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                    active ? "text-white" : "text-[#1a1a1a] hover:text-teal"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="onboarding-party-pill"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-teal shadow-md"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 38 }
                      }
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Home airport */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]/55 mb-3">
            Flying from
          </p>
          <AirportSearch
            defaultAirport={defaultAirport}
            onChange={(_city, airport) => {
              if (airport) onAirport(airport);
            }}
            placeholder="Your home airport"
          />
        </div>
      </div>
    </StepShell>
  );
}
