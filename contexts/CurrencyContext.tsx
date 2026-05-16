"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  convertEUR,
  formatAmount,
  getRuntimeLocale,
  type FormatOptions,
  type Rates,
} from "@/lib/formatCurrency";

const STORAGE_KEY_CURRENCY = "triply_currency";
const STORAGE_KEY_RATES = "triply_rates";
const TTL_MS = 24 * 60 * 60 * 1000;
const API_URL = "https://open.er-api.com/v6/latest/EUR";
const DEFAULT_CURRENCY = "EUR";

type CachedRates = { rates: Rates; timestamp: number };

type CurrencyContextValue = {
  selectedCurrency: string;
  setCurrency: (code: string) => void;
  rates: Rates | null;
  loading: boolean;
  error: string | null;
  convert: (amountInEUR: number) => number;
  format: (amountInEUR: number, options?: FormatOptions) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCachedRates(): CachedRates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RATES);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedRates>;
    if (parsed?.rates && typeof parsed.timestamp === "number") {
      return parsed as CachedRates;
    }
  } catch {
    // ignore — bad JSON or storage blocked
  }
  return null;
}

function writeCachedRates(rates: Rates) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY_RATES,
      JSON.stringify({ rates, timestamp: Date.now() }),
    );
  } catch {
    // ignore — storage may be blocked (Safari private, quota, etc.)
  }
}

function readStoredCurrency(): string {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  try {
    return window.localStorage.getItem(STORAGE_KEY_CURRENCY) ?? DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Initial render uses defaults so SSR + first hydration match. Real values
  // load in the post-mount useEffect below.
  const [selectedCurrency, setSelectedCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>("en-US");

  useEffect(() => {
    setSelectedCurrency(readStoredCurrency());
    setLocale(getRuntimeLocale());
  }, []);

  useEffect(() => {
    const cached = readCachedRates();
    if (cached && Date.now() - cached.timestamp < TTL_MS) {
      setRates(cached.rates);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { rates?: Rates };
        if (!data?.rates) throw new Error("Invalid response");
        if (cancelled) return;
        setRates(data.rates);
        writeCachedRates(data.rates);
        setLoading(false);
      } catch {
        if (cancelled) return;
        if (cached) {
          setRates(cached.rates);
          setError("Using cached exchange rates");
        } else {
          setRates({ EUR: 1 });
          setError("Exchange rates unavailable");
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    setSelectedCurrency(code);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY_CURRENCY, code);
      } catch {
        // ignore
      }
    }
  }, []);

  const convert = useCallback(
    (amountInEUR: number) => convertEUR(amountInEUR, rates, selectedCurrency),
    [rates, selectedCurrency],
  );

  const format = useCallback(
    (amountInEUR: number, options?: FormatOptions) => {
      const converted = convertEUR(amountInEUR, rates, selectedCurrency);
      return formatAmount(converted, selectedCurrency, locale, options);
    },
    [rates, selectedCurrency, locale],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      selectedCurrency,
      setCurrency,
      rates,
      loading,
      error,
      convert,
      format,
    }),
    [selectedCurrency, setCurrency, rates, loading, error, convert, format],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
