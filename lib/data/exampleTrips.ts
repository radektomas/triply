import { bookingHotelUrl, skyscannerFlightUrl, getYourGuideUrl } from "@/lib/booking";
import { defaultGoodToKnow } from "@/lib/data/getTripDetail";
import type { TripDetail, BookingLink } from "@/lib/types/trip";

export interface ExampleTrip {
  detail: TripDetail;
  tips: string[];
}

const ORIGIN = "Prague";
const TRAVELERS = 2;
const CHECK_IN = "2026-06-15";
const CHECK_OUT = "2026-06-21";
const NIGHTS = 6;

function buildBooking(args: {
  city: string;
  country: string;
  hotelMaxNightly: number;
  fromOrigin: boolean;
}): TripDetail["booking"] {
  const flights: BookingLink[] = args.fromOrigin
    ? [
        {
          provider: "Skyscanner",
          url: skyscannerFlightUrl(ORIGIN, args.city, CHECK_IN, CHECK_OUT, TRAVELERS),
          primary: true,
        },
      ]
    : [];

  return {
    flights,
    hotels: [
      {
        provider: "Booking.com",
        url: bookingHotelUrl({
          city: args.city,
          country: args.country,
          checkIn: CHECK_IN,
          checkOut: CHECK_OUT,
          travelers: TRAVELERS,
          maxNightlyPrice: args.hotelMaxNightly,
        }),
        primary: true,
      },
    ],
    activities: [
      {
        provider: "GetYourGuide",
        url: getYourGuideUrl(args.city),
        primary: true,
      },
    ],
    reviews: [
      {
        provider: "TripAdvisor",
        url: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(`${args.city} ${args.country}`)}`,
      },
    ],
  };
}

// ─── Prague ──────────────────────────────────────────────────────────────────

const pragueDetail: TripDetail = {
  id: "example-prague",
  destination: "Prague",
  country: "Czech Republic",
  countryCode: "CZ",
  description:
    "Bohemia's spired capital, where centuries-old alleys spill into riverside beer halls and gothic skylines lean over a slow-bending Vltava.",
  vibes: ["city", "history", "culture"],
  weather: {
    temperature: 22,
    sunHours: 8,
    seaTemperature: 0,
    precipitation: "mixed",
    month: "June",
  },
  nights: NIGHTS,
  checkIn: CHECK_IN,
  checkOut: CHECK_OUT,
  budget: {
    total: 280,
    range: { min: 240, max: 320 },
    perPerson: true,
    travelers: TRAVELERS,
    breakdown: [
      {
        label: "Flights",
        icon: "✈️",
        amount: 0,
        perUnit: "Already in Prague — staycation",
        color: "#4A90E2",
        tips: ["Take the train to a nearby Bohemian town for a side trip"],
        typical: "Flights skipped",
      },
      {
        label: "Hotel",
        icon: "🏨",
        amount: 132,
        perUnit: "€22/night × 6",
        color: "#FF6B47",
        tips: ["Stay in Žižkov or Vinohrady for cheaper rooms 15 min from center", "Book a guesthouse, skip the chain hotels"],
        typical: "Boutique pension or shared studio",
      },
      {
        label: "Food",
        icon: "🍽️",
        amount: 90,
        perUnit: "€15/day × 6",
        color: "#0D7377",
        tips: ["Polední menu (lunch menu) is €5–8 with soup", "Beer is cheaper than water at most pubs"],
        typical: "Mix of taverns and one nice dinner",
      },
      {
        label: "Activities",
        icon: "🎭",
        amount: 38,
        perUnit: "€6/day × 6",
        color: "#F4A261",
        tips: ["Most viewpoints are free", "Castle grounds: free; interior tickets: 250 CZK"],
        typical: "1–2 paid sights, rest free",
      },
      {
        label: "Transport",
        icon: "🚌",
        amount: 20,
        perUnit: "€3.30/day × 6",
        color: "#8E7CC3",
        tips: ["3-day tram pass is €13", "Walk between Old Town and Malá Strana — it's nicer than the tram"],
        typical: "Trams + walking",
      },
    ],
  },
  mustDo: [
    {
      rank: 1,
      title: "Charles Bridge at sunrise",
      category: "landmark",
      description: "The 14th-century stone bridge is shoulder-to-shoulder by 10am. Cross at 6am for empty cobbles and morning mist over the Vltava.",
      location: { name: "Charles Bridge", lat: 50.0865, lng: 14.4114 },
      estimatedCost: "Free",
      estimatedTime: "30 min",
      tip: "The bronze plaque on the John of Nepomuk statue is rubbed shiny — locals touch it for luck.",
    },
    {
      rank: 2,
      title: "Prague Castle complex",
      category: "landmark",
      description: "St. Vitus Cathedral, the Old Royal Palace, and Golden Lane in one ticket. Largest ancient castle complex in the world by area.",
      location: { name: "Prague Castle", lat: 50.0907, lng: 14.4012 },
      estimatedCost: "€10–15",
      estimatedTime: "3h",
      tip: "Enter via the back gate from Strahov Monastery — skip the airport-style security at the main entrance.",
    },
    {
      rank: 3,
      title: "Old Town Square + Astronomical Clock",
      category: "landmark",
      description: "The 15th-century clock chimes hourly with a 30-second apostle parade. Underrated up close, overrated as a destination by itself.",
      location: { name: "Old Town Square", lat: 50.0875, lng: 14.4213 },
      estimatedCost: "Free",
      estimatedTime: "1h",
      tip: "Climb the Old Town Hall tower (€10) for a top-down view of the square — better than the clock parade itself.",
    },
    {
      rank: 4,
      title: "Vyšehrad ramparts at dusk",
      category: "viewpoint",
      description: "The 'other' castle. Quiet, free, with a clifftop walk over the Vltava and a romanesque rotunda. Where Praguers go when tourists take the city center.",
      location: { name: "Vyšehrad", lat: 50.0648, lng: 14.4194 },
      estimatedCost: "Free",
      estimatedTime: "2h",
      tip: "The cemetery holds Dvořák and Smetana — both with elaborate composer-themed graves.",
    },
    {
      rank: 5,
      title: "Lokál Dlouhááá for tank beer",
      category: "restaurant",
      description: "Czech pub food done seriously: Pilsner Urquell tanked unpasteurized, classic svíčková, schnitzel the size of a plate.",
      location: { name: "Lokál Dlouhááá", lat: 50.0904, lng: 14.4287 },
      estimatedCost: "€12–18",
      estimatedTime: "1.5h",
      tip: "Reserve. Order the tatarák (steak tartare) with toasted garlic bread.",
    },
  ],
  itinerary: [
    {
      day: 1,
      title: "Old Town arrival",
      estimatedCost: 35,
      activities: [
        { timeOfDay: "afternoon", title: "Drop bags, walk to Old Town Square" },
        { timeOfDay: "afternoon", title: "Coffee at Café Louvre — Kafka's old haunt" },
        { timeOfDay: "evening", title: "Sunset beer at Letná Beer Garden" },
      ],
    },
    {
      day: 2,
      title: "Castle district",
      estimatedCost: 55,
      activities: [
        { timeOfDay: "morning", title: "Prague Castle complex (3h)" },
        { timeOfDay: "afternoon", title: "Wander Malá Strana, lunch at Café Savoy" },
        { timeOfDay: "evening", title: "Petřín Hill tower at golden hour" },
      ],
    },
    {
      day: 3,
      title: "Vyšehrad + the river",
      estimatedCost: 30,
      activities: [
        { timeOfDay: "morning", title: "Vyšehrad ramparts walk" },
        { timeOfDay: "afternoon", title: "Náplavka riverside market (Sat) or boat rental" },
        { timeOfDay: "evening", title: "Dinner in Nusle — neighborhood that tourists miss" },
      ],
    },
    {
      day: 4,
      title: "Day trip — Kutná Hora",
      estimatedCost: 50,
      activities: [
        { timeOfDay: "morning", title: "Train to Kutná Hora (1h)" },
        { timeOfDay: "afternoon", title: "Sedlec Bone Church + St. Barbara's Cathedral" },
        { timeOfDay: "evening", title: "Train back, late dinner at Lokál Dlouhááá" },
      ],
    },
    {
      day: 5,
      title: "Žižkov + craft beer",
      estimatedCost: 40,
      activities: [
        { timeOfDay: "morning", title: "TV Tower — climb for the city's best 360° view" },
        { timeOfDay: "afternoon", title: "Craft beer crawl: Bad Flash → Beer Geek → U Vystřelenýho Oka" },
        { timeOfDay: "evening", title: "Late dinner at Eska — modern Czech tasting menu" },
      ],
    },
    {
      day: 6,
      title: "Letná + departure",
      estimatedCost: 20,
      activities: [
        { timeOfDay: "morning", title: "Letná Park — coffee with skyline view" },
        { timeOfDay: "morning", title: "Last walk across Charles Bridge" },
        { timeOfDay: "afternoon", title: "Airport / train" },
      ],
    },
  ],
  localWisdom: [],
  goodToKnow: defaultGoodToKnow("Czech Republic"),
  whatToPack: [],
  booking: buildBooking({
    city: "Prague",
    country: "Czech Republic",
    hotelMaxNightly: 30,
    fromOrigin: false,
  }),
  photos: [],
};

const pragueTips = [
  "Tipping in Prague: round up or 10% in restaurants, expected at sit-down places.",
  "Tap water is excellent — skip the bottled stuff.",
  "Avoid taxis hailed on the street — use Bolt or Liftago apps instead.",
  "Crown (Kč) is the local currency, but most places accept cards. Carry €20 cash for markets and small bars.",
  "Prague's metro shuts at midnight — night trams (every 30 min) run all night and are safe.",
];

// ─── Algarve ─────────────────────────────────────────────────────────────────

const algarveDetail: TripDetail = {
  id: "example-algarve",
  destination: "Algarve",
  country: "Portugal",
  countryCode: "PT",
  description:
    "Portugal's golden cliff coast — limestone arches, sea caves carved by the Atlantic, and slow seafood lunches that bleed into wine-soaked sunsets.",
  vibes: ["beach", "nature", "relax"],
  weather: {
    temperature: 25,
    sunHours: 11,
    seaTemperature: 19,
    precipitation: "dry",
    month: "June",
  },
  nights: NIGHTS,
  checkIn: CHECK_IN,
  checkOut: CHECK_OUT,
  budget: {
    total: 340,
    range: { min: 295, max: 390 },
    perPerson: true,
    travelers: TRAVELERS,
    breakdown: [
      {
        label: "Flights",
        icon: "✈️",
        amount: 110,
        perUnit: "PRG → FAO round-trip",
        color: "#4A90E2",
        tips: ["Wizz Air and Ryanair both fly Prague → Faro direct", "Tue/Wed midday departures save ~€20"],
        typical: "Budget airline, hand luggage only",
      },
      {
        label: "Hotel",
        icon: "🏨",
        amount: 120,
        perUnit: "€20/night × 6",
        color: "#FF6B47",
        tips: ["Stay in Lagos or Albufeira old town, not the resort strips", "Hostel privates run €25–35 in June"],
        typical: "Guesthouse or budget hotel near old town",
      },
      {
        label: "Food",
        icon: "🍽️",
        amount: 60,
        perUnit: "€10/day × 6",
        color: "#0D7377",
        tips: ["Prato do dia (dish of the day) is €8–10 with bread + drink", "Pastel de nata for breakfast — €1.20"],
        typical: "Tavernas + one cliffside seafood splurge",
      },
      {
        label: "Activities",
        icon: "🎭",
        amount: 35,
        perUnit: "Cave kayak + Sagres bus",
        color: "#F4A261",
        tips: ["Book Benagil kayak direct (€20) instead of group tours (€40)", "Most beaches are free; pay for sunbed only"],
        typical: "1 boat trip + free beaches",
      },
      {
        label: "Transport",
        icon: "🚌",
        amount: 15,
        perUnit: "Buses + airport transfer",
        color: "#8E7CC3",
        tips: ["Eva Bus connects all coastal towns — €3–5 per leg", "Faro airport bus to Lagos: €4, 90 min"],
        typical: "Buses, no rental car needed",
      },
    ],
  },
  mustDo: [
    {
      rank: 1,
      title: "Benagil Sea Cave at dawn",
      category: "activity",
      description: "Kayak through the natural skylight into the cathedral-like cave at sunrise. By 10am it's elbow-to-elbow with tour boats.",
      location: { name: "Benagil Cave", lat: 37.0892, lng: -8.4233 },
      estimatedCost: "€20",
      estimatedTime: "2h",
      tip: "Launch from Praia de Benagil at 6:30am. Self-guided kayak rental, no tour group required.",
    },
    {
      rank: 2,
      title: "Ponta da Piedade clifftop walk",
      category: "viewpoint",
      description: "1.5km along Lagos's most photographed cliffs — orange limestone stacks, hidden grottoes, and turquoise water 50m below.",
      location: { name: "Ponta da Piedade", lat: 37.0823, lng: -8.6699 },
      estimatedCost: "Free",
      estimatedTime: "1.5h",
      tip: "Walk it at 8am or after 6pm. Midday the white limestone reflects like a furnace.",
    },
    {
      rank: 3,
      title: "Praia do Camilo descent",
      category: "beach",
      description: "200 wooden steps down to a tiny double-cove framed by ochre cliffs. Crystalline water, tide-pool shelves, the platonic Algarve beach.",
      location: { name: "Praia do Camilo", lat: 37.0884, lng: -8.6694 },
      estimatedCost: "Free",
      estimatedTime: "3h",
      tip: "Bring water — there's one tiny snack bar at the top, nothing on the beach itself.",
    },
    {
      rank: 4,
      title: "Cabo de São Vicente — Europe's edge",
      category: "viewpoint",
      description: "The southwesternmost point of mainland Europe. 75m red cliffs, a working lighthouse, and Atlantic wind that knocks you sideways.",
      location: { name: "Cabo de São Vicente", lat: 37.0238, lng: -8.9942 },
      estimatedCost: "Free",
      estimatedTime: "2h",
      tip: "Eat at the bratwurst caravan in the parking lot — German guy, run there for 30 years, best sausage on the peninsula.",
    },
    {
      rank: 5,
      title: "Mercado de Lagos breakfast",
      category: "shopping",
      description: "Two-floor covered market: bottom is fish straight off the boat, top is fruit and Portuguese pastries. Tourists rarely make it past the seafood.",
      location: { name: "Mercado Municipal de Lagos", lat: 37.0998, lng: -8.6724 },
      estimatedCost: "€5–8",
      estimatedTime: "1h",
      tip: "Order pastel de nata + galão (milky coffee) at the cafe inside. Closed Sundays.",
    },
  ],
  itinerary: [
    {
      day: 1,
      title: "Faro arrival → Lagos",
      estimatedCost: 30,
      activities: [
        { timeOfDay: "afternoon", title: "Land at Faro, bus to Lagos (90 min)" },
        { timeOfDay: "afternoon", title: "Drop bags, walk old town walls" },
        { timeOfDay: "evening", title: "Sunset at Ponta da Piedade" },
      ],
    },
    {
      day: 2,
      title: "Benagil Cave + beach hop",
      estimatedCost: 60,
      activities: [
        { timeOfDay: "morning", title: "6:30am kayak to Benagil Cave" },
        { timeOfDay: "afternoon", title: "Lunch at Praia da Marinha — limestone arches" },
        { timeOfDay: "evening", title: "Bus back, dinner at A Forja" },
      ],
    },
    {
      day: 3,
      title: "Lagos cliff walk + Praia do Camilo",
      estimatedCost: 30,
      activities: [
        { timeOfDay: "morning", title: "Coffee at Mercado de Lagos" },
        { timeOfDay: "morning", title: "Cliff walk Ponta da Piedade → Praia do Camilo" },
        { timeOfDay: "afternoon", title: "Beach day at Praia do Camilo" },
      ],
    },
    {
      day: 4,
      title: "Sagres + Cabo de São Vicente",
      estimatedCost: 35,
      activities: [
        { timeOfDay: "morning", title: "Bus to Sagres (1h), fortress walk" },
        { timeOfDay: "afternoon", title: "Cabo de São Vicente lighthouse — Europe's edge" },
        { timeOfDay: "evening", title: "Dinner at A Casinha — open-fire seafood" },
      ],
    },
    {
      day: 5,
      title: "Tavira + sandbank island",
      estimatedCost: 35,
      activities: [
        { timeOfDay: "morning", title: "Train to Tavira (1.5h)" },
        { timeOfDay: "afternoon", title: "Ferry to Ilha de Tavira — empty Atlantic sandbank" },
        { timeOfDay: "evening", title: "Octopus rice at Restaurante Bica" },
      ],
    },
    {
      day: 6,
      title: "Faro old town + departure",
      estimatedCost: 25,
      activities: [
        { timeOfDay: "morning", title: "Faro Vila-Adentro old quarter" },
        { timeOfDay: "morning", title: "Capela dos Ossos — bone chapel inside Igreja do Carmo" },
        { timeOfDay: "afternoon", title: "Airport" },
      ],
    },
  ],
  localWisdom: [],
  goodToKnow: defaultGoodToKnow("Portugal"),
  whatToPack: [],
  booking: buildBooking({
    city: "Lagos",
    country: "Portugal",
    hotelMaxNightly: 30,
    fromOrigin: true,
  }),
  photos: [],
};

const algarveTips = [
  "Pre-book Benagil Cave kayaks online — they sell out 24h in advance in summer.",
  "Eva Transportes runs the coastal buses; Comboios de Portugal runs the slow scenic train. Get a Lagos ↔ Faro ticket for €7.",
  "Cliff edges aren't fenced. Keep 2m back — limestone undercuts collapse without warning.",
  "Algarvio fishermen serve 'cataplana' (copper-pot stew) — it's the regional dish, splurge once.",
  "Sun is brutal even in cloudy weather. SPF 50 and a hat from day one.",
];

// ─── Hallstatt ───────────────────────────────────────────────────────────────

const hallstattDetail: TripDetail = {
  id: "example-hallstatt",
  destination: "Hallstatt",
  country: "Austria",
  countryCode: "AT",
  description:
    "A 700-resident lake-mirror village pinned beneath the Dachstein peaks — Austria's iconic alpine postcard, where 7,000 years of salt mining quietly built the world's wealth.",
  vibes: ["mountains", "nature", "scenic"],
  weather: {
    temperature: 16,
    sunHours: 7,
    seaTemperature: 14,
    precipitation: "mixed",
    month: "June",
  },
  nights: NIGHTS,
  checkIn: CHECK_IN,
  checkOut: CHECK_OUT,
  budget: {
    total: 395,
    range: { min: 350, max: 445 },
    perPerson: true,
    travelers: TRAVELERS,
    breakdown: [
      {
        label: "Flights",
        icon: "✈️",
        amount: 130,
        perUnit: "PRG → VIE round-trip",
        color: "#4A90E2",
        tips: ["Vienna or Salzburg both work; Salzburg is 1h closer to Hallstatt", "ÖBB Sparschiene fares from €19 if you book 4 weeks ahead"],
        typical: "Budget airline + connecting train",
      },
      {
        label: "Hotel",
        icon: "🏨",
        amount: 168,
        perUnit: "€28/night × 6",
        color: "#FF6B47",
        tips: ["Stay in Obertraun across the lake — half the price, 5-min ferry", "Avoid June weekends; Hallstatt itself fills up by 10am day-trippers"],
        typical: "Family-run guesthouse with breakfast",
      },
      {
        label: "Food",
        icon: "🍽️",
        amount: 60,
        perUnit: "€10/day × 6",
        color: "#0D7377",
        tips: ["Buschenschanke (farm-to-table mountain inns) are best lunch value", "Most cafes close by 8pm — plan dinner early"],
        typical: "Mountain inn lunches + supermarket breakfast",
      },
      {
        label: "Activities",
        icon: "🎭",
        amount: 25,
        perUnit: "Salt mine + lake ferry",
        color: "#F4A261",
        tips: ["Salzwelten ticket includes the funicular up to Skywalk — buy combined", "Five Fingers viewpoint: hike up free, or cable car €38"],
        typical: "1 paid attraction + free hikes",
      },
      {
        label: "Transport",
        icon: "🚌",
        amount: 12,
        perUnit: "Train + ferry",
        color: "#8E7CC3",
        tips: ["Vienna → Hallstatt: 4h via Attnang-Puchheim", "The boat that meets the train (Stefanie) is part of the experience — don't skip it"],
        typical: "Train + the iconic lake ferry",
      },
    ],
  },
  mustDo: [
    {
      rank: 1,
      title: "Skywalk — Welterbeblick",
      category: "viewpoint",
      description: "Cantilevered platform 360m above the village, jutting into pure void over the lake. Reached by funicular from the salt mine entrance.",
      location: { name: "Skywalk Hallstatt", lat: 47.5550, lng: 13.6478 },
      estimatedCost: "€18 (with funicular)",
      estimatedTime: "45 min",
      tip: "Combine with the salt mine tour — same funicular, same ticket, save €6.",
    },
    {
      rank: 2,
      title: "Salzwelten — world's oldest salt mine",
      category: "activity",
      description: "7,000 years of continuous mining. Wooden slides into the chambers, an underground salt lake, and a Bronze Age burial discovered in 1734 still in situ.",
      location: { name: "Salzwelten Hallstatt", lat: 47.5562, lng: 13.6493 },
      estimatedCost: "€38",
      estimatedTime: "2.5h",
      tip: "Wear long pants — the slides are wooden and the chambers are 8°C even in July.",
    },
    {
      rank: 3,
      title: "Five Fingers viewpoint",
      category: "viewpoint",
      description: "Five steel platforms jutting out from a 2,000m clifftop on Krippenstein. Glass floor on one. Photographers fight for the magnifying-glass-shaped finger.",
      location: { name: "Five Fingers Krippenstein", lat: 47.4767, lng: 13.6905 },
      estimatedCost: "€38 cable car",
      estimatedTime: "4h round-trip",
      tip: "Take the first cable car at 8:40am — by 11am the clouds usually cap the peak.",
    },
    {
      rank: 4,
      title: "Hallstatt Market Square + Beinhaus",
      category: "landmark",
      description: "The pastel-fronted square is iconic, but the bone house behind St. Michael's is the haunting bit — 1,200 painted skulls, the last from 1995.",
      location: { name: "Hallstatt Marktplatz", lat: 47.5624, lng: 13.6494 },
      estimatedCost: "€2 (Beinhaus)",
      estimatedTime: "1h",
      tip: "Photograph the square from the lakeside path north of town — the famous Instagram angle is pin 47.5650, 13.6500.",
    },
    {
      rank: 5,
      title: "Dachstein Ice Cave",
      category: "activity",
      description: "Walking through ice formations 500m underground — a parallel world cooler than your freezer, lit indigo. Same cable-car as Five Fingers.",
      location: { name: "Dachstein Eishöhle", lat: 47.5174, lng: 13.7047 },
      estimatedCost: "€36",
      estimatedTime: "1.5h",
      tip: "The cave is 0°C year-round. Bring a warm layer even in 30°C summer days.",
    },
  ],
  itinerary: [
    {
      day: 1,
      title: "Vienna → Hallstatt",
      estimatedCost: 50,
      activities: [
        { timeOfDay: "morning", title: "Train Vienna → Attnang-Puchheim → Hallstatt (4h)" },
        { timeOfDay: "afternoon", title: "Ferry across the lake (the famous one that meets the train)" },
        { timeOfDay: "evening", title: "Sunset on the lakeside promenade, dinner at Gasthof Simony" },
      ],
    },
    {
      day: 2,
      title: "Salt mine + Skywalk",
      estimatedCost: 50,
      activities: [
        { timeOfDay: "morning", title: "Salzwelten salt mine tour (2.5h)" },
        { timeOfDay: "afternoon", title: "Skywalk viewpoint + funicular descent" },
        { timeOfDay: "evening", title: "Beer at Brauhaus Hallstatt" },
      ],
    },
    {
      day: 3,
      title: "Krippenstein day",
      estimatedCost: 70,
      activities: [
        { timeOfDay: "morning", title: "Cable car up Krippenstein (8:40am)" },
        { timeOfDay: "morning", title: "Five Fingers viewpoint" },
        { timeOfDay: "afternoon", title: "Dachstein Ice Cave + Mammoth Cave" },
      ],
    },
    {
      day: 4,
      title: "Lake + Obertraun",
      estimatedCost: 30,
      activities: [
        { timeOfDay: "morning", title: "Boat across to Obertraun" },
        { timeOfDay: "afternoon", title: "Koppenwinkellacke moor walk (flat 6km loop)" },
        { timeOfDay: "evening", title: "Lakeside grill at Seehotel am Hallstättersee" },
      ],
    },
    {
      day: 5,
      title: "St. Wolfgang day trip",
      estimatedCost: 60,
      activities: [
        { timeOfDay: "morning", title: "Bus to St. Wolfgang (1h)" },
        { timeOfDay: "afternoon", title: "Schafberg cog railway to 1,783m summit" },
        { timeOfDay: "evening", title: "Train back, light dinner at Café Maislinger" },
      ],
    },
    {
      day: 6,
      title: "Beinhaus + departure",
      estimatedCost: 25,
      activities: [
        { timeOfDay: "morning", title: "Bone house at St. Michael's chapel" },
        { timeOfDay: "morning", title: "Final lakeside coffee" },
        { timeOfDay: "afternoon", title: "Train back to Vienna or Salzburg" },
      ],
    },
  ],
  localWisdom: [],
  goodToKnow: defaultGoodToKnow("Austria"),
  whatToPack: [],
  booking: buildBooking({
    city: "Hallstatt",
    country: "Austria",
    hotelMaxNightly: 40,
    fromOrigin: true,
  }),
  photos: [],
};

const hallstattTips = [
  "Hallstatt fills up with day-trippers between 10am and 4pm. Stay overnight or go very early.",
  "The Stefanie ferry that meets the train is a 130-year-old tradition — €3.20 per crossing.",
  "Drone use is banned within 1km of the village center as of 2020.",
  "Bone house entry is by donation — €2 is customary. Closed in winter.",
  "Mountain weather flips fast — even in June carry a rain shell and warm layer for the cable car peaks.",
];

// ─── Public registry ─────────────────────────────────────────────────────────

export const EXAMPLE_TRIPS: Record<string, ExampleTrip> = {
  prague: { detail: pragueDetail, tips: pragueTips },
  algarve: { detail: algarveDetail, tips: algarveTips },
  hallstatt: { detail: hallstattDetail, tips: hallstattTips },
};

export const EXAMPLE_SLUGS = Object.keys(EXAMPLE_TRIPS);
