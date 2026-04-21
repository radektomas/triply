import type { TripDetail } from "@/lib/types/trip";

export const algarveMockTrip: TripDetail = {
  id: "algarve-portugal",
  destination: "Algarve",
  country: "Portugal",
  countryCode: "PT",
  description:
    "Europe's sunniest corner — dramatic limestone cliffs, crystalline water, and grilled seafood washed down with local wine. The Algarve is a beach trip done properly: wild enough to feel like a discovery, polished enough to be effortless.",
  vibes: ["beach", "sun", "relax", "scenic", "food"],

  weather: {
    temperature: 26,
    sunHours: 9,
    seaTemperature: 20,
    precipitation: "dry",
    month: "July",
  },
  nights: 3,

  budget: {
    total: 340,
    range: { min: 290, max: 395 },
    perPerson: true,
    travelers: 1,
    breakdown: [
      {
        label: "Flights",
        icon: "✈️",
        amount: 115,
        perUnit: "€95–€135 PRG→FAO",
        color: "#4A90E2",
        typical: "Ryanair or Wizz Air direct from Prague",
        tips: ["Book 6–8 weeks ahead for best fares", "Tuesday/Wednesday departures save ~15%"],
      },
      {
        label: "Hotel",
        icon: "🏨",
        amount: 135,
        perUnit: "€45/night × 3",
        color: "#FF6B47",
        typical: "3★ guesthouse in Carvoeiro or Lagos",
        tips: ["Book early — Algarve in July sells out fast", "Stay in Lagos for best restaurant access"],
      },
      {
        label: "Food",
        icon: "🍽️",
        amount: 75,
        perUnit: "€25/day",
        color: "#0D7377",
        typical: "Local tavernas + one seafood dinner",
        tips: ["Lunch prato do dia (menu of the day) is €8–12", "Bring cash — many beach bars are card-free"],
      },
      {
        label: "Activities",
        icon: "🎭",
        amount: 45,
        perUnit: "€15/day avg",
        color: "#F4A261",
        typical: "Boat tour + beach entry (most free)",
        tips: ["Ponta da Piedade boat tours from €20", "Most cliff beaches have free access"],
      },
      {
        label: "Transport",
        icon: "🚌",
        amount: 20,
        perUnit: "local buses + 1 taxi",
        color: "#8E7CC3",
        typical: "Local buses + occasional taxi",
        tips: ["EVA bus Lagos↔Albufeira every 2h", "Rent a car for day 3 (Sagres has no direct bus)"],
      },
    ],
  },

  mustDo: [
    {
      rank: 1,
      title: "Praia da Marinha",
      category: "beach",
      description:
        "The Algarve's most iconic beach — dramatic double-arch cliffs frame crystalline water you can actually swim through. One of Europe's most photographed coastlines.",
      location: { name: "Praia da Marinha, Lagoa", lat: 37.0839, lng: -8.4156 },
      estimatedCost: "Free",
      estimatedTime: "Half day",
      tip: "Arrive before 9 am — by 10 the access path is queued and the cliff-side parking lot is full.",
    },
    {
      rank: 2,
      title: "Ponta da Piedade Sea Caves",
      category: "activity",
      description:
        "A labyrinth of golden limestone arches, grottos, and hidden sea caves best explored from a small boat. The light in the caves at midday is something else.",
      location: { name: "Ponta da Piedade, Lagos", lat: 37.0797, lng: -8.6686 },
      estimatedCost: "€20–25",
      estimatedTime: "1.5h",
      tip: "Book directly with operators at the port — half the price of online platforms, same boats.",
    },
    {
      rank: 3,
      title: "Lagos Old Town",
      category: "landmark",
      description:
        "Whitewashed walls, Moorish gates, and the best lunch strip in the Algarve. Mercado da Ribeira does grilled sardines that justify the whole trip.",
      location: { name: "Lagos Old Town", lat: 37.1023, lng: -8.6745 },
      estimatedCost: "Free + €12–18 lunch",
      estimatedTime: "2–3h",
      tip: "Avoid Rua das Portas de Portugal restaurants — walk two streets inland for half the price.",
    },
    {
      rank: 4,
      title: "Cabo de São Vicente",
      category: "viewpoint",
      description:
        "The southwestern tip of continental Europe. 70-metre cliffs, relentless Atlantic wind, and the last lighthouse before open ocean. Unexpectedly moving.",
      location: { name: "Cabo de São Vicente, Sagres", lat: 37.0222, lng: -8.9956 },
      estimatedCost: "Free",
      estimatedTime: "1–2h",
      tip: "Combine with Sagres Fortress (€3) next door — bring a windbreaker even in July.",
    },
    {
      rank: 5,
      title: "Cataplana Dinner",
      category: "restaurant",
      description:
        "The Algarve's signature copper-pot stew — clams, prawns, chorizo, fish, all cooked together at the table. Always ordered for two, always worth it.",
      location: { name: "Faro Old Town", lat: 37.0194, lng: -7.9304 },
      estimatedCost: "€18–28/person",
      estimatedTime: "1.5–2h",
      tip: "The vessel only comes in a size-for-two — if you're solo, order arroz de tamboril instead.",
    },
  ],

  itinerary: [
    {
      day: 1,
      title: "Arrival & Cliffs",
      estimatedCost: 55,
      activities: [
        {
          timeOfDay: "morning",
          title: "Land at Faro, grab a rental bike or bus to Carvoeiro",
          duration: "2h",
          cost: 12,
          emoji: "🛬",
        },
        {
          timeOfDay: "afternoon",
          title: "Praia da Marinha — iconic double-arch cliff beach",
          duration: "3h",
          cost: 0,
          emoji: "🏖️",
          location: { name: "Praia da Marinha", lat: 37.0839, lng: -8.4156 },
        },
        {
          timeOfDay: "evening",
          title: "Grilled fish dinner at a taverna in Carvoeiro village",
          duration: "1.5h",
          cost: 22,
          emoji: "🐟",
          location: { name: "Carvoeiro", lat: 37.1004, lng: -8.4677 },
        },
      ],
    },
    {
      day: 2,
      title: "Lagos & Ponta da Piedade",
      estimatedCost: 85,
      activities: [
        {
          timeOfDay: "morning",
          title: "Ponta da Piedade boat tour through sea caves & arches",
          duration: "1.5h",
          cost: 25,
          emoji: "⛵",
          location: { name: "Ponta da Piedade", lat: 37.0797, lng: -8.6686 },
        },
        {
          timeOfDay: "afternoon",
          title: "Lagos old town: Rua 25 de Abril, Mercado da Ribeira lunch",
          duration: "2.5h",
          cost: 18,
          emoji: "🏛️",
          location: { name: "Lagos", lat: 37.1023, lng: -8.6745 },
        },
        {
          timeOfDay: "evening",
          title: "Sunset cocktails at Boa Vista bar overlooking the ocean",
          duration: "2h",
          cost: 20,
          emoji: "🌅",
        },
      ],
    },
    {
      day: 3,
      title: "Sagres & Cape St. Vincent",
      estimatedCost: 60,
      activities: [
        {
          timeOfDay: "morning",
          title: "Cape St. Vincent — westernmost point of continental Europe",
          duration: "2h",
          cost: 0,
          emoji: "🌊",
          location: { name: "Cabo de São Vicente", lat: 37.0222, lng: -8.9956 },
        },
        {
          timeOfDay: "afternoon",
          title: "Praia do Beliche — hidden beach below the cape cliffs",
          duration: "2.5h",
          cost: 0,
          emoji: "🏄",
          location: { name: "Praia do Beliche", lat: 37.0286, lng: -8.9924 },
        },
        {
          timeOfDay: "evening",
          title: "Return to Faro, cataplana dinner at O Castelo restaurant",
          duration: "1.5h",
          cost: 28,
          emoji: "🦞",
          location: { name: "Faro", lat: 37.0194, lng: -7.9304 },
        },
      ],
    },
  ],

  localWisdom: [
    {
      icon: "💶",
      title: "Cash culture",
      detail:
        "Many tavernas and beach bars outside Faro and Lagos don't accept cards. Bring at least €80 in cash — the ATMs in Carvoeiro and Sagres sometimes run dry in peak season.",
    },
    {
      icon: "🌅",
      title: "Beat the crowds to cliff beaches",
      detail:
        "Praia da Marinha, Praia do Camilo, and Ponta da Piedade fill up by 10 am in July. Arrive before 9 am for empty cliffs and free parking. By 11 am, the access paths are queued.",
    },
    {
      icon: "🚌",
      title: "No direct bus to Sagres",
      detail:
        "There's no single direct bus from the central Algarve to Sagres. You'll need to change in Lagos or take a taxi (€35–45 from Lagos). Renting a car for day 3 is the smartest option if there are two of you.",
    },
    {
      icon: "🦞",
      title: "Cataplana minimum",
      detail:
        "Cataplana (the signature Algarve seafood stew) is always cooked for two people minimum — it's the vessel size. Don't try to order one solo. Opt for arroz de tamboril (monkfish rice) as a solo alternative.",
    },
  ],

  goodToKnow: {
    currency: "EUR (€)",
    language: "Portuguese (English widely spoken in tourist areas)",
    plugType: "Type F (European standard — same plug as Czech Republic)",
    timezone: "WEST (UTC+1 in summer — same as Prague, no time adjustment needed)",
    emergencyNumber: "112",
    bestSimCard: "NOS or Vodafone PT — good 5G coverage along the N125 coastal road",
    tippingCustom: "Round up or ~10% in sit-down restaurants; no tipping expected at bars",
  },

  whatToPack: [
    {
      icon: "🧴",
      label: "Sunscreen SPF 50+",
      reason: "9h of direct sun — the Algarve UV index hits 9–10 in July",
    },
    {
      icon: "👟",
      label: "Grip sandals or trail shoes",
      reason: "Cliff paths are loose limestone — flip-flops slip on the descent to Marinha",
    },
    {
      icon: "💳",
      label: "€100 cash",
      reason: "Many tavernas and beach bars are card-free outside Faro",
    },
    {
      icon: "🏖️",
      label: "Dry bag or wet bag insert",
      reason: "For cliff pool swims — you'll want to keep your phone and wallet dry",
    },
    {
      icon: "🧢",
      label: "Wide-brim hat",
      reason: "Afternoon sun at the cliffs is merciless; shade is scarce on the path down",
    },
    {
      icon: "🩹",
      label: "Small first aid kit",
      reason: "Sea urchins near Marinha rocks; jellyfish occasional in July",
    },
    {
      icon: "📵",
      label: "Offline maps (Maps.me or Google Maps offline)",
      reason: "Signal gaps near Sagres and Cape St. Vincent",
    },
    {
      icon: "🌊",
      label: "Rash guard or swim top",
      reason: "For snorkelling in the sea caves — boat tour operators provide snorkels",
    },
  ],

  booking: {
    flights: [
      {
        provider: "Skyscanner",
        url: "https://www.skyscanner.net/transport/flights/prg/fao/",
        primary: true,
        description: "Best aggregator for PRG→FAO — often finds Ryanair/Wizz combos",
      },
      {
        provider: "Kiwi.com",
        url: "https://www.kiwi.com/en/search/results/prague-czechia/faro-portugal/",
        description: "Good for mix-and-match routes via Lisbon if FAO is sold out",
      },
    ],
    hotels: [
      {
        provider: "Booking.com",
        url: "https://www.booking.com/searchresults.html?ss=Algarve%2C+Portugal&checkin=2025-07-01&checkout=2025-07-04&group_adults=1",
        primary: true,
        description: "Widest selection — filter by Carvoeiro or Lagos for best cliff access",
      },
      {
        provider: "Hostelworld",
        url: "https://www.hostelworld.com/search#where=Algarve,%20Portugal&checkin=2025-07-01&checkout=2025-07-04&guests=1",
        description: "Best budget option — social hostels in Lagos from €18/night",
      },
    ],
    activities: [
      {
        provider: "GetYourGuide",
        url: "https://www.getyourguide.com/algarve-l1115/",
        primary: true,
        description: "Ponta da Piedade boat tours, kayak rentals, coasteering",
      },
      {
        provider: "Viator",
        url: "https://www.viator.com/Algarve/d816-ttd",
        description: "Wider selection of day trips including Sagres + Cabo excursions",
      },
    ],
    reviews: [
      {
        provider: "TripAdvisor",
        url: "https://www.tripadvisor.com/Tourism-g189112-Algarve_Faro_District_Algarve-Vacations.html",
        description: "Restaurant reviews essential — look for local spots off the strip",
      },
    ],
  },

  photos: [],
};
