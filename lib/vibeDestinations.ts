// Curated destination index for VibeSearch on the landing page. Content here
// is hand-picked, not throwaway seed data — the matcher uses it to give an
// instant client-side response while the user types. Trip generation itself
// is AI-driven and handles any place, so this list only needs to cover the
// destinations + vibes people actually type.
//
// Adding entries:
//   - tags drawn from CANONICAL_TAGS, 2–5 per entry, accurate
//   - short, honest one-line note (no prices)
//   - kind="region" for countries/sub-country regions, kind="city" otherwise
//   - countryCode + lat/lng included so we can construct a fully-formed
//     CitySelection (see @/components/shared/CityAutocomplete) without
//     hitting Photon during prefill

export const CANONICAL_TAGS = [
  "beach",
  "city",
  "warm",
  "cold",
  "cheap",
  "luxury",
  "mountain",
  "culture",
  "food",
  "party",
  "relax",
  "island",
  "wine",
  "nature",
  "romantic",
  "adventure",
  "family",
] as const;

export type CanonicalTag = (typeof CANONICAL_TAGS)[number];

// Curated Unsplash photo for the VibeSearch suggestion thumbnail. The URL
// is the raw `images.unsplash.com/photo-...` form WITHOUT resize params —
// the consumer (VibeSearch card) appends `?w=...&h=...&fit=crop&q=80` so
// the same source can be reused at different sizes. Credit is stored even
// though Unsplash doesn't require attribution, so we can surface it later
// without a re-curation pass.
export interface DestinationImage {
  url: string;
  alt: string;
  credit?: {
    name: string;
    /** Unsplash photo page URL — `https://unsplash.com/photos/<id>`. */
    link: string;
  };
}

export interface VibeDestination {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  tags: CanonicalTag[];
  note: string;
  kind: "city" | "region";
  // Optional — destinations without a curated photo fall back to a letter
  // tile in the UI. Populate via scripts/fetchDestinationPhotos.ts.
  image?: DestinationImage;
}

// ─── Destinations ────────────────────────────────────────────────────────────
// Roughly geographically grouped so additions are easy to slot in by region.

const CITIES: ReadonlyArray<VibeDestination> = [
  // Western & Northern Europe
  { city: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522, tags: ["city", "food", "culture", "romantic"], note: "Cafés, museums, and the most-walked riverfront in Europe.", kind: "city" },
  { city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278, tags: ["city", "culture", "food"], note: "Endless museums, neighborhood pubs, and theatre seven nights a week.", kind: "city" },
  { city: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lng: 4.9041, tags: ["city", "culture", "party"], note: "Canals, bikes, and a museum scene that punches above its weight.", kind: "city" },
  { city: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lng: 13.405, tags: ["city", "party", "culture", "cheap"], note: "Layered history, cheap rent, and the best techno on the continent.", kind: "city" },
  { city: "Munich", country: "Germany", countryCode: "DE", lat: 48.1351, lng: 11.582, tags: ["city", "food", "culture"], note: "Beer halls, Alpine day-trips, and a city that runs on schedule.", kind: "city" },
  { city: "Vienna", country: "Austria", countryCode: "AT", lat: 48.2082, lng: 16.3738, tags: ["city", "culture", "food", "romantic"], note: "Imperial palaces, coffeehouses, and a classical-music calendar.", kind: "city" },
  { city: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.6761, lng: 12.5683, tags: ["city", "food", "culture"], note: "Design-forward, bike-first, with one of the world's best food scenes.", kind: "city" },
  { city: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.3293, lng: 18.0686, tags: ["city", "cold", "culture", "food"], note: "An archipelago city — water everywhere and long summer evenings.", kind: "city" },
  { city: "Oslo", country: "Norway", countryCode: "NO", lat: 59.9139, lng: 10.7522, tags: ["city", "cold", "nature", "culture"], note: "Fjord on one side, forest on the other, sleek city in between.", kind: "city" },
  { city: "Dublin", country: "Ireland", countryCode: "IE", lat: 53.3498, lng: -6.2603, tags: ["city", "culture", "food"], note: "Literary pubs and weekend trips into staggering green countryside.", kind: "city" },
  { city: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.9533, lng: -3.1883, tags: ["city", "culture", "cold"], note: "Old-stone streets and a castle on a hill — magic in the right weather.", kind: "city" },

  // Southern Europe
  { city: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7223, lng: -9.1393, tags: ["beach", "city", "warm", "food"], note: "Tiled hills, ocean light, and pastéis de nata on every corner.", kind: "city" },
  { city: "Porto", country: "Portugal", countryCode: "PT", lat: 41.1579, lng: -8.6291, tags: ["city", "cheap", "food", "wine"], note: "River-bend port cellars, tiled facades, seafood for the price of a coffee.", kind: "city" },
  { city: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lng: -3.7038, tags: ["city", "food", "culture", "party"], note: "Tapas crawls, late dinners, and the Prado.", kind: "city" },
  { city: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3851, lng: 2.1734, tags: ["city", "beach", "party", "food", "culture"], note: "Gaudí, tapas, and a city beach you can walk to.", kind: "city" },
  { city: "Seville", country: "Spain", countryCode: "ES", lat: 37.3886, lng: -5.9823, tags: ["city", "culture", "warm", "food"], note: "Flamenco, tapas, and Moorish architecture under endless sun.", kind: "city" },
  { city: "Granada", country: "Spain", countryCode: "ES", lat: 37.1773, lng: -3.5986, tags: ["city", "culture", "cheap"], note: "The Alhambra, free tapas with every drink, and Sierra Nevada views.", kind: "city" },
  { city: "Valencia", country: "Spain", countryCode: "ES", lat: 39.4699, lng: -0.3763, tags: ["beach", "city", "warm", "food"], note: "Paella's hometown — sun, futurist architecture, and an easy beach.", kind: "city" },
  { city: "Palma de Mallorca", country: "Spain", countryCode: "ES", lat: 39.5696, lng: 2.6502, tags: ["beach", "island", "warm", "relax"], note: "Sandstone old town surrounded by Med beaches and hidden coves.", kind: "city" },
  { city: "Ibiza", country: "Spain", countryCode: "ES", lat: 38.9067, lng: 1.4206, tags: ["island", "beach", "party", "warm"], note: "World-class clubs by night, hidden coves by day.", kind: "city" },
  { city: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lng: 12.4964, tags: ["city", "culture", "food", "romantic"], note: "Walk between empires, then eat carbonara in a 400-year-old room.", kind: "city" },
  { city: "Florence", country: "Italy", countryCode: "IT", lat: 43.7696, lng: 11.2558, tags: ["city", "culture", "food", "wine", "romantic"], note: "Renaissance compressed into walking distance.", kind: "city" },
  { city: "Venice", country: "Italy", countryCode: "IT", lat: 45.4408, lng: 12.3155, tags: ["city", "culture", "romantic"], note: "No cars, just canals and rituals — go in shoulder season.", kind: "city" },
  { city: "Naples", country: "Italy", countryCode: "IT", lat: 40.8518, lng: 14.2681, tags: ["city", "food", "culture", "cheap"], note: "Birthplace of pizza, gateway to Pompeii and the Amalfi Coast.", kind: "city" },
  { city: "Milan", country: "Italy", countryCode: "IT", lat: 45.4642, lng: 9.19, tags: ["city", "food", "luxury", "culture"], note: "Design, fashion, and aperitivo at sunset.", kind: "city" },
  { city: "Nice", country: "France", countryCode: "FR", lat: 43.7102, lng: 7.262, tags: ["beach", "city", "warm", "romantic"], note: "French Riviera base — easy hops to Monaco, Cannes, and Antibes.", kind: "city" },
  { city: "Athens", country: "Greece", countryCode: "GR", lat: 37.9838, lng: 23.7275, tags: ["city", "culture", "warm", "beach"], note: "Acropolis sunsets and an Aegean coast 20 minutes from the centre.", kind: "city" },
  { city: "Santorini", country: "Greece", countryCode: "GR", lat: 36.3932, lng: 25.4615, tags: ["island", "beach", "romantic", "luxury", "warm"], note: "Cliff-top caldera views — every postcard you've seen is real.", kind: "city" },
  { city: "Mykonos", country: "Greece", countryCode: "GR", lat: 37.4467, lng: 25.3289, tags: ["island", "beach", "party", "luxury", "warm"], note: "Whitewashed alleys, beach clubs, and serious nightlife.", kind: "city" },
  { city: "Crete", country: "Greece", countryCode: "GR", lat: 35.2401, lng: 24.8093, tags: ["island", "beach", "culture", "warm", "food"], note: "Big enough for ruins, gorges, fishing villages, and great beaches.", kind: "city" },
  { city: "Split", country: "Croatia", countryCode: "HR", lat: 43.5081, lng: 16.4402, tags: ["beach", "island", "warm", "relax"], note: "Roman ruins fronting the Adriatic — ferry to a different island each day.", kind: "city" },
  { city: "Dubrovnik", country: "Croatia", countryCode: "HR", lat: 42.6507, lng: 18.0944, tags: ["city", "beach", "culture", "warm"], note: "Walled old town over the Adriatic — go early or go off-season.", kind: "city" },

  // Eastern Europe
  { city: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.0755, lng: 14.4378, tags: ["city", "cheap", "culture", "party"], note: "Fairy-tale skyline, cheap pints, deep history.", kind: "city" },
  { city: "Kraków", country: "Poland", countryCode: "PL", lat: 50.0647, lng: 19.945, tags: ["city", "cheap", "culture"], note: "Medieval old town, deep history, and one of Europe's softest price tags.", kind: "city" },
  { city: "Budapest", country: "Hungary", countryCode: "HU", lat: 47.4979, lng: 19.0402, tags: ["city", "cheap", "party", "culture"], note: "Thermal baths by day, ruin bars by night.", kind: "city" },
  { city: "Tallinn", country: "Estonia", countryCode: "EE", lat: 59.437, lng: 24.7536, tags: ["city", "cheap", "culture", "cold"], note: "A small medieval capital that still feels undiscovered.", kind: "city" },

  // Alps & winter
  { city: "Innsbruck", country: "Austria", countryCode: "AT", lat: 47.2692, lng: 11.4041, tags: ["mountain", "relax", "nature"], note: "Alps right out the train station window. Hike or ski straight from town.", kind: "city" },
  { city: "Chamonix", country: "France", countryCode: "FR", lat: 45.9237, lng: 6.8694, tags: ["mountain", "adventure", "cold"], note: "Mont Blanc at the doorstep — serious peaks for serious walkers.", kind: "city" },
  { city: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.3769, lng: 8.5417, tags: ["city", "mountain", "luxury", "nature"], note: "Lake-edge city with quick train access to the high Alps.", kind: "city" },

  // North Africa & Middle East
  { city: "Marrakech", country: "Morocco", countryCode: "MA", lat: 31.6295, lng: -7.9811, tags: ["warm", "culture", "food", "adventure"], note: "Souks, riads, and tagine slow-cooked over charcoal.", kind: "city" },
  { city: "Fes", country: "Morocco", countryCode: "MA", lat: 34.0181, lng: -5.0078, tags: ["culture", "warm", "food", "cheap"], note: "The world's largest car-free medieval medina.", kind: "city" },
  { city: "Casablanca", country: "Morocco", countryCode: "MA", lat: 33.5731, lng: -7.5898, tags: ["city", "warm", "food", "culture"], note: "Coastal art-deco port with North Africa's largest mosque.", kind: "city" },
  { city: "Cairo", country: "Egypt", countryCode: "EG", lat: 30.0444, lng: 31.2357, tags: ["city", "culture", "warm", "food"], note: "Pyramids on the city edge and the Nile running through it.", kind: "city" },
  { city: "Istanbul", country: "Turkey", countryCode: "TR", lat: 41.0082, lng: 28.9784, tags: ["city", "culture", "food"], note: "Two continents, layered empires, and a food scene that goes all day.", kind: "city" },
  { city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708, tags: ["city", "warm", "luxury", "beach"], note: "Sci-fi skyline, desert at the edge, beach clubs in between.", kind: "city" },
  { city: "Petra", country: "Jordan", countryCode: "JO", lat: 30.3285, lng: 35.4444, tags: ["culture", "adventure", "warm", "nature"], note: "A 2,000-year-old city carved straight into the rock.", kind: "city" },
  { city: "Tel Aviv", country: "Israel", countryCode: "IL", lat: 32.0853, lng: 34.7818, tags: ["city", "beach", "warm", "party", "food"], note: "Bauhaus, beach, and one of the Med's loosest nightlife scenes.", kind: "city" },

  // North America
  { city: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.006, tags: ["city", "food", "culture", "party"], note: "Every cuisine, every show, every neighborhood — turn it up.", kind: "city" },
  { city: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lng: -122.4194, tags: ["city", "food", "culture", "nature"], note: "Fog, hills, and weekend escapes into redwoods or wine country.", kind: "city" },
  { city: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lng: -118.2437, tags: ["city", "warm", "beach", "party"], note: "Sprawling, sun-drenched, and built for road trips.", kind: "city" },
  { city: "Las Vegas", country: "United States", countryCode: "US", lat: 36.1699, lng: -115.1398, tags: ["city", "party", "warm", "luxury"], note: "Strip nights, desert days, and red-rock canyons 30 minutes out.", kind: "city" },
  { city: "New Orleans", country: "United States", countryCode: "US", lat: 29.9511, lng: -90.0715, tags: ["city", "food", "culture", "party"], note: "Brass bands, beignets, and a calendar of festivals.", kind: "city" },
  { city: "Miami", country: "United States", countryCode: "US", lat: 25.7617, lng: -80.1918, tags: ["city", "beach", "warm", "party"], note: "Art deco, Latin food, and beach clubs that run all weekend.", kind: "city" },
  { city: "Nashville", country: "United States", countryCode: "US", lat: 36.1627, lng: -86.7816, tags: ["city", "food", "party", "culture"], note: "Live music every night, hot chicken every afternoon.", kind: "city" },
  { city: "Austin", country: "United States", countryCode: "US", lat: 30.2672, lng: -97.7431, tags: ["city", "food", "party", "warm"], note: "Tacos, BBQ, live music, and a swimming hole through the middle of town.", kind: "city" },
  { city: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lng: -87.6298, tags: ["city", "food", "culture"], note: "Skyline, lakefront, and the Midwest's best dining city.", kind: "city" },
  { city: "Honolulu", country: "United States", countryCode: "US", lat: 21.3069, lng: -157.8583, tags: ["beach", "warm", "island", "relax", "family"], note: "Waikiki, hikes to lava ridges, and big-island day trips.", kind: "city" },
  { city: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lng: -123.1207, tags: ["city", "mountain", "nature", "food"], note: "Ski in the morning, sushi by the harbor at night.", kind: "city" },
  { city: "Banff", country: "Canada", countryCode: "CA", lat: 51.1784, lng: -115.5708, tags: ["mountain", "relax", "nature"], note: "Glacier lakes, hot springs, and quiet trails through the Rockies.", kind: "city" },
  { city: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5017, lng: -73.5673, tags: ["city", "food", "culture", "cold"], note: "European old town, French food, hard winters and great festivals.", kind: "city" },

  // Latin America & Caribbean
  { city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.4326, lng: -99.1332, tags: ["city", "food", "culture", "cheap"], note: "The continent's food capital, with museums and parks to match.", kind: "city" },
  { city: "Oaxaca", country: "Mexico", countryCode: "MX", lat: 17.0732, lng: -96.7266, tags: ["culture", "food", "cheap", "warm"], note: "Mole, mezcal, and craft markets in a colonial mountain town.", kind: "city" },
  { city: "Tulum", country: "Mexico", countryCode: "MX", lat: 20.211, lng: -87.4654, tags: ["beach", "warm", "relax", "romantic"], note: "Cenotes, jungle, and a long stretch of white sand.", kind: "city" },
  { city: "Cartagena", country: "Colombia", countryCode: "CO", lat: 10.3910, lng: -75.4794, tags: ["city", "beach", "warm", "culture", "romantic"], note: "Walled Caribbean old town soaked in color and music.", kind: "city" },
  { city: "Buenos Aires", country: "Argentina", countryCode: "AR", lat: -34.6037, lng: -58.3816, tags: ["city", "food", "culture", "party", "wine"], note: "Steak, tango, and neighborhoods that go all night.", kind: "city" },
  { city: "Rio de Janeiro", country: "Brazil", countryCode: "BR", lat: -22.9068, lng: -43.1729, tags: ["city", "beach", "warm", "party"], note: "Mountains, beaches, and a city that lives outside.", kind: "city" },
  { city: "Cusco", country: "Peru", countryCode: "PE", lat: -13.5319, lng: -71.9675, tags: ["mountain", "culture", "adventure"], note: "Andean base camp — the gateway to Machu Picchu.", kind: "city" },
  { city: "Havana", country: "Cuba", countryCode: "CU", lat: 23.1136, lng: -82.3666, tags: ["city", "warm", "culture", "party"], note: "Vintage cars, live music, and crumbling-but-beautiful streets.", kind: "city" },

  // South Asia
  { city: "Mumbai", country: "India", countryCode: "IN", lat: 19.076, lng: 72.8777, tags: ["city", "food", "culture", "cheap"], note: "Colonial-era architecture, Bollywood, and India's best street food.", kind: "city" },
  { city: "Jaipur", country: "India", countryCode: "IN", lat: 26.9124, lng: 75.7873, tags: ["city", "culture", "warm", "cheap"], note: "Pink City — palaces, forts, and bazaars in the heart of Rajasthan.", kind: "city" },
  { city: "Goa", country: "India", countryCode: "IN", lat: 15.2993, lng: 74.124, tags: ["beach", "warm", "party", "cheap", "relax"], note: "Portuguese-tinged beach state — easy living, easy prices.", kind: "city" },

  // Southeast Asia
  { city: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lng: 100.5018, tags: ["city", "cheap", "warm", "food", "party"], note: "Street food, river boats, and rooftop bars that go all night.", kind: "city" },
  { city: "Chiang Mai", country: "Thailand", countryCode: "TH", lat: 18.7883, lng: 98.9853, tags: ["culture", "cheap", "nature", "food", "relax"], note: "Temples, cooking classes, and jungle just outside town.", kind: "city" },
  { city: "Phuket", country: "Thailand", countryCode: "TH", lat: 7.8804, lng: 98.3923, tags: ["beach", "island", "warm", "party", "relax"], note: "Long beaches, longtail boats, and easy island-hopping.", kind: "city" },
  { city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lng: 103.8198, tags: ["city", "food", "luxury", "family"], note: "Hawker centres, sci-fi skyline, and the cleanest streets you'll ever see.", kind: "city" },
  { city: "Hanoi", country: "Vietnam", countryCode: "VN", lat: 21.0285, lng: 105.8542, tags: ["city", "food", "culture", "cheap"], note: "Old quarter, pho on every corner, and weekend escapes to Ha Long Bay.", kind: "city" },
  { city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", lat: 10.8231, lng: 106.6297, tags: ["city", "food", "cheap", "party"], note: "Motorbike chaos and the best banh mi on earth.", kind: "city" },
  { city: "Siem Reap", country: "Cambodia", countryCode: "KH", lat: 13.3671, lng: 103.8448, tags: ["culture", "warm", "cheap", "adventure"], note: "Base camp for Angkor — sunrise temples, dusty back roads.", kind: "city" },
  { city: "Ubud", country: "Indonesia", countryCode: "ID", lat: -8.5069, lng: 115.2625, tags: ["nature", "relax", "warm", "romantic", "culture"], note: "Rice terraces, yoga retreats, and jungle temples.", kind: "city" },
  { city: "Kuala Lumpur", country: "Malaysia", countryCode: "MY", lat: 3.139, lng: 101.6869, tags: ["city", "food", "cheap", "warm"], note: "Hawker food, modern skyline, jungle inside the city limits.", kind: "city" },

  // East Asia
  { city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lng: 139.6503, tags: ["city", "food", "culture", "party"], note: "Neon, shrines, and the deepest food scene on earth.", kind: "city" },
  { city: "Kyoto", country: "Japan", countryCode: "JP", lat: 35.0116, lng: 135.7681, tags: ["culture", "food", "romantic"], note: "Temples, tea houses, and bamboo groves — old Japan, walkable.", kind: "city" },
  { city: "Osaka", country: "Japan", countryCode: "JP", lat: 34.6937, lng: 135.5023, tags: ["city", "food", "party"], note: "Japan's food capital, less polished and more fun than Tokyo.", kind: "city" },
  { city: "Seoul", country: "South Korea", countryCode: "KR", lat: 37.5665, lng: 126.978, tags: ["city", "food", "culture", "party"], note: "Palaces, BBQ, all-night neighborhoods, the works.", kind: "city" },
  { city: "Hong Kong", country: "Hong Kong", countryCode: "HK", lat: 22.3193, lng: 114.1694, tags: ["city", "food", "luxury"], note: "Skyline, dim sum, and a hike to a beach all in one day.", kind: "city" },
  { city: "Taipei", country: "Taiwan", countryCode: "TW", lat: 25.033, lng: 121.5654, tags: ["city", "food", "culture", "cheap"], note: "Night markets, hot springs, and mountain trails on the city edge.", kind: "city" },

  // Oceania
  { city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lng: 151.2093, tags: ["city", "beach", "food", "warm"], note: "Harbor city with surf beaches inside the city limits.", kind: "city" },
  { city: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lng: 144.9631, tags: ["city", "food", "culture", "wine"], note: "Coffee culture, laneway bars, and Australia's best dining.", kind: "city" },
  { city: "Queenstown", country: "New Zealand", countryCode: "NZ", lat: -45.0312, lng: 168.6626, tags: ["mountain", "adventure", "nature"], note: "Lake-and-mountain town — bungee, ski, hike, repeat.", kind: "city" },
  { city: "Auckland", country: "New Zealand", countryCode: "NZ", lat: -36.8485, lng: 174.7633, tags: ["city", "nature", "beach"], note: "Island-dotted harbour and an easy launchpad for the rest of NZ.", kind: "city" },

  // Africa
  { city: "Cape Town", country: "South Africa", countryCode: "ZA", lat: -33.9249, lng: 18.4241, tags: ["city", "beach", "nature", "food", "wine"], note: "Table Mountain, penguin beaches, and Cape vineyards.", kind: "city" },
  { city: "Zanzibar", country: "Tanzania", countryCode: "TZ", lat: -6.1659, lng: 39.2026, tags: ["island", "beach", "warm", "relax"], note: "Spice island — white sand, dhows, and old-town alleys.", kind: "city" },
  { city: "Nairobi", country: "Kenya", countryCode: "KE", lat: -1.2921, lng: 36.8219, tags: ["city", "nature", "adventure"], note: "Gateway to safari country, with a wildlife park inside the city.", kind: "city" },

  // High latitudes
  { city: "Reykjavík", country: "Iceland", countryCode: "IS", lat: 64.1466, lng: -21.9426, tags: ["relax", "nature", "cold"], note: "Geothermal pools, raw landscape, and aurora season from late autumn.", kind: "city" },
];

const REGIONS: ReadonlyArray<VibeDestination> = [
  { city: "Portugal", country: "Portugal", countryCode: "PT", lat: 39.3999, lng: -8.2245, tags: ["beach", "food", "wine", "cheap"], note: "Sun, surf, port, pastel-de-nata — value-packed at every turn.", kind: "region" },
  { city: "Spain", country: "Spain", countryCode: "ES", lat: 40.4637, lng: -3.7492, tags: ["beach", "food", "wine", "culture", "warm"], note: "Coast, city, hill towns, every regional cuisine you can name.", kind: "region" },
  { city: "Italy", country: "Italy", countryCode: "IT", lat: 41.8719, lng: 12.5674, tags: ["food", "wine", "culture", "romantic"], note: "Endless regional cooking, art on every wall, coast and Alps both.", kind: "region" },
  { city: "France", country: "France", countryCode: "FR", lat: 46.2276, lng: 2.2137, tags: ["city", "food", "wine", "romantic", "culture"], note: "Paris and everything beyond — wine country, Alps, Riviera.", kind: "region" },
  { city: "Greece", country: "Greece", countryCode: "GR", lat: 39.0742, lng: 21.8243, tags: ["island", "beach", "culture", "warm", "food"], note: "Mainland ruins and 200+ islands to ferry between.", kind: "region" },
  { city: "Croatia", country: "Croatia", countryCode: "HR", lat: 45.1, lng: 15.2, tags: ["beach", "island", "culture", "warm"], note: "Crystalline Adriatic, walled old towns, ferries between them.", kind: "region" },
  { city: "Morocco", country: "Morocco", countryCode: "MA", lat: 31.7917, lng: -7.0926, tags: ["warm", "culture", "food", "adventure"], note: "Medinas, mountains, and the Sahara — all reachable in one trip.", kind: "region" },
  { city: "Japan", country: "Japan", countryCode: "JP", lat: 36.2048, lng: 138.2529, tags: ["culture", "food", "city"], note: "Old temples, neon cities, mountain ryokans — rail tickets bind it all.", kind: "region" },
  { city: "Thailand", country: "Thailand", countryCode: "TH", lat: 15.87, lng: 100.9925, tags: ["beach", "warm", "cheap", "food", "island"], note: "Bangkok, north-country temples, and a south coast of beaches.", kind: "region" },
  { city: "Vietnam", country: "Vietnam", countryCode: "VN", lat: 14.0583, lng: 108.2772, tags: ["food", "cheap", "culture", "beach"], note: "North-to-south rail run: Hanoi, Hoi An, Saigon, Mekong Delta.", kind: "region" },
  { city: "Iceland", country: "Iceland", countryCode: "IS", lat: 64.9631, lng: -19.0208, tags: ["nature", "cold", "relax", "adventure"], note: "Drive the Ring Road for waterfalls, glaciers, hot springs.", kind: "region" },
  { city: "Bali", country: "Indonesia", countryCode: "ID", lat: -8.3405, lng: 115.092, tags: ["island", "beach", "warm", "relax", "romantic"], note: "Surf coasts, jungle interior, temples, and serious value.", kind: "region" },
  { city: "Algarve", country: "Portugal", countryCode: "PT", lat: 37.0194, lng: -7.9322, tags: ["beach", "warm", "relax", "family"], note: "Portugal's south coast — cliffs, golden sand, easy seafood towns.", kind: "region" },
  { city: "Tuscany", country: "Italy", countryCode: "IT", lat: 43.7711, lng: 11.2486, tags: ["wine", "food", "romantic", "culture"], note: "Hill towns, cypress roads, Chianti, and Florence at the centre.", kind: "region" },
  { city: "Andalusia", country: "Spain", countryCode: "ES", lat: 37.5443, lng: -4.7278, tags: ["warm", "culture", "food", "beach"], note: "Southern Spain — Moorish architecture, flamenco, beach access.", kind: "region" },
];

export const VIBE_DESTINATIONS: ReadonlyArray<VibeDestination> = [
  ...CITIES,
  ...REGIONS,
];

// ─── Synonyms ────────────────────────────────────────────────────────────────
// One typed token can map to multiple canonical tags. "hiking" naturally
// implies mountain + nature + adventure — narrowing it to one would lose
// the spirit of the query. Tokens are lowercased + diacritic-stripped
// before lookup, so the keys here should be in that form.

export const SYNONYM_MAP: Readonly<
  Record<string, ReadonlyArray<CanonicalTag>>
> = {
  // beach
  beach: ["beach"],
  beaches: ["beach"],
  ocean: ["beach"],
  sea: ["beach"],
  coast: ["beach"],
  coastal: ["beach"],
  seaside: ["beach"],
  shore: ["beach"],
  surf: ["beach", "adventure"],
  snorkel: ["beach", "island"],
  dive: ["beach", "island"],
  diving: ["beach", "island"],

  // city
  city: ["city"],
  cities: ["city"],
  urban: ["city"],
  metropolis: ["city"],
  weekend: ["city"],
  weekender: ["city"],
  town: ["city"],

  // warm
  warm: ["warm"],
  hot: ["warm"],
  sun: ["warm"],
  sunny: ["warm"],
  sunshine: ["warm"],
  tropical: ["warm"],
  heat: ["warm"],
  summer: ["warm"],

  // cold
  cold: ["cold"],
  snow: ["cold", "mountain"],
  snowy: ["cold", "mountain"],
  freezing: ["cold"],
  icy: ["cold"],
  nordic: ["cold"],
  polar: ["cold"],
  arctic: ["cold"],

  // cheap
  cheap: ["cheap"],
  affordable: ["cheap"],
  budget: ["cheap"],
  cheapish: ["cheap"],
  inexpensive: ["cheap"],
  thrifty: ["cheap"],

  // luxury
  luxury: ["luxury"],
  luxurious: ["luxury"],
  upscale: ["luxury"],
  fancy: ["luxury"],
  premium: ["luxury"],
  posh: ["luxury"],
  exclusive: ["luxury"],
  fivestar: ["luxury"],

  // mountain
  mountain: ["mountain"],
  mountains: ["mountain"],
  alps: ["mountain"],
  alpine: ["mountain"],
  hike: ["mountain", "nature", "adventure"],
  hiking: ["mountain", "nature", "adventure"],
  trek: ["mountain", "nature", "adventure"],
  trekking: ["mountain", "nature", "adventure"],
  ski: ["mountain", "cold"],
  skiing: ["mountain", "cold"],
  peaks: ["mountain"],
  peak: ["mountain"],
  summit: ["mountain"],

  // culture
  culture: ["culture"],
  cultural: ["culture"],
  history: ["culture"],
  historic: ["culture"],
  historical: ["culture"],
  museum: ["culture"],
  museums: ["culture"],
  art: ["culture"],
  ruins: ["culture"],
  ancient: ["culture"],
  heritage: ["culture"],
  temples: ["culture"],
  temple: ["culture"],

  // food
  food: ["food"],
  foodie: ["food"],
  cuisine: ["food"],
  eat: ["food"],
  eating: ["food"],
  restaurants: ["food"],
  culinary: ["food"],
  michelin: ["food", "luxury"],

  // party
  party: ["party"],
  nightlife: ["party"],
  clubs: ["party"],
  clubbing: ["party"],
  bars: ["party"],
  rave: ["party"],
  festival: ["party"],

  // relax
  relax: ["relax"],
  relaxing: ["relax"],
  calm: ["relax"],
  quiet: ["relax"],
  slow: ["relax"],
  reset: ["relax"],
  escape: ["relax"],
  chill: ["relax"],
  peaceful: ["relax"],
  retreat: ["relax"],
  recharge: ["relax"],
  unwind: ["relax"],
  spa: ["relax", "luxury"],
  yoga: ["relax"],

  // island
  island: ["island"],
  islands: ["island"],
  archipelago: ["island"],

  // wine
  wine: ["wine"],
  vineyard: ["wine", "nature"],
  vineyards: ["wine", "nature"],
  winery: ["wine"],

  // nature
  nature: ["nature"],
  wildlife: ["nature", "adventure"],
  outdoors: ["nature", "adventure"],
  forest: ["nature"],
  jungle: ["nature", "warm"],
  rainforest: ["nature", "warm"],
  scenic: ["nature"],
  lake: ["nature"],
  lakes: ["nature"],
  safari: ["nature", "adventure"],

  // romantic
  romantic: ["romantic"],
  romance: ["romantic"],
  honeymoon: ["romantic", "luxury"],
  couples: ["romantic"],
  couple: ["romantic"],
  anniversary: ["romantic"],

  // adventure
  adventure: ["adventure"],
  adventurous: ["adventure"],
  adrenaline: ["adventure"],
  rafting: ["adventure", "nature"],
  climbing: ["adventure", "mountain"],
  expedition: ["adventure"],
  bungee: ["adventure"],

  // family
  family: ["family"],
  kids: ["family"],
  child: ["family"],
  children: ["family"],
  familyfriendly: ["family"],
};

// Cities that show up under "Popular right now" when the input is empty.
// Order matters — this is the display order.
export const POPULAR_DESTINATIONS: ReadonlyArray<string> = [
  "Lisbon",
  "Tokyo",
  "Barcelona",
  "Kraków",
];

// ─── Matching ────────────────────────────────────────────────────────────────

export interface ScoredDestination {
  destination: VibeDestination;
  score: number;
  matchedTags: ReadonlySet<CanonicalTag>;
}

// Lowercase + strip diacritics. Used for BOTH the typed tokens and the
// city/country names being matched against, so "krakow" finds "Kraków" and
// "ubud" finds "Ubud" without a diacritic mismatch.
function strip(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function tokenize(query: string): string[] {
  return strip(query).split(/[^\p{Letter}]+/u).filter(Boolean);
}

// Pure scoring helper — testable in isolation, called from the component on
// every keystroke. Scoring:
//   +2 per matched canonical tag (deduped via Set so "beach beach" can't game)
//   +4 if a token (≥3 chars) substring-matches the city OR country name
//   +3 additional bonus if a token EQUALS the city name (region/city primary
//      identifier) — this is what keeps "japan" surfacing the Japan region
//      above Tokyo, while "tokyo" still surfaces Tokyo first.
export function scoreDestinations(query: string): ScoredDestination[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const requestedTags = new Set<CanonicalTag>();
  for (const t of tokens) {
    const tags = SYNONYM_MAP[t];
    if (!tags) continue;
    for (const tag of tags) requestedTags.add(tag);
  }

  const scored: ScoredDestination[] = [];
  for (const dest of VIBE_DESTINATIONS) {
    let score = 0;
    const matched = new Set<CanonicalTag>();

    for (const tag of dest.tags) {
      if (requestedTags.has(tag)) {
        score += 2;
        matched.add(tag);
      }
    }

    const cityStripped = strip(dest.city);
    const countryStripped = strip(dest.country);
    for (const t of tokens) {
      if (t.length < 3) continue;
      if (cityStripped.includes(t) || countryStripped.includes(t)) {
        score += 4;
      }
      // Exact-name bonus on the primary identifier only — country alone
      // shouldn't promote every Japanese city above the Japan region when
      // the user typed "japan".
      if (cityStripped === t) {
        score += 3;
      }
    }

    if (score > 0) {
      scored.push({ destination: dest, score, matchedTags: matched });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

export function getPopularDestinations(): VibeDestination[] {
  const byCity = new Map(VIBE_DESTINATIONS.map((d) => [d.city, d]));
  return POPULAR_DESTINATIONS.map((c) => byCity.get(c)).filter(
    (d): d is VibeDestination => Boolean(d),
  );
}

// ─── TripForm vibe mapping ───────────────────────────────────────────────────
// Maps a free-text query to TripForm's vibe enum so a VibeSearch prefill can
// set the wizard's vibe step. Only canonical tags with a clean TripForm
// equivalent are used — `warm`, `cheap`, `cold`, `luxury`, `food`, `relax`,
// `island`, `wine`, `nature`, `romantic`, `family` return null so the form
// keeps its default vibe.

export type TripFormVibe =
  | "beach"
  | "city"
  | "mountains"
  | "party"
  | "culture"
  | "adventure";

const TAG_TO_TRIPFORM_VIBE: Partial<Record<CanonicalTag, TripFormVibe>> = {
  beach: "beach",
  city: "city",
  mountain: "mountains",
  party: "party",
  culture: "culture",
  adventure: "adventure",
};

export function deriveTripFormVibe(query: string): TripFormVibe | null {
  const tokens = tokenize(query);
  for (const t of tokens) {
    const tags = SYNONYM_MAP[t];
    if (!tags) continue;
    for (const tag of tags) {
      const vibe = TAG_TO_TRIPFORM_VIBE[tag];
      if (vibe) return vibe;
    }
  }
  return null;
}
