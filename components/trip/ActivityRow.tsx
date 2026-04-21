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
      className={`flex gap-3 py-2.5 px-2 rounded-xl transition-colors duration-150 ${
        hasMaps ? "cursor-pointer" : ""
      }`}
      style={{
        backgroundColor: flashing ? "rgba(255,107,71,0.06)" : "transparent",
        transition: "background-color 150ms",
      }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5 w-6 text-center leading-none" aria-hidden="true">
        {activity.emoji ?? "📍"}
      </span>
      <div className="min-w-0">
        <p
          className={`text-[15px] font-medium text-[#1A1A1A] leading-snug ${
            hasMaps ? "hover:underline decoration-[#0D7377]/40" : ""
          }`}
        >
          {activity.title}
        </p>
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
      </div>
    </li>
  );
}
