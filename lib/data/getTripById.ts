import { supabase } from "@/lib/supabase";
import type { APITripResponse, TripInput } from "@/lib/types";

export interface TripRecord {
  id: string;
  input: TripInput;
  result: APITripResponse;
  created_at: string;
}

// Looks up a trip by its UUID, supporting two storage paths:
//
// 1. `trips` table — the canonical per-session record written by
//    `app/api/trips/route.ts` on the standard 3-destination flow.
// 2. `trip_cache` table — used by the custom-city n8n webhook, which writes
//    the new trip directly to the cache instead of going through the server
//    route. Existing schema is `cache_key (text), result (jsonb), cached_at`,
//    so we look up by `cache_key === tripId`. If your n8n workflow added
//    different columns (e.g. `trip_id` / `trip_data`), rename `.eq("cache_key",
//    tripId)` and `.select(...)` accordingly.
//
// The cached `result` is expected to either be the full TripRecord-shaped
// record `{ input, result }`, or a bare `APITripResponse` with destinations.
// Anything else logs a diagnostic and returns null (treated as 404 upstream).
export async function getTripById(tripId: string): Promise<TripRecord | null> {
  // Primary: trips
  const { data: tripsRow, error: tripsErr } = await supabase
    .from("trips")
    .select("id, input, result, created_at")
    .eq("id", tripId)
    .maybeSingle();

  if (tripsRow) return tripsRow as TripRecord;
  if (tripsErr && tripsErr.code !== "PGRST116") {
    // PGRST116 is "no rows returned" — expected when falling through.
    console.warn("[getTripById] trips query error:", tripsErr.message);
  }

  // Fallback: trip_cache. The custom-city n8n webhook stores the freshly
  // generated trip here keyed by the same UUID it returns to the client.
  const { data: cacheRow, error: cacheErr } = await supabase
    .from("trip_cache")
    .select("cache_key, result, cached_at")
    .eq("cache_key", tripId)
    .maybeSingle();

  if (cacheErr) {
    console.warn(
      "[getTripById] trip_cache fallback error:",
      tripId,
      cacheErr.message,
    );
    return null;
  }
  if (!cacheRow || !cacheRow.result) {
    console.warn("[getTripById] trip not found in trips or trip_cache:", tripId);
    return null;
  }

  // JSONB columns can come back parsed (object) or as a string depending on
  // how the row was written. Normalize.
  const raw: unknown =
    typeof cacheRow.result === "string"
      ? safeJsonParse(cacheRow.result)
      : cacheRow.result;

  if (!raw || typeof raw !== "object") {
    console.warn("[getTripById] trip_cache row has unparseable result:", tripId);
    return null;
  }

  const created_at =
    (cacheRow.cached_at as string | undefined) ?? new Date().toISOString();
  const c = raw as Record<string, unknown>;

  // Shape A: row stores a full TripRecord-shaped envelope { input, result }
  if (
    "input" in c &&
    "result" in c &&
    c.input &&
    c.result &&
    typeof c.result === "object" &&
    Array.isArray((c.result as { destinations?: unknown }).destinations)
  ) {
    return {
      id: tripId,
      input: c.input as TripInput,
      result: c.result as APITripResponse,
      created_at,
    };
  }

  // Shape B: row stores a bare APITripResponse (no input pair). Synthesize a
  // minimal input — downstream consumers (`generateMetadata`,
  // `adaptAPIDestination`) tolerate missing fields via optional-chaining
  // guards added in an earlier hardening pass.
  if ("destinations" in c && Array.isArray(c.destinations)) {
    return {
      id: tripId,
      input: {} as TripInput,
      result: c as unknown as APITripResponse,
      created_at,
    };
  }

  console.warn(
    "[getTripById] trip_cache row found but shape unrecognized:",
    tripId,
    "top-level keys:",
    Object.keys(c),
  );
  return null;
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
