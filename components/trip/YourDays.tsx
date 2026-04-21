"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DayCard } from "./DayCard";
import type { ItineraryDay } from "@/lib/types/trip";

interface Props {
  days: ItineraryDay[];
  nights: number;
  destination: string;
  month: string;
}

export function YourDays({ days, nights, destination, month }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const shouldReduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (days.length > 1) {
      try {
        const seen = sessionStorage.getItem("triply-itinerary-scrolled");
        if (!seen) setShowHint(true);
      } catch {
        // sessionStorage unavailable in some contexts
      }
    }
  }, [days.length]);

  const handleScroll = () => {
    if (!hasScrolled) {
      setHasScrolled(true);
      setShowHint(false);
      try {
        sessionStorage.setItem("triply-itinerary-scrolled", "1");
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        el.scrollBy({ left: 308, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        el.scrollBy({ left: -308, behavior: "smooth" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (days.length === 0) {
    return (
      <section aria-label="Itinerary">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Your Days</h2>
        <div className="bg-white rounded-2xl border border-border shadow-sm p-10 text-center">
          <p className="text-4xl mb-4" aria-hidden="true">🗺️</p>
          <p className="font-semibold text-[#FF6B47] text-lg mb-2">No itinerary yet</p>
          <p className="text-sm text-muted">
            Our AI is still planning your days. Check back soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Itinerary">
      {/* Section header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Your Days</h2>
          <p className="text-sm font-medium text-[#0D7377]/55 tracking-wide mt-0.5">
            {nights} night{nights !== 1 ? "s" : ""} in {destination} · {month}
          </p>
        </div>

        {showHint && !shouldReduce && (
          <motion.span
            className="text-xs text-[#0D7377]/50 md:hidden mb-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.15, 0.5, 0.15, 0.5, 0.4] }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
          >
            scroll →
          </motion.span>
        )}
      </div>

      {/* White card wrapper — no overflow-hidden so carousel can clip itself */}
      <div className="bg-white rounded-2xl border border-border shadow-sm">
        {/* Carousel (mobile) / grid (desktop) */}
        <div
          ref={containerRef}
          role="region"
          aria-label={`${days.length} days — scroll horizontally to see all`}
          onScroll={handleScroll}
          className="
            flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            p-5
            md:grid md:overflow-x-visible md:p-6
          "
          style={{
            scrollSnapType: shouldReduce ? "none" : "x mandatory",
            scrollPaddingLeft: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {days.map((day, idx) => (
            <div
              key={day.day}
              className="flex-shrink-0 w-[292px] md:w-auto"
              style={{ scrollSnapAlign: shouldReduce ? undefined : "start" }}
            >
              <DayCard day={day} dayIndex={idx} />
            </div>
          ))}
          {/* End-of-scroll padding sentinel (mobile only) */}
          <div className="flex-shrink-0 w-1 md:hidden" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
