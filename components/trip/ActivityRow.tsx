"use client";

import { useState } from "react";
import type { ItineraryActivity } from "@/lib/types/trip";

export function ActivityRow({ activity }: { activity: ItineraryActivity }) {
  const [flashing, setFlashing] = useState(false);

  const hasMaps = !!(activity.location?.lat && activity.location?.lng);
  const mapsUrl = hasMaps
    ? `https://www.google.com/maps/search/?api=1&query=${activity.location!.lat},${activity.location!.lng}`
    : null;

  const handleClick = () => {
    if (!hasMaps) return;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 150);
    window.open(mapsUrl!, "_blank", "noopener,noreferrer");
  };

  const costLabel =
    activity.cost === undefined
      ? null
      : activity.cost === 0
      ? "Free"
      : `€${activity.cost}`;

  return (
    <li
      onClick={hasMaps ? handleClick : undefined}
      className={`py-1.5 px-1 rounded-lg transition-colors duration-150 ${
        hasMaps ? "cursor-pointer" : ""
      }`}
      style={{
        backgroundColor: flashing ? "rgba(255,107,71,0.06)" : "transparent",
        transition: "background-color 150ms",
      }}
    >
      {/* Activity title — Playfair regular, no emoji */}
      <p
        className={`font-serif text-[15px] sm:text-[16px] text-[#2A2A2A] leading-snug line-clamp-2 ${
          hasMaps
            ? "md:hover:underline decoration-[#FF6B47]/40 decoration-2 underline-offset-4"
            : ""
        }`}
      >
        {activity.title}
        {/* ↗ visible only on mobile for tappable activities */}
        {hasMaps && (
          <span
            className="inline md:hidden text-[11px] ml-1 align-baseline"
            style={{ color: "rgba(13,115,119,0.5)" }}
            aria-hidden="true"
          >
            ↗
          </span>
        )}
      </p>

      {/* Duration + cost */}
      {(activity.duration || costLabel) && (
        <div className="flex items-center gap-1 mt-0.5">
          {activity.duration && (
            <span className="text-xs text-[#0D7377]">{activity.duration}</span>
          )}
          {activity.duration && costLabel && (
            <span className="text-xs text-[#0D7377]/40">·</span>
          )}
          {costLabel && (
            <span
              className={`text-xs font-medium ${
                costLabel === "Free" ? "text-[#0D7377]" : "text-[#FF6B47]"
              }`}
            >
              {costLabel}
            </span>
          )}
        </div>
      )}
    </li>
  );
}
