import Image from "next/image";
import type { ItineraryDay, ItineraryActivity } from "@/lib/types/trip";
import { ActivityRow } from "./ActivityRow";

const FALLBACK_COLORS = ["#FF6B47", "#0D7377", "#F4A261"] as const;

const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
type Slot = (typeof TIME_SLOTS)[number];

const SLOT_ICONS: Record<Slot, string> = {
  morning: "☀️",
  afternoon: "🌤️",
  evening: "🌆",
};
const SLOT_LABELS: Record<Slot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};
const FREE_TIME: Record<Slot, string> = {
  morning: "Free morning — take it slow",
  afternoon: "Free time — explore at your pace",
  evening: "Free evening — find a good spot",
};

function calcTotal(activities: ItineraryActivity[]): string {
  if (activities.length === 0) return "—";
  const withCost = activities.filter((a) => a.cost !== undefined);
  if (withCost.length === 0) return "—";
  const sum = withCost.reduce((s, a) => s + (a.cost ?? 0), 0);
  if (sum === 0) return "Free";
  if (withCost.length < activities.length) return `from €${sum}`;
  return `~€${sum}`;
}

interface Props {
  day: ItineraryDay;
  dayIndex: number;
}

export function DayCard({ day, dayIndex }: Props) {
  const fallbackColor = FALLBACK_COLORS[dayIndex % FALLBACK_COLORS.length];
  const total = calcTotal(day.activities);

  const grouped: Record<Slot, ItineraryActivity[]> = {
    morning: day.activities.filter((a) => a.timeOfDay === "morning"),
    afternoon: day.activities.filter((a) => a.timeOfDay === "afternoon"),
    evening: day.activities.filter((a) => a.timeOfDay === "evening"),
  };

  return (
    <article
      aria-label={`Day ${day.day}: ${day.title}`}
      className="rounded-3xl overflow-hidden flex flex-col h-full bg-white"
      style={{
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(13,115,119,0.12)",
        minHeight: "400px",
      }}
    >
      {/* Photo header */}
      <div className="relative h-[140px] sm:h-[160px] flex-shrink-0">
        {day.photo ? (
          <Image
            src={day.photo.urlLarge}
            alt={day.photo.alt || `Day ${day.day}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 300px, 280px"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: fallbackColor }} />
        )}

        {/* Gradient overlay for label legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 45%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        {/* Corner pill — day number + cost */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className="text-[11px] font-medium tracking-wide text-[#0D7377] px-3 py-1 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255,247,237,0.92)" }}
          >
            Day {day.day} · {total}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-6 py-6 flex-1 flex flex-col">
        {/* Day title — Playfair italic */}
        <h2
          className="font-serif italic font-semibold text-[#1A1A1A] line-clamp-2 mb-4"
          style={{ fontSize: "clamp(1.375rem, 3.5vw, 1.625rem)", lineHeight: 1.15 }}
        >
          {day.title}
        </h2>

        {/* Coral rule */}
        <div className="h-0.5 w-10 bg-[#FF6B47] mb-5 flex-shrink-0" />

        {/* Time slots */}
        <div className="flex-1 space-y-4">
          {TIME_SLOTS.map((slot) => {
            const acts = grouped[slot];
            return (
              <div key={slot}>
                {/* Slot label */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm leading-none" aria-hidden="true">
                    {SLOT_ICONS[slot]}
                  </span>
                  <h3
                    className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#0D7377]"
                    style={{ opacity: 0.65 }}
                  >
                    {SLOT_LABELS[slot]}
                  </h3>
                </div>

                {acts.length > 0 ? (
                  <ul aria-label={`${SLOT_LABELS[slot]} activities`}>
                    {acts.map((act, i) => (
                      <ActivityRow key={i} activity={act} />
                    ))}
                  </ul>
                ) : (
                  <p
                    className="font-serif italic text-sm px-1 leading-snug"
                    style={{ color: "rgba(13,115,119,0.45)" }}
                  >
                    {FREE_TIME[slot]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
