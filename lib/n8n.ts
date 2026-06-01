// Caching for trip generation lives entirely in n8n — the workflow has its
// own Check Cache / Save to Cache nodes against the `trip_cache` table.
// fetchTripSuggestions just calls the webhook, which returns either a
// cached or a freshly generated result; Next.js does not cache here.

import type { TripInput, APITripResponse } from "@/lib/types";
import { computeNights, monthName, isoWeekKey } from "@/lib/dates";
import { travelersLabel, travelersFlavor } from "@/lib/travelers";

// Thrown when we couldn't reach the n8n trip-planning service OR n8n returned
// a non-2xx response. Distinct from generic Errors so the API route can return
// a 503 + structured body for these — letting the client show a friendly
// "planner is taking a moment" mascot screen rather than a generic 500.
export class UpstreamUnavailableError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "UpstreamUnavailableError";
    this.status = status;
  }
}

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
    throw new UpstreamUnavailableError(
      `Failed to reach trip planning service: ${message}`,
    );
  }

  if (!response.ok) {
    throw new UpstreamUnavailableError(
      `Trip planning service returned ${response.status}: ${response.statusText}`,
      response.status,
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
