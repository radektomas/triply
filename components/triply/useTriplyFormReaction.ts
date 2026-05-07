"use client";

import { useEffect, useRef, useState } from "react";
import type { TriplyState } from "./TriplyMascot";
import {
  BUDGET_HIGH_THRESHOLD,
  BUDGET_LOW_THRESHOLD,
  FORM_IDLE_QUOTES,
  SUBMIT_QUOTES,
  getRandomQuote,
  getBudgetQuotes,
  getNightsQuotes,
  getVibeQuotes,
  getTravelersQuotes,
  getOriginQuote,
  getMonthQuotes,
} from "@/lib/quotes";

// Form-state shape this hook reacts to. Wider than necessary on the `range`
// field so callers can pass react-day-picker's DateRange directly without a
// cast (DateRange is structurally compatible with `{ from?: Date; to?: Date }`).
export interface FormReactionInput {
  budget: number;
  travelers: number;
  vibe: string;
  originCity: string;
  range: { from?: Date; to?: Date } | undefined;
  nights: number;
  loading: boolean;
}

interface FormReaction {
  triplyState: TriplyState;
  quote: string;
}

// Each field has its own effect that compares the live value against the
// previous one captured in `prevValues`. On a transition, the effect picks a
// random quote from the matching bank, derives a TriplyState, and writes the
// reaction. Concurrent transitions in the same render tick all run, last
// effect wins (React batches the setReaction calls).
//
// `loading` short-circuits all field effects and locks the reaction to
// sleepy + a SUBMIT line. When loading flips back to false, no effect fires
// (each field's `prevValues` matches the current value), so the reaction
// stays sleepy until the next field change. That's intentional per the spec.
export function useTriplyFormReaction(input: FormReactionInput): FormReaction {
  const { budget, travelers, vibe, originCity, range, nights, loading } = input;

  const [reaction, setReaction] = useState<FormReaction>({
    triplyState: "sitting",
    quote: FORM_IDLE_QUOTES[0],
  });

  const prevValues = useRef({
    budget,
    travelers,
    vibe,
    originCity,
    rangeFrom: range?.from?.getTime(),
    nights,
  });

  // Loading is the priority signal — flip to sleepy + a SUBMIT line when
  // the parent kicks off a request.
  useEffect(() => {
    if (loading) {
      setReaction({
        triplyState: "sleepy",
        quote: getRandomQuote(SUBMIT_QUOTES),
      });
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (budget !== prevValues.current.budget) {
      const triplyState: TriplyState =
        budget < BUDGET_LOW_THRESHOLD
          ? "sad"
          : budget > BUDGET_HIGH_THRESHOLD
            ? "smug"
            : "happy";
      setReaction({
        triplyState,
        quote: getRandomQuote(getBudgetQuotes(budget)),
      });
      prevValues.current.budget = budget;
    }
  }, [budget, loading]);

  useEffect(() => {
    if (loading) return;
    if (travelers !== prevValues.current.travelers) {
      const triplyState: TriplyState = travelers >= 5 ? "happy" : "sitting";
      setReaction({
        triplyState,
        quote: getRandomQuote(getTravelersQuotes(travelers)),
      });
      prevValues.current.travelers = travelers;
    }
  }, [travelers, loading]);

  useEffect(() => {
    if (loading) return;
    if (vibe !== prevValues.current.vibe) {
      const triplyState: TriplyState =
        vibe === "beach" || vibe === "party" ? "smug" : "happy";
      setReaction({
        triplyState,
        quote: getRandomQuote(getVibeQuotes(vibe)),
      });
      prevValues.current.vibe = vibe;
    }
  }, [vibe, loading]);

  // Origin debounced 800ms — the AirportSearch onChange can fire many times
  // as the user types, and we don't want a quote update per keystroke.
  useEffect(() => {
    if (loading) return;
    if (
      originCity !== prevValues.current.originCity &&
      originCity.length > 0
    ) {
      const timer = setTimeout(() => {
        setReaction({
          triplyState: "happy",
          quote: getOriginQuote(originCity),
        });
        prevValues.current.originCity = originCity;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [originCity, loading]);

  // Month reacts to the from-date specifically — pick a different month and
  // Triply has something to say. Same calendar month → no fire.
  useEffect(() => {
    if (loading) return;
    const fromTime = range?.from?.getTime();
    if (fromTime !== prevValues.current.rangeFrom && range?.from) {
      setReaction({
        triplyState: "happy",
        quote: getRandomQuote(getMonthQuotes(range.from)),
      });
      prevValues.current.rangeFrom = fromTime;
    }
  }, [range?.from, loading]);

  useEffect(() => {
    if (loading) return;
    if (nights !== prevValues.current.nights && nights > 0) {
      const triplyState: TriplyState = nights >= 7 ? "smug" : "happy";
      setReaction({
        triplyState,
        quote: getRandomQuote(getNightsQuotes(nights)),
      });
      prevValues.current.nights = nights;
    }
  }, [nights, loading]);

  return reaction;
}
