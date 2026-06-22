import { ResultsHeader } from "@/components/results/ResultsHeader";
import { DestinationCard } from "@/components/results/DestinationCard";
import { AnimatedCard } from "@/components/results/AnimatedCard";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { GenerateMore } from "@/components/trip/GenerateMore";
import { computeNights, formatRange } from "@/lib/dates";
import type { TripRecord } from "@/lib/data/getTripById";
import type { GenerationLimitStatus } from "@/lib/generationLimits";

interface Props {
  trip: TripRecord;
  limitStatus: GenerationLimitStatus;
}

export function DestinationSelector({ trip, limitStatus }: Props) {
  const { input, result } = trip;
  const { budget, checkIn, checkOut, vibe, originCity, travelers } = input;
  const destinations = result?.destinations ?? [];
  const nights = computeNights(checkIn, checkOut);
  const dateRange = formatRange(checkIn, checkOut);

  return (
    <main className="flex-1 relative overflow-hidden">
      <GradientMesh variant="absolute-tall" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <ResultsHeader budget={budget} dateRange={dateRange} nights={nights} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {destinations.map((destination, index) => (
            <AnimatedCard key={destination.id} index={index}>
              <DestinationCard
                destination={destination}
                checkIn={checkIn}
                checkOut={checkOut}
                budget={budget}
                vibe={vibe}
                originCity={originCity}
                tripId={trip.id}
                href={`/trip/${trip.id}?d=${destination.id}`}
              />
            </AnimatedCard>
          ))}
        </div>

        <GenerateMore
          tripParams={{
            budget,
            travelers,
            vibe,
            originCity,
            checkIn,
            checkOut,
          }}
          limitStatus={limitStatus}
          shownDestinations={destinations.map((d) => d.name)}
        />

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
