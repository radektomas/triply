import { DestinationCard } from "@/components/results/DestinationCard";
import { AnimatedCard } from "@/components/results/AnimatedCard";
import type { APIDestination } from "@/lib/types";

interface Props {
  results: APIDestination[];
  checkIn: string;
  checkOut: string;
  budget: number;
  vibe: string;
  originCity: string;
}

export function ResultsGrid({ results, checkIn, checkOut, budget, vibe, originCity }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted">
          No trips found. Try adjusting your budget or dates.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {results.map((destination, index) => (
        <AnimatedCard key={destination.id} index={index}>
          <DestinationCard
            destination={destination}
            checkIn={checkIn}
            checkOut={checkOut}
            budget={budget}
            vibe={vibe}
            originCity={originCity}
          />
        </AnimatedCard>
      ))}
    </div>
  );
}
