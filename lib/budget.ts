import type { APIDestination } from "@/lib/types";

// ─── Reconciled per-person budget ────────────────────────────────────────────
//
// SINGLE SOURCE OF TRUTH for the per-person trip total shown to the user.
//
// n8n's `totalEstimate.typical` is unreliable and doesn't reconcile with its own
// per-category fields, so we DON'T show it. Instead the total is the SUM of the
// category rows (flights + hotel×nights + food×nights + activities×nights +
// transport×nights). Both surfaces call this helper so the results card and the
// trip detail page can never drift apart:
//   - components/results/DestinationCard.tsx  (the "Per-person total" on the card)
//   - lib/data/getTripDetail.ts               (the detail page headline + rows)
//
// Everything here is PER PERSON, whole trip — no travelers multiplication.

export interface ReconciledBudget {
  /** Per-person whole-trip total = sum of the category amounts below. */
  total: number;
  /** Range band scaled from n8n's relative spread onto `total` (see below). */
  min: number;
  max: number;
  /** The per-category amounts the total is composed of (per person, whole trip). */
  categories: {
    flight: number;
    hotel: number;
    food: number;
    activities: number;
    transport: number;
  };
}

/**
 * Compute the reconciled per-person budget from n8n's estimate fields.
 *
 * Returns `null` when there's nothing usable to show (missing estimates, or the
 * summed total isn't a positive finite number) so callers can HIDE the total
 * rather than render a fake €0 — consistent with the P0-1 null-guarding.
 *
 * The min/max band is n8n's *relative* spread (min/typical, max/typical) scaled
 * onto the summed total, so the range still brackets the headline instead of
 * showing an unrelated n8n range. Falls back to a flat band (= total) when n8n
 * gives no usable `totalEstimate`.
 */
export function computeReconciledTotal(
  estimates: APIDestination["estimates"] | undefined | null,
  nights: number,
): ReconciledBudget | null {
  if (!estimates) return null;

  // Guard nights: invalid/zero dates → only non-nightly costs (flights) count.
  const n = Number.isFinite(nights) && nights > 0 ? nights : 0;

  const flight = estimates.flightRange?.typical ?? 0;
  const hotel = (estimates.hotelPerNightRange?.typical ?? 0) * n;
  const food =
    (estimates.foodPerDay?.budget ?? estimates.foodPerDay?.midRange ?? 0) * n;
  const activities =
    (estimates.activitiesPerDay?.budget ??
      estimates.activitiesPerDay?.midRange ??
      0) * n;
  const transport = (estimates.localTransportPerDay ?? 0) * n;

  const total = flight + hotel + food + activities + transport;
  // Nothing usable (malformed payload / all zero) → caller hides the total.
  if (!Number.isFinite(total) || total <= 0) return null;

  const te = estimates.totalEstimate;
  let min = total;
  let max = total;
  if (te && typeof te.typical === "number" && te.typical > 0) {
    if (typeof te.min === "number") min = Math.round(total * (te.min / te.typical));
    if (typeof te.max === "number") max = Math.round(total * (te.max / te.typical));
  }

  return {
    total,
    min,
    max,
    categories: { flight, hotel, food, activities, transport },
  };
}
