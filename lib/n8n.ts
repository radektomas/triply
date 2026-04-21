// TODO(post-MVP): Add cache invalidation endpoint.
// Currently cache lives for hours in Next.js layer + 72h in Supabase.
// If OpenAI returns a bad response, users will see it cached for hours.
// Options: admin route to clear by cacheKey, or auto-expire on low confidence.

import type { TripInput, APITripResponse } from "@/lib/types";
import { supabase } from "./supabase";

export async function fetchTripSuggestions(input: TripInput): Promise<APITripResponse> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not configured");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30_000),
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
  return `${input.originCity}_${input.budget}_${input.month}_${input.nights}_${input.travelers}_${input.vibe}`
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export async function getCachedTripByInput(input: TripInput): Promise<APITripResponse | null> {
  const cacheKey = buildCacheKey(input);
  const { data, error } = await supabase
    .from("trip_cache")
    .select("result")
    .eq("cache_key", cacheKey)
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
