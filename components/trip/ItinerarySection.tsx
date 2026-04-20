import { ItineraryDay } from "@/components/trip/ItineraryDay";
import type { ItineraryDay as ItineraryDayType } from "@/lib/types";

interface Props {
  days: ItineraryDayType[];
  nights: number;
}

export function ItinerarySection({ days, nights }: Props) {
  const visibleDays = days.slice(0, nights);

  return (
    <section>
      <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">
        {nights}-{nights === 1 ? "Night" : "Night"} Itinerary
      </h2>
      <div>
        {visibleDays.map((day, index) => (
          <ItineraryDay
            key={day.day}
            day={day}
            isLast={index === visibleDays.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
