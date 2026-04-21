import { ResultsHeader } from "@/components/results/ResultsHeader";
import { DestinationCard } from "@/components/results/DestinationCard";
import { AnimatedCard } from "@/components/results/AnimatedCard";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { computeNights, formatRange } from "@/lib/dates";
import type { TripRecord } from "@/lib/data/getTripById";

interface Props {
  trip: TripRecord;
}

export function DestinationSelector({ trip }: Props) {
  const { input, result } = trip;
  const { budget, checkIn, checkOut, vibe, originCity } = input;
  const { destinations } = result;
  const nights = computeNights(checkIn, checkOut);
  const dateRange = formatRange(checkIn, checkOut);

  return (
    <main className="flex-1 relative overflow-hidden">
      <GradientMesh variant="absolute-tall" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <ResultsHeader budget={budget} dateRange={dateRange} nights={nights} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {destinations.map((destination, index) => (
            <AnimatedCard key={destination.id} index={index}>
              <DestinationCard
                destination={destination}
                checkIn={checkIn}
                checkOut={checkOut}
                budget={budget}
                vibe={vibe}
                originCity={originCity}
                href={`/trip/${trip.id}?d=${destination.id}`}
              />
            </AnimatedCard>
          ))}
        </div>
        <div className="mt-10 text-center">
          <a
            href="/"
            className="text-sm text-muted hover:text-accent transition-colors"
          >
            ← Change search
          </a>
        </div>
      </div>
    </main>
  );
}
