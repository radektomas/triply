import { getCityCoords, spreadAroundCenter } from "@/lib/data/cityCoords";
import { computeNights, monthName } from "@/lib/dates";
import { bookingHotelUrl, skyscannerFlightUrl, getYourGuideUrl } from "@/lib/booking";
import type { APIDestination, TripInput, TrustedSource } from "@/lib/types";
import type {
  TripDetail,
  BudgetCategory,
  ItineraryDay,
  ItineraryActivity,
  BookingLink,
  MustDoItem,
  MustDoCategory,
} from "@/lib/types/trip";

// ─── Adapter ─────────────────────────────────────────────────────────────────

function buildBudget(e: APIDestination["estimates"], nights: number, travelers: number): TripDetail["budget"] {
  const flightCost = e.flightRange?.typical ?? 0;
  const hotelNightly = e.hotelPerNightRange?.typical ?? 0;
  const hotelCost = hotelNightly * nights;
  const foodDaily = e.foodPerDay?.budget ?? e.foodPerDay?.midRange ?? 0;
  const foodCost = foodDaily * nights;
  const activitiesDaily = e.activitiesPerDay?.budget ?? e.activitiesPerDay?.midRange ?? 0;
  const activitiesCost = activitiesDaily * nights;
  const transportDaily = e.localTransportPerDay ?? 0;
  const transportCost = transportDaily * nights;

  const total =
    e.totalEstimate?.typical ??
    flightCost + hotelCost + foodCost + activitiesCost + transportCost;

  return {
    total,
    range: {
      min: e.totalEstimate?.min ?? total,
      max: e.totalEstimate?.max ?? total,
    },
    perPerson: true,
    travelers,
    breakdown: [
      {
        label: "Flights",
        icon: "✈️",
        amount: flightCost,
        perUnit: e.flightRange
          ? `€${e.flightRange.min}–€${e.flightRange.max} range`
          : undefined,
        color: "#4A90E2",
        tips: ["Book 6–8 weeks ahead", "Tue/Wed departures save ~15%"],
        typical: "Budget airline round-trip",
      },
      {
        label: "Hotel",
        icon: "🏨",
        amount: hotelCost,
        perUnit: `€${hotelNightly}/night × ${nights}`,
        color: "#FF6B47",
        tips: ["Compare Booking.com with direct rates", "15 min walk from center = 30% cheaper"],
        typical: "3★ guesthouse or Airbnb",
      },
      {
        label: "Food",
        icon: "🍽️",
        amount: foodCost,
        perUnit: `€${foodDaily}/day × ${nights}`,
        color: "#0D7377",
        tips: ["Lunch menu of the day is €8–12", "Breakfast at local cafés, not hotels"],
        typical: "Mix of local restaurants and one nice dinner",
      },
      {
        label: "Activities",
        icon: "🎭",
        amount: activitiesCost,
        perUnit: `€${activitiesDaily}/day × ${nights}`,
        color: "#F4A261",
        tips: ["Book tours a week ahead for best prices", "Free walking tours in most cities"],
        typical: "2–3 paid activities, rest free",
      },
      {
        label: "Transport",
        icon: "🚌",
        amount: transportCost,
        perUnit: `€${transportDaily}/day × ${nights}`,
        color: "#8E7CC3",
        tips: ["Day pass if taking 3+ rides", "Walk when possible — you see more"],
        typical: "Public transit + occasional taxi",
      },
    ],
  };
}

export function adaptAPIDestination(dest: APIDestination, input: TripInput): TripDetail {
  const nights = computeNights(input.checkIn, input.checkOut);

  const itinerary: ItineraryDay[] = dest.itinerary.map((day) => ({
    day: day.day,
    title: day.title,
    estimatedCost: day.estimatedCost,
    activities: day.activities.map(
      (act, i): ItineraryActivity => ({
        timeOfDay: inferTimeOfDay(act, i),
        title: stripTimePrefix(act),
      })
    ),
  }));

  const sources = dest.trustedSources;

  const buildFlightUrl = (s: TrustedSource): string => {
    const name = s.name.toLowerCase();
    if (name.includes("skyscanner") || name.includes("kiwi") || name.includes("google flights")) {
      return skyscannerFlightUrl(input.originCity, dest.name, input.checkIn, input.checkOut, input.travelers);
    }
    return s.url;
  };

  const buildHotelUrl = (s: TrustedSource): string => {
    if (s.name.toLowerCase().includes("booking")) {
      return bookingHotelUrl({ city: dest.name, country: dest.country, checkIn: input.checkIn, checkOut: input.checkOut, travelers: input.travelers });
    }
    return s.url;
  };

  const buildActivityUrl = (s: TrustedSource): string => {
    const name = s.name.toLowerCase();
    if (name.includes("getyourguide") || name.includes("viator")) {
      return getYourGuideUrl(dest.name);
    }
    return s.url;
  };

  const toLink = (url: string) => (s: TrustedSource): BookingLink => ({
    provider: s.name,
    url,
    primary: s.trustScore >= 4.5,
  });

  return {
    id: dest.id,
    destination: dest.name,
    country: dest.country,
    countryCode: dest.countryCode,
    description: dest.description,
    vibes: dest.vibes,
    weather: {
      temperature: dest.weather.tempC,
      sunHours: dest.weather.sunshineHours,
      seaTemperature: dest.weather.seaTemp ?? 18,
      precipitation: adaptRain(dest.weather.rain),
      month: capitalizeFirst(monthName(input.checkIn)),
    },
    nights,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    budget: buildBudget(dest.estimates, nights, input.travelers),
    mustDo: deriveMustDo(dest, nights),
    itinerary,
    localWisdom: [],
    goodToKnow: defaultGoodToKnow(dest.country),
    whatToPack: [],
    booking: {
      flights:    sources.flights.map((s) => toLink(buildFlightUrl(s))(s)),
      hotels:     sources.hotels.map((s) => toLink(buildHotelUrl(s))(s)),
      activities: sources.activities.map((s) => toLink(buildActivityUrl(s))(s)),
      reviews:    sources.reviews.map((s) => toLink(s.url)(s)),
    },
    photos: [],
  };
}

// ─── MustDo fallback derivation ──────────────────────────────────────────────

const CATEGORY_KEYWORDS: Partial<Record<MustDoCategory, string[]>> = {
  landmark: ["castle", "palace", "cathedral", "church", "tower", "bridge", "square", "basilica", "fort", "old town", "ruins"],
  museum: ["museum", "gallery", "memorial", "exhibition"],
  park: ["park", "garden", "forest", "nature", "botanical"],
  restaurant: ["restaurant", "dinner", "lunch", "eat", "bistro", "taverna", "dining", "cataplana", "food"],
  cafe: ["cafe", "coffee", "breakfast", "café"],
  shopping: ["market", "shop", "boutique", "mall", "bazaar", "souk"],
  nightlife: ["pub", "bar", "club", "nightlife", "ruin bar", "cocktail"],
  beach: ["beach", "praia", "shore", "coast", "cove", "bay"],
  viewpoint: ["viewpoint", "lookout", "vista", "panorama", "hill", "cape", "summit", "peak"],
  activity: ["hiking", "tour", "boat", "bike", "zip", "kayak", "snorkel", "swim", "bath", "spa"],
};

function inferMustDoCategory(title: string): MustDoCategory {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [MustDoCategory, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "activity";
}

function deriveMustDo(dest: APIDestination, nights: number): MustDoItem[] {
  const activities: string[] = [];
  for (const day of dest.itinerary) {
    for (const act of day.activities) {
      const clean = stripTimePrefix(act);
      if (clean) activities.push(clean);
    }
  }

  const unique = [...new Map(activities.map((a) => [a.toLowerCase(), a])).values()];
  const picks = unique.slice(0, 5);

  const FALLBACKS = [
    "Explore the old town",
    "Try local cuisine",
    "Visit a local market",
    "Walk the waterfront",
    "Take a day trip nearby",
  ];
  while (picks.length < 5) {
    picks.push(FALLBACKS[picks.length]);
  }

  const items: MustDoItem[] = picks.map((title, idx) => ({
    rank: idx + 1,
    title,
    category: inferMustDoCategory(title),
    description: `A top highlight of ${dest.name} — not to be missed on a ${nights}-night stay.`,
  }));

  // Spread around city center for items that have no real coords
  const cityCenter = getCityCoords(dest.name);
  if (cityCenter) {
    const needCoords = items.filter((i) => !i.location);
    const spread = spreadAroundCenter(cityCenter, needCoords.length);
    needCoords.forEach((item, idx) => {
      item.location = { name: dest.name, lat: spread[idx].lat, lng: spread[idx].lng };
    });
  }

  return items;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adaptRain(rain: "low" | "medium" | "high"): "dry" | "mixed" | "wet" {
  if (rain === "low") return "dry";
  if (rain === "high") return "wet";
  return "mixed";
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function inferTimeOfDay(
  activity: string,
  index: number
): "morning" | "afternoon" | "evening" {
  const lower = activity.toLowerCase();
  if (lower.startsWith("morning")) return "morning";
  if (lower.startsWith("afternoon")) return "afternoon";
  if (lower.startsWith("evening") || lower.startsWith("night")) return "evening";
  return index === 0 ? "morning" : index === 1 ? "afternoon" : "evening";
}

function stripTimePrefix(str: string): string {
  return str.replace(/^(morning|afternoon|evening|night)\s*:?\s*/i, "").trim();
}

// ─── Good to Know defaults ────────────────────────────────────────────────────

type GoodToKnow = TripDetail["goodToKnow"];

const COUNTRY_INFO: Record<string, GoodToKnow> = {
  portugal: {
    currency: "EUR (€)",
    language: "Portuguese (English widely spoken in tourist areas)",
    plugType: "Type F (European standard — same plug as Czech Republic)",
    timezone: "WEST (UTC+1 in summer — same as Prague, no adjustment needed)",
    emergencyNumber: "112",
    bestSimCard: "NOS or Vodafone PT",
    tippingCustom: "Round up or 10% in sit-down restaurants",
  },
  spain: {
    currency: "EUR (€)",
    language: "Spanish (English spoken in tourist areas)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Movistar or Vodafone ES",
    tippingCustom: "Round up or 10% in restaurants, not expected at bars",
  },
  france: {
    currency: "EUR (€)",
    language: "French (English variable — better in Paris, less so in rural areas)",
    plugType: "Type E/F (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Orange or SFR",
    tippingCustom: "Service included by law — extra tip optional but appreciated",
  },
  italy: {
    currency: "EUR (€)",
    language: "Italian (English common in tourist spots, less so in south)",
    plugType: "Type F/L (Type L Italian plug — most Type F devices work fine)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "TIM or Vodafone IT",
    tippingCustom: "€1–2/person in restaurants; coperto (cover charge) is normal",
  },
  greece: {
    currency: "EUR (€)",
    language: "Greek (English widely spoken in tourist areas and islands)",
    plugType: "Type F/C (European standard)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Cosmote",
    tippingCustom: "5–10% in restaurants; round up for taxis",
  },
  croatia: {
    currency: "EUR (€)",
    language: "Croatian (English widely spoken, especially on coast)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "HT or A1 Croatia",
    tippingCustom: "10% in restaurants; round up for taxis",
  },
  "czech republic": {
    currency: "CZK (Kč) — cards widely accepted",
    language: "Czech (English common in Prague, less so outside)",
    plugType: "Type E/F (European standard)",
    timezone: "CET (UTC+2 in summer — same as Prague)",
    emergencyNumber: "112",
    bestSimCard: "T-Mobile or O2 CZ",
    tippingCustom: "Round up or 10% in Prague restaurants",
  },
  austria: {
    currency: "EUR (€)",
    language: "German (English widely spoken in Vienna and tourist areas)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "A1 or T-Mobile AT",
    tippingCustom: "5–10% in restaurants; round up for taxis",
  },
  germany: {
    currency: "EUR (€) — cash still widely preferred",
    language: "German (English spoken in cities, less so in rural areas)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Telekom or Vodafone DE",
    tippingCustom: "10% in restaurants; round up for taxis",
  },
  netherlands: {
    currency: "EUR (€)",
    language: "Dutch (English spoken almost everywhere)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "KPN or T-Mobile NL",
    tippingCustom: "Round up or 10%; not obligatory",
  },
  belgium: {
    currency: "EUR (€)",
    language: "Dutch/French/German (English widely spoken in Brussels)",
    plugType: "Type E/F (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Proximus or Orange BE",
  },
  switzerland: {
    currency: "CHF (Fr) — cards accepted almost everywhere",
    language: "German/French/Italian (English widely spoken)",
    plugType: "Type J (Swiss-specific — bring a Type J adapter)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Swisscom",
    tippingCustom: "Not expected — service included by custom",
  },
  turkey: {
    currency: "TRY (₺) — carry some cash for bazaars and small restaurants",
    language: "Turkish (English in tourist areas, limited elsewhere)",
    plugType: "Type F/C (European standard)",
    timezone: "TRT (UTC+3 year-round — 2h ahead of Prague in summer)",
    emergencyNumber: "112",
    bestSimCard: "Turkcell (best coverage across Turkey)",
    tippingCustom: "10% in restaurants; small tip for tour guides",
  },
  hungary: {
    currency: "HUF (Ft) — cards widely accepted in Budapest",
    language: "Hungarian (English common in Budapest, rare outside)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Telekom HU or Telenor HU",
    tippingCustom: "10% in restaurants — expected, not optional",
  },
  poland: {
    currency: "PLN (zł) — cards widely accepted",
    language: "Polish (English in Warsaw/Kraków, less so elsewhere)",
    plugType: "Type F/E (European standard)",
    timezone: "CET (UTC+2 in summer — same as Prague)",
    emergencyNumber: "112",
    bestSimCard: "Orange PL or Play",
    tippingCustom: "10–15% in restaurants",
  },
  romania: {
    currency: "RON (lei) — cards in cities; cash for rural areas",
    language: "Romanian (English in Bucharest and tourist towns)",
    plugType: "Type F/C (European standard)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Orange RO or Vodafone RO",
    tippingCustom: "10% in restaurants",
  },
  bulgaria: {
    currency: "BGN (lv) — not EUR, but widely accepted cards",
    language: "Bulgarian (English in Sofia and Black Sea resorts)",
    plugType: "Type F/C (European standard)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "A1 BG or Telenor BG",
    tippingCustom: "10% in restaurants",
  },
  slovenia: {
    currency: "EUR (€)",
    language: "Slovenian (English widely spoken)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "A1 SI",
    tippingCustom: "Round up or 10% — not mandatory",
  },
  slovakia: {
    currency: "EUR (€)",
    language: "Slovak (English in Bratislava, less elsewhere)",
    plugType: "Type F/E (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "O2 SK or Orange SK",
    tippingCustom: "10% in restaurants",
  },
  serbia: {
    currency: "RSD (din) — cards in cities; cash elsewhere",
    language: "Serbian (English in Belgrade and tourist spots)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "mts or A1 Serbia",
    tippingCustom: "10% in restaurants",
  },
  montenegro: {
    currency: "EUR (€) — though not an EU member",
    language: "Montenegrin (English in tourist coastal towns)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Crnogorski Telekom",
    tippingCustom: "Round up or 10%",
  },
  albania: {
    currency: "ALL (lek) — bring cash, cards limited outside Tirana",
    language: "Albanian (English in Tirana and Riviera, limited elsewhere)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Vodafone AL or Telekom AL",
    tippingCustom: "Not widely expected; round up is appreciated",
  },
  "north macedonia": {
    currency: "MKD (ден) — cards in cities; cash elsewhere",
    language: "Macedonian (English in Skopje and Ohrid)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "T-Mobile MK",
  },
  "bosnia and herzegovina": {
    currency: "BAM (KM) — cards in cities; cash useful",
    language: "Bosnian/Croatian/Serbian (English in Sarajevo/Mostar)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "m:tel or BH Telecom",
    tippingCustom: "10% in restaurants",
  },
  latvia: {
    currency: "EUR (€)",
    language: "Latvian (English widely spoken, especially in Riga)",
    plugType: "Type F/C (European standard)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "LMT or Tele2 LV",
    tippingCustom: "10% in restaurants",
  },
  lithuania: {
    currency: "EUR (€)",
    language: "Lithuanian (English common in Vilnius and Kaunas)",
    plugType: "Type F/C (European standard)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Telia LT or Tele2 LT",
    tippingCustom: "10–15% in restaurants",
  },
  sweden: {
    currency: "SEK (kr) — almost entirely cashless",
    language: "Swedish (English spoken near-universally)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Telia SE or Tre",
    tippingCustom: "Not expected — service included",
  },
  norway: {
    currency: "NOK (kr) — cashless society",
    language: "Norwegian (English spoken near-universally)",
    plugType: "Type F/C (European standard)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Telenor NO or Telia NO",
    tippingCustom: "Not expected",
  },
  denmark: {
    currency: "DKK (kr) — very cashless",
    language: "Danish (English spoken near-universally)",
    plugType: "Type F/K (Danish plug — Type K adapter needed)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "TDC or Telenor DK",
    tippingCustom: "Not expected",
  },
  iceland: {
    currency: "ISK (kr) — cashless; cards accepted everywhere",
    language: "Icelandic (English spoken near-universally)",
    plugType: "Type F/C (European standard)",
    timezone: "GMT (UTC+0 year-round — 1h behind Prague in summer)",
    emergencyNumber: "112",
    bestSimCard: "Síminn or Nova",
  },
  ireland: {
    currency: "EUR (€)",
    language: "English",
    plugType: "Type G (UK/Irish plug — bring a Type G adapter)",
    timezone: "IST (UTC+1 in summer — same as Prague)",
    emergencyNumber: "112 or 999",
    bestSimCard: "Three IE or Vodafone IE",
    tippingCustom: "10–15% in restaurants",
  },
  "united kingdom": {
    currency: "GBP (£)",
    language: "English",
    plugType: "Type G (UK plug — bring a Type G adapter)",
    timezone: "BST (UTC+1 in summer — same as Prague)",
    emergencyNumber: "999 or 112",
    bestSimCard: "EE or Vodafone UK",
    tippingCustom: "10–15% in restaurants; included in some",
  },
  malta: {
    currency: "EUR (€)",
    language: "Maltese & English (officially bilingual)",
    plugType: "Type G (UK-style plug — bring a Type G adapter)",
    timezone: "CET (UTC+2 in summer — 1h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Melita or GO",
    tippingCustom: "10% in restaurants",
  },
  cyprus: {
    currency: "EUR (€)",
    language: "Greek & English (widely bilingual in tourist areas)",
    plugType: "Type G (UK-style plug — bring a Type G adapter)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "CYTA",
    tippingCustom: "10% in restaurants",
  },
  finland: {
    currency: "EUR (€)",
    language: "Finnish/Swedish (English spoken near-universally)",
    plugType: "Type F/C (European standard)",
    timezone: "EET (UTC+3 in summer — 2h ahead of Prague)",
    emergencyNumber: "112",
    bestSimCard: "Elisa or Telia FI",
    tippingCustom: "Not expected",
  },
};

const DEFAULT_GOOD_TO_KNOW: GoodToKnow = {
  currency: "Check locally",
  language: "Check locally",
  plugType: "Type F (European standard — most common)",
  timezone: "Check locally",
  emergencyNumber: "112",
};

export function defaultGoodToKnow(country: string): GoodToKnow {
  const key = country.toLowerCase().trim();
  return COUNTRY_INFO[key] ?? DEFAULT_GOOD_TO_KNOW;
}
