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

// The app emits only `surprise` or `specific`. `exact_city` was the
// legacy single-city alias; the API normalizes it to `specific` for
// back-compat with any in-flight requests, but no client should send it.
export type DestinationMode = "surprise" | "specific";

export interface TripInput {
  budget: number;
  checkIn: string;   // ISO date: YYYY-MM-DD
  checkOut: string;  // ISO date: YYYY-MM-DD
  travelers: number;
  vibe: string;
  originCity: string;
  destinationMode?: DestinationMode;
  destinationInput?: string;
}
