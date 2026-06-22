import { FadeIn } from "@/components/ui/FadeIn";
import { TripHero } from "./TripHero";
import { BudgetBreakdown } from "./BudgetBreakdown";
import { TopPlaces } from "./TopPlaces";
import { TipsList } from "./TipsList";
import { BookingHub } from "./BookingHub";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { getPlacePhoto } from "@/lib/photos";
import type { TripDetail } from "@/lib/types/trip";
import type { APIDestination, TripInput } from "@/lib/types";

interface Props {
  detail: TripDetail;
  tips: string[];
  confidence?: "high" | "medium" | "low";
  disclaimer?: string;
  returnUrl: string;
  returnLabel?: string;
  destination?: APIDestination;
  tripId?: string;
  tripInput?: TripInput;
}

export async function TripDetailView({
  detail,
  tips,
  confidence,
  disclaimer,
  returnUrl,
  returnLabel,
  destination,
  tripId,
  tripInput,
}: Props) {
  // Enrich each top place with a Pexels photo, server-side, in parallel —
  // hits the same Supabase photo_cache the hero carousel uses.
  const topPlacesWithPhotos = detail.topPlaces
    ? await Promise.all(
        detail.topPlaces.map(async (place) => ({
          ...place,
          photo: await getPlacePhoto(place.name, detail.destination),
        })),
      )
    : [];

  return (
    <>
    {/* `absolute-tall` (not `fixed`): the mesh scrolls WITH the page instead of
        compositing under it during scroll. `relative` on <main> scopes the
        mesh's `absolute inset-0` to the full page height; the mesh wrapper
        clips its own blobs, so no overflow-hidden is needed here (which would
        break any sticky descendants). */}
    <main className="flex-1 pb-16 relative">
      <GradientMesh variant="absolute-tall" />
      <FadeIn>
        <TripHero
          trip={detail}
          returnUrl={returnUrl}
          returnLabel={returnLabel}
          destination={destination}
          tripId={tripId}
          tripInput={tripInput}
        />
      </FadeIn>

      <FadeIn delay={0.18} className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Budget Breakdown</h2>
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-10 shadow-sm">
            <BudgetBreakdown
              total={detail.budget.total}
              range={detail.budget.range}
              breakdown={detail.budget.breakdown}
              travelers={detail.budget.travelers}
            />
          </div>
        </section>
      </FadeIn>

      {topPlacesWithPhotos.length > 0 && (
        <FadeIn delay={0.26} className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">
          <TopPlaces
            topPlaces={topPlacesWithPhotos}
            destinationName={detail.destination}
          />
        </FadeIn>
      )}

      <FadeIn delay={0.34} className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 space-y-12">
        <TipsList tips={tips} />

        {(confidence === "low" || confidence === "medium") && (
          <div className="text-sm text-muted pt-2 border-t border-border">
            {confidence === "low" && (
              <p className="mb-1 font-medium text-[#374151]">
                ⓘ Low confidence — AI had limited data for this destination. Verify details independently.
              </p>
            )}
            {disclaimer && <p className="italic">{disclaimer}</p>}
          </div>
        )}
      </FadeIn>

      <FadeIn delay={0.42}>
        <BookingHub detail={detail} />
      </FadeIn>
    </main>
    </>
  );
}
