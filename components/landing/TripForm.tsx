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

const pillBase =
  "w-full py-3 px-4 rounded-xl text-base font-medium transition-all duration-150 cursor-pointer text-center";
const pillSelected = "bg-accent text-white shadow-md scale-[1.03]";
const pillIdle = "bg-gray-100 text-[#374151] hover:bg-gray-200";

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
    <div
      className="bg-card rounded-3xl border border-accent/10 p-8 sm:p-10 md:p-14 w-full"
      style={{
        boxShadow:
          "0 25px 60px rgba(255, 107, 71, 0.08), 0 4px 20px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Budget Slider */}
      <div className="mb-10">
        <div className="flex justify-between items-start mb-1">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted">
              Total Budget
            </label>
            <p className="text-xs text-muted/70 mt-0.5">All-in, per person</p>
          </div>
          <span className="text-2xl font-bold text-accent">€{budget}</span>
        </div>
        <div className="mt-3">
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
      </div>

      {/* Month Picker */}
      <div className="mb-10">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
          Travel Month
        </label>
        <p className="text-xs text-muted/70 mb-4">When do you want to go?</p>
        <div className="month-grid">
          {MONTHS.map((m) => {
            const value = m.toLowerCase();
            const selected = month === value;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(value)}
                className={`${pillBase} ${selected ? pillSelected : pillIdle}`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nights Stepper */}
      <div className="mb-10">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
          Number of Nights
        </label>
        <p className="text-xs text-muted/70 mb-4">How long&apos;s the escape?</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setNights((n) => Math.max(1, n - 1))}
            disabled={nights === 1}
            aria-label="Decrease nights"
            className="w-11 h-11 rounded-xl bg-gray-100 text-[#374151] text-xl font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
            className="w-11 h-11 rounded-xl bg-gray-100 text-[#374151] text-xl font-bold hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            +
          </button>
          <span className="text-muted font-medium">
            {nights === 1 ? "night" : "nights"}
          </span>
        </div>
      </div>

      {/* Vibe Selector */}
      <div className="mb-10">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
          Trip Vibe
        </label>
        <p className="text-xs text-muted/70 mb-4">What are you into?</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {VIBES.map((v) => {
            const selected = vibe === v.value;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setVibe(v.value)}
                className={`${pillBase} ${selected ? pillSelected : pillIdle}`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Origin City Selector */}
      <div className="mb-10">
        <label className="block text-xs font-semibold uppercase tracking-widest text-muted mb-0.5">
          Flying From
        </label>
        <p className="text-xs text-muted/70 mb-4">Pick your home airport</p>
        <div className="grid grid-cols-4 gap-2">
          {ORIGIN_CITIES.map((city) => {
            const selected = originCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setOriginCity(city)}
                className={`${pillBase} ${selected ? pillSelected : pillIdle}`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full sm:w-auto sm:min-w-[220px] sm:mx-auto sm:flex text-xl py-5"
      >
        {loading ? "Finding your trip…" : "Find my trip →"}
      </Button>
    </div>
  );
}
