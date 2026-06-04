import { getCityPhoto } from "@/lib/photos";
import { CreateProfileShowcaseInner } from "./CreateProfileShowcaseInner";
import type { APIDestination } from "@/lib/types";

// Hand-picked illustrative destinations for the landing-page "Create a
// profile" teaser. Real-looking enough to read as saved favorites; not
// backed by any trip in the database. Prices are EUR (the app's canonical
// currency) and run through FormattedPrice → CurrencyContext so the
// numbers respect the user's currency selection.
const SHOWCASE_DESTINATIONS = [
  {
    name: "Lagos",
    country: "Portugal",
    countryCode: "PT",
    tagline: "Romantic coastlines with charming old town vibe.",
    vibes: ["beach", "romantic", "culture"],
    // ~CZK 9,500 @ 25 CZK/EUR — the brief's starting suggestion.
    typicalEur: 380,
  },
  {
    name: "Cala Gonone",
    country: "Italy",
    countryCode: "IT",
    tagline: "Secluded beach paradise amidst rugged nature.",
    vibes: ["beach", "nature", "relax"],
    // ~CZK 5,000 @ 25 CZK/EUR.
    typicalEur: 200,
  },
  {
    name: "Paris",
    country: "France",
    countryCode: "FR",
    tagline: "City of love and iconic romance.",
    vibes: ["city", "romantic", "culture"],
    typicalEur: 450,
  },
  {
    name: "Krabi",
    country: "Thailand",
    countryCode: "TH",
    tagline: "Secluded beaches and limestone cliffs.",
    vibes: ["beach", "nature", "romantic"],
    typicalEur: 590,
  },
] as const;

// Stub fields the card never reads but APIDestination requires. Keeps the
// showcase rows type-safe against the live SavedDestinationCard signature
// without having to thread an optional/partial through the profile path.
function buildShowcaseDestination(
  d: (typeof SHOWCASE_DESTINATIONS)[number],
): APIDestination {
  return {
    id: `showcase-${d.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: d.name,
    country: d.country,
    countryCode: d.countryCode,
    tagline: d.tagline,
    description: "",
    vibes: [...d.vibes],
    weather: { tempC: 0, sunshineHours: 0, rain: "low" },
    estimates: {
      flightRange: { min: 0, max: 0, typical: 0 },
      hotelPerNightRange: { min: 0, max: 0, typical: 0 },
      foodPerDay: { budget: 0, midRange: 0 },
      activitiesPerDay: { budget: 0, midRange: 0 },
      localTransportPerDay: 0,
      totalEstimate: {
        min: d.typicalEur,
        max: d.typicalEur,
        typical: d.typicalEur,
      },
    },
    budgetFit: "fit",
    tips: [],
    trustedSources: { flights: [], hotels: [], activities: [], reviews: [] },
    confidence: "high",
    disclaimer: "",
  };
}

// Server async wrapper — fetches Pexels photos at request time the same
// way the real profile page does (lib/photos.ts → cached Pexels query),
// then hands typed rows to the client inner. Empty `photoUrl` falls back
// to the gradient header inside the card.
export async function CreateProfileShowcase() {
  const rows = await Promise.all(
    SHOWCASE_DESTINATIONS.map(async (d, i) => ({
      id: `showcase-${i}`,
      destination: buildShowcaseDestination(d),
      photoUrl: await getCityPhoto(d.name, d.country),
      created_at: new Date(0).toISOString(),
      resolvedTripId: null,
    })),
  );
  return <CreateProfileShowcaseInner rows={rows} />;
}
