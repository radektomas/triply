"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { EstimateMark } from "./EstimateMark";

interface Props {
  // Source amount in EUR (the app's source-of-truth currency).
  eur: number;
  // Default true — Triply price displays use display-only rounding to nice
  // intervals (see lib/formatCurrency.ts roundForDisplay). Pass false for
  // amounts where exact figures matter.
  rounded?: boolean;
  /**
   * Render the inline ≈ estimate marker after the figure. Default TRUE.
   *
   * Every price Triply shows is model-generated, not fetched from a pricing
   * API, so the default has to be "marked as an estimate" — an opt-in marker
   * would inevitably be forgotten on some surface, which is how the misleading
   * claim got there in the first place.
   *
   * Pass false only where the number is NOT a prediction: a budget the user
   * typed themselves, or a currency-conversion demo.
   */
  estimate?: boolean;
}

// Tiny client island for inline price rendering inside otherwise-server
// components (e.g. DestinationCard which is async because of getCityPhoto).
export function FormattedPrice({ eur, rounded = true, estimate = true }: Props) {
  const { format } = useCurrency();
  return (
    <>
      {format(eur, { rounded })}
      {estimate && <EstimateMark />}
    </>
  );
}
