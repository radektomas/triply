"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MustDoList } from "./MustDoList";
import type { MustDoItem } from "@/lib/types/trip";

function MapSkeleton() {
  return (
    <div
      className="w-full h-full animate-pulse"
      style={{ backgroundColor: "#F0EFED" }}
      aria-hidden="true"
    >
      {/* Subtle grid hint */}
      <div
        className="w-full h-full"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,115,119,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,115,119,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

const MustDoMap = dynamic(() => import("./MustDoMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface Props {
  items: MustDoItem[];
  destination: string;
}

export function MustDo({ items, destination }: Props) {
  const [activeRank, setActiveRank] = useState<number | null>(null);
  const [flyToRank, setFlyToRank] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  const hasMap = items.some((i) => i.location?.lat && i.location?.lng);

  const handleListHover = (rank: number | null) => setActiveRank(rank);
  const handleListSelect = (rank: number) => {
    setActiveRank(rank);
    setFlyToRank(rank);
  };
  const handlePinClick = (rank: number) => setActiveRank(rank);

  return (
    <section aria-label="Top 5 must-do">
      {/* Section header */}
      <div className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-1.5">
          Curated · 5 Must-Do
        </p>
        <div className="h-0.5 w-10 bg-[#FF6B47] mb-3" />
        <h2
          className="font-semibold text-[#1A1A1A] leading-tight mb-1"
          style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
        >
          Don&apos;t miss
        </h2>
        <p className="text-[15px]" style={{ color: "rgba(13,115,119,0.65)" }}>
          The essentials for {destination}
        </p>
      </div>

      {/* White card container */}
      <div
        className="bg-white rounded-3xl overflow-hidden"
        style={{
          border: "1px solid rgba(13,115,119,0.06)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(13,115,119,0.10)",
        }}
      >
        {hasMap ? (
          /* Side-by-side layout when map data is available */
          <div className="flex flex-col lg:flex-row lg:h-[560px]">
            <div
              className="h-[320px] lg:h-full relative overflow-hidden"
              style={{ flex: "0 0 60%" }}
            >
              <MustDoMap
                items={items}
                activeRank={activeRank}
                flyToRank={flyToRank}
                onPinClick={handlePinClick}
              />
            </div>
            <div
              className="lg:overflow-y-auto border-t border-[rgba(13,115,119,0.06)] lg:border-t-0 lg:border-l"
              style={{ flex: "0 0 40%" }}
            >
              <MustDoList
                items={items}
                activeRank={activeRank}
                onHover={handleListHover}
                onSelect={handleListSelect}
              />
            </div>
          </div>
        ) : (
          /* List-only layout when no coords available */
          <MustDoList
            items={items}
            activeRank={activeRank}
            onHover={handleListHover}
            onSelect={handleListSelect}
          />
        )}
      </div>
    </section>
  );
}
