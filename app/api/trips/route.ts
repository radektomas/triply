import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

  const rawMode = String(raw.destinationMode ?? "surprise");
  const requestedMode: "surprise" | "specific" | "exact_city" =
    rawMode === "specific" || rawMode === "exact_city" ? rawMode : "surprise";
  const destinationInputRaw = String(raw.destinationInput ?? "")
    .slice(0, 80)
    .replace(/[^\p{L}\p{N}\s,\-.']/gu, "")
    .trim();
  // Both `specific` and `exact_city` carry a destinationInput. If the input
  // is missing/too short we fall back to surprise mode.
  const destinationInput =
    requestedMode !== "surprise" && destinationInputRaw.length >= 2
      ? destinationInputRaw
      : undefined;
  const destinationMode: "surprise" | "specific" | "exact_city" =
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
    let result = await getCachedTripByInput(input);

    if (!result) {
      console.log("[api/trips] cache miss, calling n8n");
      result = await fetchTripSuggestions(input);
    } else {
      console.log("[api/trips] cache hit");
    }

    // Create a new trips row — unique UUID per user session
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({ input, result, cache_key: cacheKey })
      .select("id")
      .single();

    if (error || !trip) {
      console.error("[api/trips] failed to save trip:", error);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    // Surface the first destination's slug so exact_city callers can deep-link
    // straight to /trip/<id>?d=<slug>. Harmless for surprise/specific modes.
    const firstDestinationId = result.destinations?.[0]?.id ?? null;
    return NextResponse.json({ tripId: trip.id, firstDestinationId });
  } catch (err: unknown) {
    console.error("[api/trips] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
