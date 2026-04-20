"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const VIBES = [
  { value: "beach", label: "🏖️ Beach" },
  { value: "city", label: "🏙️ City" },
  { value: "mountains", label: "⛰️ Mountains" },
  { value: "party", label: "🎉 Party" },
  { value: "culture", label: "🎨 Culture" },
  { value: "adventure", label: "🧗 Adventure" },
];

const ORIGIN_CITIES = [
  "Prague", "Vienna", "Berlin", "Warsaw", "Budapest", "London", "Amsterdam",
];

export function TripForm() {
  const router = useRouter();
  const [budget, setBudget] = useState(500);
  const [month, setMonth] = useState("june");
  const [nights, setNights] = useState(4);
  const [vibe, setVibe] = useState("beach");
  const [originCity, setOriginCity] = useState("Prague");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    router.push(
      `/results?budget=${budget}&month=${month}&nights=${nights}&vibe=${vibe}&originCity=${encodeURIComponent(originCity)}`
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 w-full max-w-2xl mx-auto">
      {/* Budget Slider */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted">
            Total Budget
          </label>
          <span className="text-2xl font-bold text-accent">€{budget}</span>
        </div>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full"
          aria-label="Budget in euros"
        />
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>€100</span>
          <span>€1,000</span>
        </div>
      </div>

      {/* Month Picker */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Travel Month
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {MONTHS.map((m) => {
            const value = m.toLowerCase();
            const selected = month === value;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(value)}
                className={`py-2 px-1 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  selected
                    ? "bg-accent text-white shadow-sm scale-[1.03]"
                    : "bg-[#F3F4F6] text-[#374151] hover:bg-accent-light hover:text-accent"
                }`}
              >
                {m.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nights Stepper */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Number of Nights
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setNights((n) => Math.max(1, n - 1))}
            disabled={nights === 1}
            aria-label="Decrease nights"
            className="w-11 h-11 rounded-xl bg-[#F3F4F6] text-[#374151] text-xl font-bold hover:bg-accent-light hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            −
          </button>
          <span className="text-3xl font-bold w-10 text-center tabular-nums">
            {nights}
          </span>
          <button
            type="button"
            onClick={() => setNights((n) => Math.min(7, n + 1))}
            disabled={nights === 7}
            aria-label="Increase nights"
            className="w-11 h-11 rounded-xl bg-[#F3F4F6] text-[#374151] text-xl font-bold hover:bg-accent-light hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            +
          </button>
          <span className="text-muted font-medium">
            {nights === 1 ? "night" : "nights"}
          </span>
        </div>
      </div>

      {/* Vibe Selector */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Trip Vibe
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {VIBES.map((v) => {
            const selected = vibe === v.value;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setVibe(v.value)}
                className={`py-2 px-1 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  selected
                    ? "bg-accent text-white shadow-sm scale-[1.03]"
                    : "bg-[#F3F4F6] text-[#374151] hover:bg-accent-light hover:text-accent"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Origin City Selector */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          Flying From
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ORIGIN_CITIES.map((city) => {
            const selected = originCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setOriginCity(city)}
                className={`py-2 px-1 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  selected
                    ? "bg-accent text-white shadow-sm scale-[1.03]"
                    : "bg-[#F3F4F6] text-[#374151] hover:bg-accent-light hover:text-accent"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full text-lg py-4">
        {loading ? "Finding your trip…" : "Find my trip →"}
      </Button>
    </div>
  );
}
