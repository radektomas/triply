import type { ItineraryDay, ItineraryActivity } from "@/lib/types/trip";
import { ActivityRow } from "./ActivityRow";

const HEADER_COLORS = ["#FF6B47", "#0D7377", "#F4A261"] as const;

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
const FREE_TIME: Record<Slot, { emoji: string; text: string }> = {
  morning: { emoji: "☕", text: "Free morning — take it slow" },
  afternoon: { emoji: "🌤️", text: "Free time — explore on your own" },
  evening: { emoji: "🌙", text: "Free evening — find a good spot" },
};

function calcTotal(activities: ItineraryActivity[]): string {
  if (activities.length === 0) return "—";
  const withCost = activities.filter((a) => a.cost !== undefined);
  if (withCost.length === 0) return "—";
  const sum = withCost.reduce((s, a) => s + (a.cost ?? 0), 0);
  if (sum === 0) return "Free day";
  if (withCost.length < activities.length) return `from €${sum}`;
  return `~€${sum}`;
}

interface Props {
  day: ItineraryDay;
  dayIndex: number;
}

export function DayCard({ day, dayIndex }: Props) {
  const color = HEADER_COLORS[dayIndex % HEADER_COLORS.length];
  const total = calcTotal(day.activities);

  const grouped: Record<Slot, ItineraryActivity[]> = {
    morning: day.activities.filter((a) => a.timeOfDay === "morning"),
    afternoon: day.activities.filter((a) => a.timeOfDay === "afternoon"),
    evening: day.activities.filter((a) => a.timeOfDay === "evening"),
  };

  return (
    <section
      aria-label={`Day ${day.day}: ${day.title}`}
      className="rounded-3xl overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: "#FFF7ED",
        border: "1px solid rgba(13,115,119,0.08)",
        boxShadow: "0 4px 20px rgba(13,115,119,0.08)",
        minHeight: "400px",
      }}
    >
      {/* Header strip */}
      <div
        className="px-5 py-4 relative flex-shrink-0"
        style={{ backgroundColor: color, minHeight: 72 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-widest text-white/70 uppercase">
              Day {day.day}
            </span>
            <span className="text-base font-bold text-white">{total}</span>
          </div>
          <p className="text-white/90 text-lg font-semibold italic mt-0.5 leading-snug">
            {day.title}
          </p>
        </div>
      </div>

      {/* Time slots */}
      <div className="px-5 py-4 flex-1">
        {TIME_SLOTS.map((slot, slotIdx) => {
          const acts = grouped[slot];
          return (
            <div key={slot} className={slotIdx > 0 ? "mt-5" : undefined}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm leading-none" aria-hidden="true">
                  {SLOT_ICONS[slot]}
                </span>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#0D7377]">
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
                <div className="flex gap-3 py-2.5 px-2">
                  <span
                    className="text-xl flex-shrink-0 mt-0.5 w-6 text-center leading-none opacity-35"
                    aria-hidden="true"
                  >
                    {FREE_TIME[slot].emoji}
                  </span>
                  <p className="text-sm text-muted italic">{FREE_TIME[slot].text}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
