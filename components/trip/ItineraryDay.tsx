import type { ItineraryDay as ItineraryDayType } from "@/lib/types";

interface Props {
  day: ItineraryDayType;
  isLast: boolean;
}

export function ItineraryDay({ day, isLast }: Props) {
  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shrink-0 relative z-10">
          {day.day}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
        <div className="flex justify-between items-baseline mb-2 gap-2">
          <h3 className="font-semibold text-[#1A1A1A]">{day.title}</h3>
          <span className="text-xs text-muted shrink-0">~€{day.estimatedCost}</span>
        </div>
        <ul className="space-y-1.5">
          {day.activities.map((activity, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted">
              <span className="text-accent shrink-0 mt-px font-bold">·</span>
              {activity}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
