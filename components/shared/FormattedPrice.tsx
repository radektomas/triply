"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

interface Props {
  // Source amount in EUR (the app's source-of-truth currency).
  eur: number;
  // Default true — Triply price displays use display-only rounding to nice
  // intervals (see lib/formatCurrency.ts roundForDisplay). Pass false for
  // amounts where exact figures matter.
  rounded?: boolean;
}

// Tiny client island for inline price rendering inside otherwise-server
// components (e.g. DestinationCard which is async because of getCityPhoto).
// Returns plain text via fragment — caller controls any surrounding span.
export function FormattedPrice({ eur, rounded = true }: Props) {
  const { format } = useCurrency();
  return <>{format(eur, { rounded })}</>;
}
