import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCityPhoto } from "@/lib/photos";
import { computeReconciledTotal, computeBudgetFit } from "@/lib/budget";
import { computeNights } from "@/lib/dates";
import { checkGenerationLimit } from "@/lib/generationLimits";
import { StatsBar } from "@/components/profile/StatsBar";
import { SavedDestinations } from "@/components/profile/SavedDestinations";
import { GenerationHistory } from "@/components/profile/GenerationHistory";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { OnboardingNudge, TravelerProfile } from "@/components/profile/TravelerProfile";
import { PickedForYou } from "@/components/profile/PickedForYou";
import { Watchlist, type WatchRow } from "@/components/profile/Watchlist";
import type { Pick } from "@/components/profile/PickCard";
import { getTravelerProfile } from "@/lib/data/getTravelerProfile";
import { buildFirstPicksInput } from "@/lib/traveler";
import { GradientMesh } from "@/components/landing/GradientMesh";
import type { APIDestination, TripInput } from "@/lib/types";

export const metadata: Metadata = {
  title: "Your dashboard",
  description: "Places picked for you, price alerts, and everything you've saved on Triply.",
};

interface SavedRow {
  id: string;
  user_id: string;
  destination: APIDestination & {
    __context?: {
      tripId?: string;
      checkIn: string;
      checkOut: string;
      budget: number;
      vibe: string;
      originCity: string;
    };
  };
  created_at: string;
}

interface HistoryRow {
  id: string;
  user_id: string;
  created_at: string;
  trip: {
    tripId?: string;
    input: TripInput;
    destinations: APIDestination[];
    searchSummary?: string | null;
  };
}

interface WatchDbRow {
  id: string;
  name: string;
  country: string;
  country_code: string;
  trip_id: string | null;
  destination_id: string | null;
  created_at: string;
}

/** How many picks the dashboard shows (newest generations first, deduped). */
const MAX_PICKS = 6;

type SearchParams = Promise<{ picks?: string }>;

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const { picks: highlightTripId } = await searchParams;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Sign-in lives in a global modal, not its own page — bouncing to the
    // home page is the closest thing to a login redirect we have.
    redirect("/?signin=1&next=%2Fprofile");
  }

  const [savedRes, historyRes, profileRes, watchesRes, traveler, limit] = await Promise.all([
    supabase
      .from("saved_destinations")
      .select("id, user_id, destination, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("generation_history")
      .select("id, user_id, trip, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("deal_watches")
      .select("id, name, country, country_code, trip_id, destination_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getTravelerProfile(supabase),
    checkGenerationLimit(supabase),
  ]);

  const savedRows = (savedRes.data ?? []) as SavedRow[];
  const historyRows = (historyRes.data ?? []) as HistoryRow[];
  if (watchesRes.error) {
    console.warn("[profile] deal_watches read failed:", watchesRes.error.message);
  }
  const watchRows = ((watchesRes.data ?? []) as WatchDbRow[]).map<WatchRow>((w) => ({
    id: w.id,
    name: w.name,
    country: w.country,
    countryCode: w.country_code,
    tripId: w.trip_id,
    destinationId: w.destination_id,
    createdAt: w.created_at,
  }));
  const watchIdByPlace = new Map<string, string>();
  for (const w of watchRows) {
    watchIdByPlace.set(`${w.name.toLowerCase()}|${w.country.toLowerCase()}`, w.id);
  }

  // Backfill index: for older saves that lack __context.tripId, look up the
  // most recent history row that contains a matching destination.id. This
  // recovers navigation for legacy rows without rewriting them.
  const destIdToTripId = new Map<string, string>();
  for (const h of historyRows) {
    const tid = h.trip?.tripId;
    if (!tid) continue;
    for (const d of h.trip.destinations ?? []) {
      if (d?.id && !destIdToTripId.has(d.id)) destIdToTripId.set(d.id, tid);
    }
  }

  // ── Picks: newest generations first, one card per place ────────────────
  // The newest generation is "fresh" (highlighted when the dashboard was
  // reached from it). Older ones fill up to MAX_PICKS so the shelf never
  // looks empty after a single run.
  const freshTripId = highlightTripId ?? historyRows[0]?.trip?.tripId ?? null;
  const seenPlaces = new Set<string>();
  const pickSeeds: { d: APIDestination; tripId: string | null; input: TripInput; fresh: boolean }[] = [];
  for (const h of historyRows) {
    const tripId = h.trip?.tripId ?? null;
    for (const d of h.trip?.destinations ?? []) {
      if (!d?.name) continue;
      const key = `${d.name.toLowerCase()}|${(d.country ?? "").toLowerCase()}`;
      if (seenPlaces.has(key)) continue;
      seenPlaces.add(key);
      pickSeeds.push({ d, tripId, input: h.trip.input, fresh: tripId !== null && tripId === freshTripId });
      if (pickSeeds.length >= MAX_PICKS) break;
    }
    if (pickSeeds.length >= MAX_PICKS) break;
  }

  const [picks, savedWithPhotos] = await Promise.all([
    Promise.all(
      pickSeeds.map(async ({ d, tripId, input, fresh }): Promise<Pick> => {
        const nights = computeNights(input?.checkIn ?? "", input?.checkOut ?? "");
        const reconciled = computeReconciledTotal(d.estimates, nights, input?.transportMode ?? "plane");
        const totalEur = reconciled?.total ?? null;
        return {
          destination: d,
          tripId,
          photoUrl: (await getCityPhoto(d.name, d.country)) || null,
          totalEur,
          nights,
          budgetFit: computeBudgetFit(totalEur ?? undefined, input?.budget ?? 0),
          fresh,
          watchId:
            watchIdByPlace.get(`${d.name.toLowerCase()}|${(d.country ?? "").toLowerCase()}`) ?? null,
        };
      }),
    ),
    // Resolve cached city photos + tripId for the saved cards in parallel.
    Promise.all(
      savedRows.map(async (row) => {
        const ctxTripId = row.destination?.__context?.tripId ?? null;
        const fallbackTripId = destIdToTripId.get(row.destination.id) ?? null;
        return {
          id: row.id,
          destination: row.destination,
          created_at: row.created_at,
          photoUrl: await getCityPhoto(row.destination.name, row.destination.country),
          resolvedTripId: ctxTripId ?? fallbackTripId,
        };
      }),
    ),
  ]);

  // Stats
  const tripsGenerated = historyRows.length;
  const destinationsSaved = savedRows.length;
  const countriesSet = new Set<string>();
  for (const row of historyRows) {
    for (const d of row.trip.destinations ?? []) {
      if (d.country) countriesSet.add(d.country);
    }
  }
  const countriesExplored = countriesSet.size;

  const displayName =
    (profileRes.data?.display_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "Traveler";
  const firstName = displayName.split(" ")[0];
  const onboarded = !!traveler?.completedAt;
  const picksInput = traveler ? buildFirstPicksInput(traveler) : null;

  return (
    <main className="relative flex-1 overflow-hidden">
      <GradientMesh variant="absolute-tall" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0D7377] hover:text-[#0A5D60] transition-colors mb-3"
          >
            <span aria-hidden="true">←</span>
            Back to Triply
          </Link>
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
            Your dashboard
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
            {onboarded && picks.length ? `Welcome back, ${firstName}.` : `Hey ${firstName}.`}
          </h1>
          <p className="text-sm text-muted mt-1">
            {onboarded
              ? "Places picked for you, the prices you're watching, and everything you've saved."
              : "Everything you've saved and dreamed up, all in one place."}
          </p>
        </header>

        {onboarded && picksInput ? (
          <>
            <PickedForYou
              picks={picks}
              highlight={!!highlightTripId}
              input={picksInput}
              remaining={limit.remaining}
              firstName={firstName}
            />
            <Watchlist rows={watchRows} email={user.email ?? null} />
            {traveler && <TravelerProfile profile={traveler} />}
          </>
        ) : (
          <OnboardingNudge firstName={firstName} />
        )}

        <StatsBar
          tripsGenerated={tripsGenerated}
          destinationsSaved={destinationsSaved}
          countriesExplored={countriesExplored}
        />

        <SavedDestinations rows={savedWithPhotos} />

        <GenerationHistory rows={historyRows} />

        <DeleteAccount />
      </div>
    </main>
  );
}
