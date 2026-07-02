import { ResultsHeader } from "@/components/results/ResultsHeader";
import { DestinationCard } from "@/components/results/DestinationCard";
import { OverBudgetBanner } from "@/components/results/OverBudgetBanner";
import { AnimatedCard } from "@/components/results/AnimatedCard";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { GenerateMore } from "@/components/trip/GenerateMore";
import { computeNights, formatRange } from "@/lib/dates";
import {
  computeReconciledTotal,
  computeBudgetFit,
  computeCostBasis,
} from "@/lib/budget";
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

  // "All over budget" — true only when EVERY destination is classified "over"
  // by the SAME verdict logic the card badges use (computeReconciledTotal +
  // computeBudgetFit). If any is fit/under (or unclassifiable → not "over"),
  // the banner stays hidden and the user just sees the honestly-labeled cards.
  const verdicts = destinations.map((d) =>
    computeBudgetFit(computeReconciledTotal(d.estimates, nights)?.total, budget),
  );
  const allOverBudget =
    destinations.length > 0 && verdicts.every((v) => v === "over");

  // When all over, estimate the nights that WOULD fit, using the cheapest
  // destination's cost basis (most favorable) via the shared fixed/per-night
  // split — same field basis as the totals, so the number is consistent.
  let fitNights: number | null = null;
  let flightsAloneExceed = false;
  if (allOverBudget) {
    const cheapest = destinations
      .map((d) => ({
        est: d.estimates,
        total: computeReconciledTotal(d.estimates, nights)?.total ?? Infinity,
      }))
      .sort((a, b) => a.total - b.total)[0];
    const basis =
      cheapest && cheapest.total !== Infinity
        ? computeCostBasis(cheapest.est)
        : null;
    if (basis && basis.perNight > 0) {
      if (basis.fixed >= budget) {
        flightsAloneExceed = true;
      } else {
        // Honest lower bound (floor): the largest whole night count that fits.
        fitNights = Math.floor((budget - basis.fixed) / basis.perNight);
      }
    }
  }

  return (
    <main className="flex-1 relative overflow-hidden">
      <GradientMesh variant="absolute-tall" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <ResultsHeader budget={budget} dateRange={dateRange} nights={nights} />
        {allOverBudget && (
          <OverBudgetBanner
            budget={budget}
            nights={nights}
            fitNights={fitNights}
            flightsAloneExceed={flightsAloneExceed}
            editHref="/"
          />
        )}
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
