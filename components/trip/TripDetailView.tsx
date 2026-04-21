import { FadeIn } from "@/components/ui/FadeIn";
import { TripHero } from "./TripHero";
import { BudgetBreakdown } from "./BudgetBreakdown";
import { MustDo } from "./MustDo";
import { TipsList } from "./TipsList";
import { TrustedSources } from "./TrustedSources";
import type { TripDetail } from "@/lib/types/trip";
import type { APIDestination } from "@/lib/types";

interface Props {
  detail: TripDetail;
  dest: APIDestination;
  tripId: string;
}

export function TripDetailView({ detail, dest, tripId }: Props) {
  const returnUrl = `/trip/${tripId}`;

  return (
    <main className="flex-1 pb-16">
      <FadeIn>
        <TripHero trip={detail} returnUrl={returnUrl} />
      </FadeIn>

      <FadeIn delay={0.18} className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Budget Breakdown</h2>
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-10 shadow-sm">
            <BudgetBreakdown
              total={detail.budget.total}
              range={detail.budget.range}
              breakdown={detail.budget.breakdown}
            />
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.26} className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        <MustDo items={detail.mustDo} destination={detail.destination} />
      </FadeIn>

      <FadeIn delay={0.34} className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
        <TipsList tips={dest.tips} />
        <TrustedSources sources={dest.trustedSources} />

        {(dest.confidence === "low" || dest.confidence === "medium") && (
          <div className="text-sm text-muted pt-2 border-t border-border">
            {dest.confidence === "low" && (
              <p className="mb-1 font-medium text-[#374151]">
                ⓘ Low confidence — AI had limited data for this destination. Verify details independently.
              </p>
            )}
            <p className="italic">{dest.disclaimer}</p>
          </div>
        )}
      </FadeIn>
    </main>
  );
}
