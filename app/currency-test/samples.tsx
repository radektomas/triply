"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

const SAMPLES: Array<{ label: string; eur: number }> = [
  { label: "Long weekend budget", eur: 300 },
  { label: "Hotel total (3 nights)", eur: 180 },
  { label: "Flight round-trip", eur: 140 },
  { label: "Activity per person", eur: 24 },
  { label: "Coffee", eur: 3.5 },
  { label: "Whole-trip range max", eur: 850 },
];

export function CurrencyTestSamples() {
  const { format, convert, loading, error, selectedCurrency, rates } = useCurrency();

  return (
    <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4 shadow-sm">
      <div className="text-xs text-[#1A1A1A]/60 space-y-1">
        <div>
          Selected: <span className="font-mono font-semibold">{selectedCurrency}</span>
        </div>
        <div>
          Rates loaded:{" "}
          <span className="font-mono">{rates ? Object.keys(rates).length : 0}</span>
          {loading && " · loading…"}
          {error && <span className="text-orange-600"> · {error}</span>}
        </div>
        <div>
          1 EUR ={" "}
          <span className="font-mono">
            {convert(1).toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>{" "}
          {selectedCurrency}
        </div>
      </div>

      <ul className="space-y-2 pt-2 border-t border-black/5">
        {SAMPLES.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-[#1A1A1A]/70">
              {s.label}{" "}
              <span className="text-[#1A1A1A]/35 text-xs">(€{s.eur})</span>
            </span>
            <span className="font-semibold tabular-nums text-[#1A1A1A]">
              {format(s.eur)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
