// Shared prefill channel between landing-page entry points (VibeSearch,
// BudgetShowcase) and the planner form (TripForm). Lives here so the
// payload type and dispatcher aren't owned by any one component and can
// grow without coupling consumers to each other.
//
// The channel is a window-level CustomEvent rather than React context so
// the producers stay decoupled — no shared provider needed — and so the
// listener can sit alongside TripForm's other useEffect hooks without
// reaching outside the planner subtree.

export interface PrefillCity {
  // "region" routes the prefill into TripForm's "I know the region" mode
  // and `regionSelection`; "city" routes into "exact_city" + `exactCity`.
  kind: "city" | "region";
  cityName: string;
  countryName: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export interface PrefillPayload {
  /** Free-text query — derives a vibe enum value via deriveTripFormVibe. */
  vibeQuery?: string;
  /** Pre-selected destination — populates the matching autocomplete + mode. */
  city?: PrefillCity;
  /** Pre-selected budget in EUR — populates the wizard's budget slider. */
  budget?: number;
}

export const PREFILL_EVENT = "triply:prefill" as const;

export function dispatchPrefill(payload: PrefillPayload) {
  window.dispatchEvent(
    new CustomEvent<PrefillPayload>(PREFILL_EVENT, { detail: payload }),
  );
  const planner = document.getElementById("planner");
  if (planner) {
    planner.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
