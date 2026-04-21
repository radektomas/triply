import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { fetchTripSuggestions, getCachedTripByInput } from "@/lib/n8n";
import type { TripInput } from "@/lib/types";
import { getTripDetail } from "@/lib/data/getTripDetail";
import { TripHero } from "@/components/trip/TripHero";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { ItinerarySection } from "@/components/trip/ItinerarySection";
import { TipsList } from "@/components/trip/TipsList";
import { TrustedSources } from "@/components/trip/TrustedSources";
import { FadeIn } from "@/components/ui/FadeIn";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  budget?: string;
  month?: string;
  nights?: string;
  vibe?: string;
  originCity?: string;
}>;

async function getDetailDestination(input: TripInput, id: string) {
  "use cache";
  cacheLife("hours");

  // Read from Supabase cache first — same entry the results page populated
  const cached = await getCachedTripByInput(input);
  if (cached) {
    const dest = cached.destinations.find((d) => d.id === id);
    if (dest) return dest;
  }

  // Cache miss (shared URL, expired cache) — fresh AI call as fallback
  const fresh = await fetchTripSuggestions(input);
  return fresh.destinations.find((d) => d.id === id) ?? null;
}

function readableNameFromId(id: string): string {
  return id
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const name = readableNameFromId(id);

  return {
    title: `${name} — AI Trip Planner`,
    description: `Plan your trip to ${name} with AI-powered itinerary and budget breakdown.`,
    openGraph: {
      title: name,
      description: `AI-generated trip plan for ${name}`,
      type: "website",
    },
  };
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const budget = Math.max(100, Math.min(1000, Number(sp.budget) || 500));
  const month = sp.month || "june";
  const nights = Math.max(1, Math.min(7, Number(sp.nights) || 4));
  const vibe = sp.vibe || "beach";
  const originCity = sp.originCity || "Prague";

  const input: TripInput = { budget, month, nights, vibe, originCity };

  // DEBUG: console.log("[TripPage] id:", id, "input:", JSON.stringify(input));

  const [destination, trip] = await Promise.all([
    getDetailDestination(input, id),
    getTripDetail(id, input),
  ]);

  // DEBUG: console.log("[TripPage] destination:", destination ? "OK" : "NULL");
  // DEBUG: console.log("[TripPage] trip:", trip ? "OK" : "NULL");
  // DEBUG: console.log("[TripPage] trip.id:", trip?.id);
  // DEBUG: console.log("[TripPage] trip.destination:", trip?.destination);
  // DEBUG: console.log("[TripPage] USE_MOCK_TRIP env:", process.env.NEXT_PUBLIC_USE_MOCK_TRIP);

  if (!trip) notFound();

  const returnUrl = `/results?budget=${budget}&month=${month}&nights=${nights}&vibe=${vibe}&originCity=${encodeURIComponent(originCity)}`;

  return (
    <main className="flex-1">
      <FadeIn>
        <TripHero
          trip={trip}
          returnUrl={returnUrl}
        />
      </FadeIn>

      <FadeIn delay={0.18} className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <section>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">
            Budget Breakdown
          </h2>
          <div className="bg-white rounded-2xl border border-border p-6 sm:p-10 shadow-sm">
            <BudgetBreakdown
              total={trip.budget.total}
              range={trip.budget.range}
              breakdown={trip.budget.breakdown}
            />
          </div>
        </section>

        {destination && (
          <>
            <ItinerarySection days={destination.itinerary} nights={nights} />
            <TipsList tips={destination.tips} />
            <TrustedSources sources={destination.trustedSources} />

            {(destination.confidence === "low" || destination.confidence === "medium") && (
              <div className="text-sm text-muted pt-2 border-t border-border">
                {destination.confidence === "low" && (
                  <p className="mb-1 font-medium text-[#374151]">
                    ⓘ Low confidence — AI had limited data for this destination. Verify details independently.
                  </p>
                )}
                <p className="italic">{destination.disclaimer}</p>
              </div>
            )}
          </>
        )}
      </FadeIn>
    </main>
  );
}
