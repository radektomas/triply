import { DestinationCard } from "@/components/results/DestinationCard";
import { AnimatedCard } from "@/components/results/AnimatedCard";
import type { APIDestination } from "@/lib/types";

interface Props {
  results: APIDestination[];
  month: string;
  nights: number;
  budget: number;
  vibe: string;
  originCity: string;
}

export function ResultsGrid({ results, month, nights, budget, vibe, originCity }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted">
          No trips found. Try adjusting your budget or number of nights.
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
            month={month}
            nights={nights}
            budget={budget}
            vibe={vibe}
            originCity={originCity}
          />
        </AnimatedCard>
      ))}
    </div>
  );
}
