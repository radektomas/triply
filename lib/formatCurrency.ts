// Pure helpers for currency conversion + display. No React, no I/O — these
// are called by CurrencyContext which owns the rates state and selected code.

export type Rates = Record<string, number>;

// Convert an amount denominated in EUR (the app's source-of-truth currency)
// into the target currency using EUR-base rates (e.g. open.er-api.com/v6/latest/EUR).
// Falls back to the raw EUR amount if the rate is missing — better to show an
// approximate price than to crash or blank the UI.
export function convertEUR(
  amountInEUR: number,
  rates: Rates | null,
  target: string,
): number {
  if (target === "EUR") return amountInEUR;
  const rate = rates?.[target];
  if (rate === undefined) return amountInEUR;
  return amountInEUR * rate;
}

export type FormatOptions = {
  // Whole-number display by default (Triply prices are integer EUR amounts;
  // a converted figure like 540.83 USD reads cleaner rounded to "$541").
  // Set explicitly to show cents for prices that need them.
  decimals?: number;
  // Opt-in display-only rounding to nice intervals. Internal source value is
  // unchanged. See `roundForDisplay` below for the per-currency step.
  rounded?: boolean;
};

// Currencies where 1 unit ≈ a few cents in USD/EUR terms — JPY, KRW, HUF, etc.
// These benefit from coarser rounding intervals so converted amounts read clean
// ("CZK 21,000" instead of "CZK 20,675").
const SMALL_UNIT_CURRENCIES: ReadonlySet<string> = new Set([
  "CZK",
  "HUF",
  "JPY",
  "KRW",
  "ISK",
  "IDR",
  "VND",
]);

// Display-only rounding. Step is chosen per-currency + per-magnitude:
//   - amount ≥ 1000:  small-unit → 500,  others → 50
//   - amount  < 1000: small-unit → 50,   others → 10
// Callers should only use this for price/budget displays. Tiny amounts that
// would round to 0 stay raw — caller can check `value === 0 && amount !== 0`
// to detect this if they need to render the unrounded amount instead.
export function roundForDisplay(amount: number, currency: string): number {
  const isSmallUnit = SMALL_UNIT_CURRENCIES.has(currency);
  const step =
    Math.abs(amount) >= 1000 ? (isSmallUnit ? 500 : 50) : isSmallUnit ? 50 : 10;
  return Math.round(amount / step) * step;
}

// Format an already-converted amount as a localized currency string.
// `Intl.NumberFormat` handles symbol placement and locale conventions
// (e.g. "$540" en-US vs "540,00 $" de-DE). Falls back to `${code} ${amount}`
// if the runtime doesn't recognize the code.
export function formatAmount(
  amount: number,
  currency: string,
  locale = "en-US",
  options?: FormatOptions,
): string {
  const value = options?.rounded ? roundForDisplay(amount, currency) : amount;
  const decimals = options?.decimals ?? 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(decimals)}`;
  }
}

export function getRuntimeLocale(): string {
  if (typeof navigator === "undefined") return "en-US";
  return navigator.language || "en-US";
}

// Extract just the currency symbol for a code in a given locale ("$", "€", "¥").
// Used by the selector button + each row for a tiny visual cue. Falls back to
// the raw code if Intl can't determine a symbol.
export function getCurrencySymbol(code: string, locale = "en-US"): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}
