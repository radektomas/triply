// Caching for trip generation lives entirely in n8n — the workflow has its
// own Check Cache / Save to Cache nodes against the `trip_cache` table.
// fetchTripSuggestions just calls the webhook, which returns either a
// cached or a freshly generated result; Next.js does not cache here.

import type { TripInput, APITripResponse } from "@/lib/types";
import { computeNights, monthName, isoWeekKey } from "@/lib/dates";
import { travelersLabel, travelersFlavor } from "@/lib/travelers";

// Thrown when the n8n trip-planning call fails. `kind` lets the route handler
// (and ultimately the client) tell a 120s timeout apart from a network/DNS
// failure apart from a non-2xx upstream response — three quite different
// failure modes that all used to look the same.
//
//   - "unreachable": fetch threw (DNS, TLS, network) before any response.
//   - "timeout":     our AbortController fired the 120s timeout.
//   - "error":       upstream responded non-2xx (or returned non-JSON we
//                    couldn't parse). `status` is set for non-2xx; absent
//                    for parse failures.
export type UpstreamFailureKind = "unreachable" | "timeout" | "error";

export class UpstreamUnavailableError extends Error {
  kind: UpstreamFailureKind;
  status?: number;
  constructor(kind: UpstreamFailureKind, message: string, status?: number) {
    super(message);
    this.name = "UpstreamUnavailableError";
    this.kind = kind;
    this.status = status;
  }
}

const N8N_TIMEOUT_MS = 120_000;

export async function fetchTripSuggestions(input: TripInput): Promise<APITripResponse> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_WEBHOOK_URL is not configured");
  }

  // Only `exact_city` is a single-destination request — the user named one
  // city and wants exactly one result. `region` (several cities for a
  // country/region) and `surprise` both return a multi set. Signaled via
  // `mode`/`count` below so the n8n workflow never has to guess the count.
  // The distinct `destinationMode` itself is also forwarded (spread below).
  const isSingle = input.destinationMode === "exact_city";

  // Explicit AbortController (rather than AbortSignal.timeout) so we can:
  //   1. clear the timer on fast responses (no zombie timer after success)
  //   2. distinguish OUR timeout abort from a network/DNS failure in catch
  //      via `signal.aborted` — AbortError from a manual abort is the only
  //      way to land in catch with `controller.signal.aborted === true`.
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

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
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new UpstreamUnavailableError(
        "timeout",
        `Trip planning service did not respond within ${N8N_TIMEOUT_MS / 1000}s`,
      );
    }
    const message = err instanceof Error ? err.message : "Network error";
    throw new UpstreamUnavailableError(
      "unreachable",
      `Failed to reach trip planning service: ${message}`,
    );
  } finally {
    clearTimeout(timeoutHandle);
  }

  if (!response.ok) {
    // Try to include a short slice of the upstream body in the detail so
    // failures aren't completely opaque in server logs.
    const detail = await response.text().catch(() => "");
    const tail = detail ? ` — ${detail.slice(0, 200)}` : "";
    throw new UpstreamUnavailableError(
      "error",
      `Trip planning service returned ${response.status} ${response.statusText}${tail}`,
      response.status,
    );
  }

  try {
    return (await response.json()) as APITripResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new UpstreamUnavailableError(
      "error",
      `Trip planning service returned non-JSON: ${message}`,
      response.status,
    );
  }
}

export function buildCacheKey(input: TripInput): string {
  const weekKey = isoWeekKey(input.checkIn);
  const nights = computeNights(input.checkIn, input.checkOut);
  const destSuffix = input.destinationInput
    ? `_d-${input.destinationInput.toLowerCase().replace(/\s+/g, "-")}`
    : "";
  // Tag single-mode (exact_city) responses so they don't collide with cached
  // multi-destination responses for the same inputs (different response shape).
  const modeSuffix = input.destinationMode === "exact_city" ? "_single" : "";
  // Car trips answer a different question than plane trips from the same
  // origin (drive-radius destinations vs flight destinations), so they must
  // never share a cache entry. Plane adds no suffix — existing cached keys
  // stay valid.
  const transportSuffix =
    input.transportMode === "car" ? `_car-${input.maxDriveHours ?? 6}h` : "";
  return `${input.originCity}_${input.budget}_${weekKey}_${nights}_${input.vibe}_${input.travelers}${destSuffix}${modeSuffix}${transportSuffix}`
    .toLowerCase()
    .replace(/\s+/g, "_");
}
