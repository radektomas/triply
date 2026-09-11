import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCityPhoto } from "@/lib/photos";
import { computeReconciledTotal, computeBudgetFit } from "@/lib/budget";
import { computeNights } from "@/lib/dates";
import { checkGenerationLimit } from "@/lib/generationLimits";
import { StatsBar } from "@/components/profile/StatsBar";
import { GenerationHistory } from "@/components/profile/GenerationHistory";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { OnboardingNudge, TravelerProfile } from "@/components/profile/TravelerProfile";
import { PickedForYou } from "@/components/profile/PickedForYou";
import { Watchlist, type WatchRow } from "@/components/profile/Watchlist";
import type { Pick } from "@/components/profile/PickCard";
import { getTravelerProfile } from "@/lib/data/getTravelerProfile";
import { buildFirstPicksInput } from "@/lib/traveler";
import { GradientMesh } from "@/components/landing/GradientMesh";
import type { APIDestination, SavedTripContext, TripInput } from "@/lib/types";

export const metadata: Metadata = {
  title: "Your dashboard",
  description: "Places picked for you, your watchlist with price alerts, and your trip history on Triply.",
};

interface SavedRow {
  id: string;
  user_id: string;
  destination: APIDestination & { __context?: SavedTripContext };
  deal_alerts: boolean | null;
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

/** The dashboard shows only the latest generation: three fresh picks. */
const MAX_PICKS = 3;

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

  const [savedRes, historyRes, profileRes, traveler, limit] = await Promise.all([
    supabase
      .from("saved_destinations")
      .select("id, user_id, destination, deal_alerts, created_at")
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
    getTravelerProfile(supabase),
    checkGenerationLimit(supabase),
  ]);

  if (savedRes.error) {
    console.warn("[profile] saved_destinations read failed:", savedRes.error.message);
  }
  const savedRows = (savedRes.data ?? []) as SavedRow[];
  const historyRows = (historyRes.data ?? []) as HistoryRow[];

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
  const savedIdByDest = new Map<string, string>();
  for (const row of savedRows) {
    if (row.destination?.id) savedIdByDest.set(row.destination.id, row.id);
  }

  // ── Picks: the latest generation only ───────────────────────────────────
  // Landing from onboarding / "find me more" passes ?picks=<tripId>; otherwise
  // the newest history row is the current set.
  const freshRow =
    (highlightTripId && historyRows.find((h) => h.trip?.tripId === highlightTripId)) ||
    historyRows[0] ||
    null;
  const pickSeeds = (freshRow?.trip?.destinations ?? []).filter((d) => d?.name).slice(0, MAX_PICKS);
  const freshInput = freshRow?.trip?.input;

  const [picks, watchRows] = await Promise.all([
    Promise.all(
      pickSeeds.map(async (d): Promise<Pick> => {
        const nights = computeNights(freshInput?.checkIn ?? "", freshInput?.checkOut ?? "");
        const reconciled = computeReconciledTotal(d.estimates, nights, freshInput?.transportMode ?? "plane");
        const totalEur = reconciled?.total ?? null;
        return {
          destination: d,
          tripId: freshRow?.trip?.tripId ?? null,
          photoUrl: (await getCityPhoto(d.name, d.country)) || null,
          totalEur,
          nights,
          budgetFit: computeBudgetFit(totalEur ?? undefined, freshInput?.budget ?? 0),
          context: {
            tripId: freshRow?.trip?.tripId,
            checkIn: freshInput?.checkIn ?? "",
            checkOut: freshInput?.checkOut ?? "",
            budget: freshInput?.budget ?? 0,
            vibe: freshInput?.vibe ?? "",
            originCity: freshInput?.originCity ?? "",
          },
          savedId: savedIdByDest.get(d.id) ?? null,
        };
      }),
    ),
    // Watchlist = every saved place, with a cached city photo and a deep link.
    Promise.all(
      savedRows.map(async (row): Promise<WatchRow> => {
        const d = row.destination;
        const tripId = d?.__context?.tripId ?? destIdToTripId.get(d.id) ?? null;
        return {
          id: row.id,
          destination: d,
          photoUrl: (await getCityPhoto(d.name, d.country)) || null,
          href: tripId ? `/trip/${tripId}?d=${d.id}&from=dashboard` : null,
          dealAlerts: row.deal_alerts ?? true,
          createdAt: row.created_at,
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
              ? "Places picked for you, the ones you're watching, and everything you've planned."
              : "Everything you've saved and dreamed up, all in one place."}
          </p>
        </header>

        {onboarded && picksInput ? (
          <PickedForYou
            picks={picks}
            highlight={!!highlightTripId}
            input={picksInput}
            remaining={limit.remaining}
            firstName={firstName}
          />
        ) : (
          <OnboardingNudge firstName={firstName} />
        )}

        <Watchlist rows={watchRows} email={user.email ?? null} />

        {onboarded && traveler && <TravelerProfile profile={traveler} />}

        <StatsBar
          tripsGenerated={tripsGenerated}
          destinationsSaved={destinationsSaved}
          countriesExplored={countriesExplored}
        />

        <GenerationHistory rows={historyRows} />

        <DeleteAccount />
      </div>
    </main>
  );
}
