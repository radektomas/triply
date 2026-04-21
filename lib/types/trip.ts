export type TripDetail = {
  id: string;
  destination: string;       // "Algarve"
  country: string;           // "Portugal"
  countryCode: string;       // "PT"
  description: string;
  vibes: string[];           // ["beach", "sun", "relax"]

  weather: {
    temperature: number;     // 26
    sunHours: number;        // 9
    seaTemperature: number;  // 20
    precipitation: "dry" | "mixed" | "wet";
    month: string;           // "July"
  };
  nights: number;            // 3

  budget: {
    total: number;           // 340
    range: { min: number; max: number };
    perPerson: boolean;
    travelers: number;       // 1, 2, 4, 6
    breakdown: BudgetCategory[];
  };

  itinerary: ItineraryDay[];
  localWisdom: LocalTip[];

  goodToKnow: {
    currency: string;         // "EUR (€)"
    language: string;         // "Portuguese (English widely spoken)"
    plugType: string;         // "Type F (European standard)"
    timezone: string;         // "WEST (UTC+1, same as Prague in summer)"
    emergencyNumber: string;  // "112"
    bestSimCard?: string;
    tippingCustom?: string;
  };

  whatToPack: PackingItem[];

  booking: {
    flights: BookingLink[];
    hotels: BookingLink[];
    activities: BookingLink[];
    reviews: BookingLink[];
  };

  photos: { url: string; credit?: string; alt: string }[];
};

export type BudgetCategory = {
  label: string;             // "Flights"
  icon: string;              // "✈️"
  amount: number;            // 115
  perUnit?: string;          // "€100–€130 range" or "€45/night × 3"
  color: string;             // hex for stacked bar
  tips?: string[];           // ["Book 6–8 weeks ahead", ...]
  typical?: string;          // "Budget airline round-trip"
};

export type ItineraryDay = {
  day: number;
  title: string;
  estimatedCost: number;
  activities: ItineraryActivity[];
};

export type ItineraryActivity = {
  timeOfDay: "morning" | "afternoon" | "evening";
  title: string;
  duration?: string;          // "2–3h"
  cost?: number;              // 0, 15, etc.
  emoji?: string;             // "🏖️"
  location?: {
    name: string;
    lat?: number;
    lng?: number;
  };
};

export type LocalTip = {
  icon: string;   // "💶"
  title: string;  // "Cash mindset"
  detail: string; // "Many tavernas don't take card outside Faro"
};

export type PackingItem = {
  icon: string;    // "🧴"
  label: string;   // "High-SPF sunscreen"
  reason?: string; // "9h of sun daily"
};

export type BookingLink = {
  provider: string;    // "Skyscanner"
  url: string;
  primary?: boolean;
  description?: string;
};
