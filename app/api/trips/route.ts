import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSupabase } from "@/lib/supabase/server";
import { fetchTripSuggestions, getCachedTripByInput, buildCacheKey } from "@/lib/n8n";
import { computeNights } from "@/lib/dates";
import type { TripInput } from "@/lib/types";

const ALLOWED_VIBES = [
  "beach",
  "city",
  "mountains",
  "party",
  "culture",
  "adventure",
  "relax",
  "nature",
  "food",
  "romantic",
  "hiking",
  "wine",
  "spa",
  "luxury",
  "budget",
  "history",
  "art",
  "nightlife",
  "diving",
];

function normalizeInput(raw: Record<string, unknown>): TripInput {
  const budget = Math.min(Math.max(Number(raw.budget) || 500, 50), 10000);
  const travelers = Math.min(
    Math.max(Math.round(Number(raw.travelers) || 1), 1),
    10,
  );
  const originCity = String(raw.originCity ?? "Prague")
    .slice(0, 50)
    .replace(/[^\w\s,\-.]/g, "")
    .trim();
  const vibeRaw = String(raw.vibe ?? "").toLowerCase().trim();
  const vibe = ALLOWED_VIBES.includes(vibeRaw) ? vibeRaw : "city";

  // `specific` is the unified single-destination mode. `exact_city` is
  // kept as a back-compat alias and normalized to `specific` here — the
  // app no longer emits it, but in-flight requests / stale URLs survive.
  const rawMode = String(raw.destinationMode ?? "surprise");
  const requestedMode: "surprise" | "specific" =
    rawMode === "specific" || rawMode === "exact_city" ? "specific" : "surprise";
  const destinationInputRaw = String(raw.destinationInput ?? "")
    .slice(0, 80)
    .replace(/[^\p{L}\p{N}\s,\-.']/gu, "")
    .trim();
  // `specific` mode carries a destinationInput. If the input is
  // missing/too short we fall back to surprise mode.
  const destinationInput =
    requestedMode !== "surprise" && destinationInputRaw.length >= 2
      ? destinationInputRaw
      : undefined;
  const destinationMode: "surprise" | "specific" =
    destinationInput ? requestedMode : "surprise";

  return {
    budget,
    checkIn: String(raw.checkIn ?? "").trim(),
    checkOut: String(raw.checkOut ?? "").trim(),
    travelers,
    vibe,
    originCity,
    destinationMode,
    destinationInput,
  };
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const tag = (label: string, since: number) =>
    `[api/trips] +${(Date.now() - since).toString().padStart(5)}ms ${label}`;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = normalizeInput(body);

    if (!input.checkIn || !input.checkOut || !input.originCity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (computeNights(input.checkIn, input.checkOut) < 1) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    const cacheKey = buildCacheKey(input);

    // Try cross-user trip_cache first (saves n8n cost for repeated searches)
    const tCache = Date.now();
    let result = await getCachedTripByInput(input);
    console.log(tag(`cache-check (hit=${!!result})`, tCache));

    if (!result) {
      const tN8n = Date.now();
      console.log("[api/trips] cache miss, calling n8n");
      result = await fetchTripSuggestions(input);
      console.log(tag("n8n response", tN8n));
    }

    // Create a new trips row — unique UUID per user session
    const tInsert = Date.now();
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({ input, result, cache_key: cacheKey })
      .select("id")
      .single();
    console.log(tag("trips insert", tInsert));

    if (error || !trip) {
      console.error("[/api/trips] Supabase insert failed:", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    // If the request is from a signed-in user, append this generation to
    // their personal history. Uses the cookie-bound server client so the
    // row is written under the user's identity (RLS-friendly).
    const tHist = Date.now();
    try {
      const userClient = await getServerSupabase();
      const {
        data: { user },
      } = await userClient.auth.getUser();
      if (user) {
        const { error: histErr } = await userClient
          .from("generation_history")
          .insert({
            user_id: user.id,
            trip: {
              tripId: trip.id,
              input,
              destinations: result.destinations ?? [],
              searchSummary: result.searchSummary ?? null,
            },
          });
        if (histErr) {
          console.warn("[/api/trips] generation_history insert failed:", histErr.message);
        }
      }
    } catch (histErr) {
      console.warn("[/api/trips] generation_history write skipped:", histErr);
    }
    console.log(tag("generation_history", tHist));

    // Surface the destinations count + first slug so the caller can branch:
    //   count === 1 → deep-link to /trip/<id>?d=<slug> (detail page)
    //   count >  1 → go to /trip/<id>            (results grid / selector)
    // A `specific` query for a region (e.g. "Sardinia") can legitimately
    // return multiple destinations; the count tells callers which.
    const destinationCount = result.destinations?.length ?? 0;
    const firstDestinationId = result.destinations?.[0]?.id ?? null;
    console.log(tag("total", t0));
    return NextResponse.json({
      tripId: trip.id,
      firstDestinationId,
      destinationCount,
    });
  } catch (err: unknown) {
    console.error("[/api/trips] Failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
