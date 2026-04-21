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
  itinerary: ItineraryDay[];
  tips: string[];
  trustedSources: TrustedSources;
  confidence: "high" | "medium" | "low";
  disclaimer: string;
}

export interface APITripResponse {
  destinations: APIDestination[];
  searchSummary: string;
}

export interface TripInput {
  budget: number;
  month: string;
  nights: number;
  travelers: number;
  vibe: string;
  originCity: string;
}
