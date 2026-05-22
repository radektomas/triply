// TODO(post-MVP): Add cache invalidation endpoint.
// The Supabase `trip_cache` layer expires entries after 7 days (enforced in
// getCachedTripByInput via the `cached_at` filter). If OpenAI returns a bad
// response it can still serve for up to 7 days.
// Options: admin route to clear by cacheKey, or auto-expire on low confidence.

import type { TripInput, APITripResponse } from "@/lib/types";
import { computeNights, monthName, isoWeekKey } from "@/lib/dates";
import { travelersLabel, travelersFlavor } from "@/lib/travelers";
import { supabase } from "./supabase";

export async function fetchTripSuggestions(input: TripInput): Promise<APITripResponse> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not configured");
  }

  // `specific` is the unified single-destination flow — the user supplied a
  // destinationInput (city or region) and wants one curated result. Signal
  // single-destination intent via `mode: "single", count: 1` so the n8n
  // workflow can branch on it and return a 1-element destinations array.
  const isSingle = input.destinationMode === "specific";

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        budgetPerPerson: input.budget,
        budgetTotal: input.budget * input.travelers,
        month: monthName(input.checkIn),
        nights: computeNights(input.checkIn, input.checkOut),
        travelersLabel: travelersLabel(input.travelers),
        travelersFlavor: travelersFlavor(input.travelers),
        mode: isSingle ? "single" : "multi",
        count: isSingle ? 1 : 3,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new Error(`Failed to reach trip planning service: ${message}`);
  }

  if (!response.ok) {
    throw new Error(
      `Trip planning service returned ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<APITripResponse>;
}

export function buildCacheKey(input: TripInput): string {
  const weekKey = isoWeekKey(input.checkIn);
  const nights = computeNights(input.checkIn, input.checkOut);
  const destSuffix = input.destinationInput
    ? `_d-${input.destinationInput.toLowerCase().replace(/\s+/g, "-")}`
    : "";
  // Tag single-mode responses so they don't collide with cached 3-destination
  // responses for the same inputs (different response shape).
  const modeSuffix = input.destinationMode === "specific" ? "_single" : "";
  return `${input.originCity}_${input.budget}_${weekKey}_${nights}_${input.vibe}_${input.travelers}${destSuffix}${modeSuffix}`
    .toLowerCase()
    .replace(/\s+/g, "_");
}

// trip_cache entries older than this are treated as a miss — a stale or bad
// AI response must not serve indefinitely. Kept in sync with the writer in
// app/api/trips/route.ts (both use the `trip_cache` table + buildCacheKey).
export const TRIP_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function getCachedTripByInput(input: TripInput): Promise<APITripResponse | null> {
  const cacheKey = buildCacheKey(input);
  const freshAfter = new Date(Date.now() - TRIP_CACHE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("trip_cache")
    .select("result")
    .eq("cache_key", cacheKey)
    .gte("cached_at", freshAfter)
    .single();

  if (error || !data?.result) return null;

  // JSONB columns return a parsed object, but if inserted as a string they come back as-is
  const raw: unknown = data.result;
  try {
    const parsed: APITripResponse =
      typeof raw === "string" ? (JSON.parse(raw) as APITripResponse) : (raw as APITripResponse);

    if (!Array.isArray(parsed?.destinations)) {
      console.error("[getCachedTripByInput] Unexpected shape — missing destinations array:", parsed);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("[getCachedTripByInput] Failed to parse result from Supabase:", err);
    return null;
  }
}
