export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  estimatedCost: number;
}

export interface APIWeather {
  tempC: number;
  sunshineHours: number;
  rain: "low" | "medium" | "high";
  seaTemp?: number;
}

export interface APIFlightRange {
  min: number;
  max: number;
  typical: number;
}

export interface APIEstimates {
  flightRange: APIFlightRange;
  /**
   * Transport-to-destination cost for car trips (fuel + tolls/vignette),
   * same shape as flightRange. The model zeroes flightRange in car mode and
   * fills this instead (and vice versa for plane). Optional: plane responses
   * and car trips cached before the field existed simply omit it.
   */
  drivingCost?: APIFlightRange;
  hotelPerNightRange: { min: number; max: number; typical: number };
  foodPerDay: { budget: number; midRange: number };
  activitiesPerDay: { budget: number; midRange: number };
  localTransportPerDay: number;
  totalEstimate: { min: number; max: number; typical: number };
}

export interface TrustedSource {
  name: string;
  url: string;
  trustScore: number;
}

export interface TrustedSources {
  flights: TrustedSource[];
  hotels: TrustedSource[];
  activities: TrustedSource[];
  reviews: TrustedSource[];
}

export interface APIDestination {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  tagline: string;
  description: string;
  vibes: string[];
  weather: APIWeather;
  estimates: APIEstimates;
  budgetFit: "under" | "fit" | "over";
  itinerary?: ItineraryDay[];
  tips: string[];
  trustedSources: TrustedSources;
  confidence: "high" | "medium" | "low";
  disclaimer: string;
  topPlaces?: TopPlace[];
  /**
   * @deprecated Replaced by `topPlaces`. Still typed so legacy static data
   * (Quick Picks) and historical saved/generation rows in Supabase jsonb
   * continue to typecheck. Not rendered anywhere — kept as an optional
   * passthrough until the static fixtures are migrated.
   */
  dayPlans?: Array<{
    id: string;
    emoji: string;
    vibe: string;
    tagline: string;
    schedule: Array<{
      time: "Morning" | "Midday" | "Afternoon" | "Evening";
      activity: string;
      tip?: string;
    }>;
  }>;
}

export interface TopPlace {
  id: string;
  emoji: string;
  name: string;
  description: string;
  tip?: string;
}

export interface APITripResponse {
  destinations: APIDestination[];
  searchSummary: string;
}

// The three explicit destination choices the fork UI offers, plumbed through
// so the backend never guesses how many destinations to return:
//   - surprise:   no input, return a curated set (multi)
//   - region:     a country/region input, return several cities (multi)
//   - exact_city: a single named city, return exactly one (single)
// `specific` is the legacy unified WIRE value (region + exact collapsed, which
// always returned a single result); the API normalizes it to `exact_city`.
// No current client emits it — the last emitter (CustomCityPicker) was removed
// — so the alias in app/api/trips/route.ts is kept purely for back-compat with
// any in-flight / bookmarked requests still using the old value.
export type DestinationMode = "surprise" | "region" | "exact_city";

// How the traveler gets there. `plane` is the historical (implicit) behavior —
// requests without the field are normalized to it, so old payloads and the
// n8n workflow keep working unchanged. `car` swaps the origin airport for a
// free-text departure city plus a max-driving-time radius.
export type TransportMode = "plane" | "car";

/**
 * Trip context embedded inside a saved destination's jsonb (as `__context`) so
 * the profile page can deep-link back to the trip the save came from. Shared
 * between the SaveButton and the saveDestination Server Action so the two
 * cannot drift.
 */
export interface SavedTripContext {
  tripId?: string;
  checkIn: string;
  checkOut: string;
  budget: number;
  vibe: string;
  originCity: string;
}

export interface TripInput {
  budget: number;
  checkIn: string;   // ISO date: YYYY-MM-DD
  checkOut: string;  // ISO date: YYYY-MM-DD
  travelers: number;
  vibe: string;
  originCity: string;
  destinationMode?: DestinationMode;
  destinationInput?: string;
  transportMode?: TransportMode;
  /** Free-text departure city — only set when transportMode === "car". */
  departureCity?: string;
  /** Max driving time in hours (3/6/9/12) — only set when transportMode === "car". */
  maxDriveHours?: number;
}
