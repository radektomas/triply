// Traveler profile — shared contract between the onboarding wizard
// (components/onboarding/*), its server actions (app/onboarding/actions.ts),
// the profile page section (components/profile/TravelerProfile.tsx) and the
// first-picks generation. Free of "server-only" and of any Supabase import so
// both ends type against the same shapes.

import type { TripInput } from "@/lib/types";

// Vibes the wizard offers. Every value MUST be in ALLOWED_VIBES
// (app/api/trips/route.ts) — the primary vibe is replayed into /api/trips
// verbatim for the first-picks generation.
export const TRAVELER_VIBES = [
  "beach",
  "city",
  "mountains",
  "party",
  "culture",
  "adventure",
  "romantic",
  "nature",
  "food",
  "relax",
] as const;

export type TravelerVibe = (typeof TRAVELER_VIBES)[number];

const VIBE_SET: ReadonlySet<string> = new Set(TRAVELER_VIBES);
export function isTravelerVibe(v: unknown): v is TravelerVibe {
  return typeof v === "string" && VIBE_SET.has(v);
}

/** How many vibes a traveler may pick. */
export const MAX_VIBES = 4;

// Same envelope as the planner (components/landing/TripForm.tsx) and the
// server clamp in app/api/trips/route.ts.
export const BUDGET_MIN = 100;
export const BUDGET_MAX = 2000;
export const BUDGET_STEP = 10;
export const BUDGET_PRESETS = [300, 500, 800, 1200] as const;
export const DEFAULT_BUDGET = 500;

// Travel party presets — mirror TripForm's TRAVELER_PRESETS counts so the
// stored number maps 1:1 onto `travelers` in /api/trips.
export const PARTY_PRESETS = [
  { count: 1, label: "Solo" },
  { count: 2, label: "Couple" },
  { count: 4, label: "Family" },
  { count: 5, label: "Group" },
] as const;

export const MAX_VISITED_PLACES = 80;
export const MAX_TRAVEL_WINDOWS = 12;
/** Longest window the picker accepts, in nights. */
export const MAX_WINDOW_NIGHTS = 60;
/** How far ahead a window may start. */
export const WINDOW_HORIZON_MONTHS = 18;

export const VISITED_PHOTOS_BUCKET = "visited-photos";

export interface TravelerPrefs {
  vibes: TravelerVibe[];
  /** Per-person, whole trip, EUR. */
  budgetEur: number;
  /** IATA code, e.g. "PRG". */
  homeAirport: string | null;
  /** City name matching the airport — sent to /api/trips as originCity. */
  homeCity: string | null;
  travelParty: number;
}

export type VisitedPlaceKind = "city" | "country";

export interface VisitedPlace {
  id: string;
  kind: VisitedPlaceKind;
  /** Country name for kind="country"; city name for kind="city". */
  name: string;
  country: string;
  /** ISO alpha-2. For kind="country" this is the country itself. */
  countryCode: string;
  lat: number | null;
  lng: number | null;
  photoPath: string | null;
  /** Short-lived signed URL of the user's OWN photo. Null when none. */
  photoUrl: string | null;
  /** Stock photo from the shared Pexels city-photo cache (lib/photos.ts).
   *  Shown when the user hasn't added their own. */
  stockPhotoUrl: string | null;
}

export interface TravelWindow {
  id: string;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  label: string | null;
}

export interface TravelerProfile {
  prefs: TravelerPrefs;
  places: VisitedPlace[];
  windows: TravelWindow[];
  completedAt: string | null;
}

export const EMPTY_PREFS: TravelerPrefs = {
  vibes: [],
  budgetEur: DEFAULT_BUDGET,
  homeAirport: null,
  homeCity: null,
  travelParty: 1,
};

// ── helpers ─────────────────────────────────────────────────────────────────

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function nightsBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** A trip is costed per night; a 3-week "free window" is not a 3-week trip.
 *  Windows longer than this are trimmed to a typical getaway from their start. */
const TYPICAL_TRIP_NIGHTS = 7;

/**
 * Turn a traveler profile into the input for their first generated picks.
 *
 * Dates come from the earliest upcoming window (trimmed to a typical trip
 * length when the window is long). With no windows, a long weekend roughly
 * six weeks out is used — far enough for flights to be sensible, close
 * enough to feel real.
 */
export function buildFirstPicksInput(
  profile: Pick<TravelerProfile, "prefs" | "windows"> & Partial<Pick<TravelerProfile, "places">>,
  now: Date = new Date(),
): TripInput {
  const { prefs, windows } = profile;
  const visitedCountries = Array.from(
    new Set((profile.places ?? []).map((p) => (p.kind === "country" ? p.name : p.country)).filter(Boolean)),
  );
  const today = toIsoDate(now);

  const upcoming = [...windows]
    .filter((w) => w.endDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  let checkIn: string;
  let checkOut: string;
  if (upcoming.length > 0) {
    const w = upcoming[0];
    checkIn = w.startDate > today ? w.startDate : addDays(today, 1);
    const nights = nightsBetween(checkIn, w.endDate);
    checkOut =
      nights > TYPICAL_TRIP_NIGHTS + 3
        ? addDays(checkIn, TYPICAL_TRIP_NIGHTS)
        : nights >= 1
          ? w.endDate
          : addDays(checkIn, 3);
  } else {
    // Friday ~6 weeks out → Monday.
    const d = new Date(now);
    d.setDate(d.getDate() + 42);
    const toFriday = (5 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + toFriday);
    checkIn = toIsoDate(d);
    checkOut = addDays(checkIn, 3);
  }

  return {
    budget: Math.min(Math.max(prefs.budgetEur || DEFAULT_BUDGET, BUDGET_MIN), BUDGET_MAX),
    checkIn,
    checkOut,
    travelers: prefs.travelParty || 1,
    vibe: prefs.vibes[0] ?? "city",
    originCity: prefs.homeCity ?? "Prague",
    destinationMode: "surprise",
    transportMode: "plane",
    ...(visitedCountries.length > 0 ? { visitedCountries } : {}),
  };
}

/** Human label for a window: "12 Oct – 19 Oct · 7 nights". */
export function formatWindow(w: Pick<TravelWindow, "startDate" | "endDate">): {
  range: string;
  nights: number;
} {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  return {
    range: `${fmt(w.startDate)} – ${fmt(w.endDate)}`,
    nights: nightsBetween(w.startDate, w.endDate),
  };
}
