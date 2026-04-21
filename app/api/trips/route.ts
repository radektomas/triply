import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchTripSuggestions, getCachedTripByInput, buildCacheKey } from "@/lib/n8n";
import { computeNights } from "@/lib/dates";
import type { TripInput } from "@/lib/types";

function normalizeInput(raw: Record<string, unknown>): TripInput {
  return {
    budget: Number(raw.budget),
    checkIn: String(raw.checkIn ?? "").trim(),
    checkOut: String(raw.checkOut ?? "").trim(),
    travelers: Number(raw.travelers),
    vibe: String(raw.vibe).toLowerCase().trim(),
    originCity: String(raw.originCity).trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const input = normalizeInput(body);

    if (!input.budget || !input.checkIn || !input.checkOut || !input.travelers || !input.vibe || !input.originCity) {
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
      return NextResponse.json({ error: "Failed to save trip" }, { status: 500 });
    }

    return NextResponse.json({ tripId: trip.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[api/trips] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
