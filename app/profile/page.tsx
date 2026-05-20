import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCityPhoto } from "@/lib/photos";
import { StatsBar } from "@/components/profile/StatsBar";
import { SavedDestinations } from "@/components/profile/SavedDestinations";
import { GenerationHistory } from "@/components/profile/GenerationHistory";
import { GradientMesh } from "@/components/landing/GradientMesh";
import type { APIDestination, TripInput } from "@/lib/types";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your saved destinations and recent trip ideas on Triply.",
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

export default async function ProfilePage() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Sign-in lives in a global modal, not its own page — bouncing to the
    // home page is the closest thing to a login redirect we have.
    redirect("/?signin=1");
  }

  const [savedRes, historyRes, profileRes] = await Promise.all([
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
  ]);

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

  // Resolve cached city photos + tripId for the saved cards in parallel.
  const savedWithPhotos = await Promise.all(
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
  );

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
            Your profile
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
            Welcome back, {displayName.split(" ")[0]}.
          </h1>
          <p className="text-sm text-muted mt-1">
            Everything you&apos;ve saved and dreamed up, all in one place.
          </p>
        </header>

        <StatsBar
          tripsGenerated={tripsGenerated}
          destinationsSaved={destinationsSaved}
          countriesExplored={countriesExplored}
        />

        <SavedDestinations rows={savedWithPhotos} />

        <GenerationHistory rows={historyRows} />
      </div>
    </main>
  );
}
