"use client";

import { useRef, useEffect } from "react";
import type { MustDoItem, MustDoCategory } from "@/lib/types/trip";

const CATEGORY_EMOJI: Record<MustDoCategory, string> = {
  landmark: "🏛️",
  restaurant: "🍽️",
  museum: "🎨",
  park: "🌳",
  shopping: "🛍️",
  nightlife: "🌃",
  beach: "🏖️",
  cafe: "☕",
  viewpoint: "🌄",
  activity: "⭐",
};

interface Props {
  items: MustDoItem[];
  activeRank: number | null;
  onHover: (rank: number | null) => void;
  onSelect: (rank: number) => void;
}

export function MustDoList({ items, activeRank, onHover, onSelect }: Props) {
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // When pin is clicked on map, scroll the matching list item into view
  useEffect(() => {
    if (activeRank === null) return;
    const idx = items.findIndex((i) => i.rank === activeRank);
    itemRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeRank, items]);

  return (
    <div className="p-4 space-y-2">
      {items.map((item, idx) => {
        const isActive = item.rank === activeRank;
        return (
          <button
            key={item.rank}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            aria-label={`Must-do ${item.rank}: ${item.title}`}
            aria-pressed={isActive}
            className={`
              w-full text-left p-4 rounded-2xl outline-none
              transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-[#FF6B4A]/40
              ${
                isActive
                  ? "bg-[rgba(255,107,74,0.04)]"
                  : "hover:bg-[rgba(13,115,119,0.02)]"
              }
            `}
            style={{
              borderLeft: isActive ? "3px solid #FF6B4A" : "3px solid transparent",
            }}
            onMouseEnter={() => onHover(item.rank)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(item.rank)}
          >
            <div className="flex items-start gap-3">
              {/* Rank pill */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,247,237,1)" }}
                aria-hidden="true"
              >
                <span
                  className="font-semibold leading-none"
                  style={{ color: "#FF6B4A", fontSize: 16 }}
                >
                  {item.rank}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-semibold text-[#1A1A1A] leading-snug"
                    style={{ fontSize: 15 }}
                  >
                    {item.title}
                  </h3>
                  <span className="flex-shrink-0 text-[18px]" aria-hidden="true">
                    {CATEGORY_EMOJI[item.category]}
                  </span>
                </div>

                {/* Coral rule */}
                <div
                  className="h-px w-6 mt-1.5 mb-2"
                  style={{ backgroundColor: "rgba(255,107,74,0.60)" }}
                />

                {/* Description */}
                <p
                  className="leading-[1.5]"
                  style={{ fontSize: 13, color: "#555" }}
                >
                  {item.description}
                </p>

                {/* Meta row */}
                {(item.estimatedCost || item.estimatedTime) && (
                  <div className="flex items-center gap-1.5 mt-2">
                    {item.estimatedCost && (
                      <span style={{ fontSize: 12, color: "rgba(13,115,119,0.65)" }}>
                        {item.estimatedCost}
                      </span>
                    )}
                    {item.estimatedCost && item.estimatedTime && (
                      <span style={{ fontSize: 12, color: "rgba(13,115,119,0.35)" }}>·</span>
                    )}
                    {item.estimatedTime && (
                      <span style={{ fontSize: 12, color: "rgba(13,115,119,0.65)" }}>
                        {item.estimatedTime}
                      </span>
                    )}
                  </div>
                )}

                {/* Insider tip */}
                {item.tip && (
                  <div
                    className="flex items-start gap-2 mt-2.5 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(13,115,119,0.04)" }}
                  >
                    <span className="flex-shrink-0 text-sm" aria-hidden="true">
                      💡
                    </span>
                    <p style={{ fontSize: 12, color: "#0D7377", lineHeight: 1.45 }}>
                      {item.tip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
