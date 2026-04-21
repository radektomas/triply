import { ResultsHeader } from "@/components/results/ResultsHeader";
import { DestinationCard } from "@/components/results/DestinationCard";
import { AnimatedCard } from "@/components/results/AnimatedCard";
import type { TripRecord } from "@/lib/data/getTripById";

interface Props {
  trip: TripRecord;
}

export function DestinationSelector({ trip }: Props) {
  const { input, result } = trip;
  const { budget, month, nights, vibe, originCity } = input;
  const { destinations } = result;

  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <ResultsHeader budget={budget} month={month} nights={nights} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {destinations.map((destination, index) => (
            <AnimatedCard key={destination.id} index={index}>
              <DestinationCard
                destination={destination}
                month={month}
                nights={nights}
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
