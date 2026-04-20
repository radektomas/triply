import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { fetchTripSuggestions } from "@/lib/n8n";
import type { TripInput, APIDestination } from "@/lib/types";
import { ResultsHeader } from "@/components/results/ResultsHeader";
import { ResultsGrid } from "@/components/results/ResultsGrid";

type SearchParams = Promise<{
  budget?: string;
  month?: string;
  nights?: string;
  vibe?: string;
  originCity?: string;
}>;

async function getCachedSuggestions(input: TripInput): Promise<APIDestination[]> {
  "use cache";
  cacheLife("hours");
  const data = await fetchTripSuggestions(input);
  return data.destinations;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const budget = Number(params.budget) || 500;
  const month = params.month || "june";
  const nights = Number(params.nights) || 4;
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  const vibe = params.vibe;
  const originCity = params.originCity;

  const vibeLabel = vibe ? ` · ${vibe}` : "";
  const originLabel = originCity ? ` from ${originCity}` : "";

  return {
    title: `3 trips for €${budget} · ${nights} nights in ${monthLabel}${vibeLabel}${originLabel} — AI Trip Planner`,
    description: `Discover 3 personalised trip options for €${budget} total, ${nights} nights in ${monthLabel}. Budget breakdowns included.`,
  };
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const budget = Math.max(100, Math.min(1000, Number(params.budget) || 500));
  const month = params.month || "june";
  const nights = Math.max(1, Math.min(7, Number(params.nights) || 4));
  const vibe = params.vibe || "beach";
  const originCity = params.originCity || "Prague";

  const results = await getCachedSuggestions({ budget, month, nights, vibe, originCity });

  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <ResultsHeader budget={budget} month={month} nights={nights} />
        <ResultsGrid
          results={results}
          month={month}
          nights={nights}
          budget={budget}
          vibe={vibe}
          originCity={originCity}
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
