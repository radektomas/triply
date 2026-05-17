// Hardcoded Quick Pick trip details — mirrors the old lib/data/exampleTrips.ts
// pattern. Each entry is a fully-typed TripDetail keyed by the same slug used
// in the Supabase quick_picks table. The Supabase row still drives the
// landing card (title, destination, vibe, hero image, etc.), but the detail
// page reads the full body from here so we don't have to hand-paste jsonb.
//
// Slugs missing from this map render the hero-only fallback view in
// app/trips/[slug]/page.tsx — that's the graceful state while you write
// up additional picks.
import type { TripDetail } from "@/lib/types/trip";

export const QUICK_PICK_TRIPS: Record<string, TripDetail> = {
  "prague-budget-weekend": {
    id: "prague-budget-weekend",
    destination: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    description:
      "A long weekend in the City of a Hundred Spires — gothic skylines, beer halls older than your grandparents, and cobblestones that have seen empires rise and fall. Built for groups who want big experiences on small budgets.",
    vibes: ["city", "budget", "culture", "nightlife"],
    weather: {
      temperature: 18,
      sunHours: 6,
      seaTemperature: 0,
      precipitation: "mixed",
      month: "May",
    },
    nights: 2,
    checkIn: "2026-06-12",
    checkOut: "2026-06-14",
    budget: {
      total: 180,
      range: { min: 150, max: 230 },
      perPerson: true,
      travelers: 4,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 70,
          perUnit: { amount: 70, unit: "round-trip from major EU hub" },
          color: "#FF6B47",
          tips: [
            "Wizz Air and Ryanair fly to Prague from most European cities",
            "Book 4–6 weeks ahead for the best deals",
          ],
          typical: "Budget airline round-trip",
        },
        {
          label: "Accommodation",
          icon: "🏨",
          amount: 40,
          perUnit: { amount: 20, unit: "/night × 2" },
          color: "#0D7377",
          tips: [
            "Hostels in Vinohrady or Žižkov are clean, cheap, and walkable",
            "Avoid Old Town hotels — same price for half the space",
          ],
          typical: "Private hostel room or budget Airbnb",
        },
        {
          label: "Food & drinks",
          icon: "🍻",
          amount: 45,
          perUnit: { amount: 15, unit: "/day × 3" },
          color: "#FFB347",
          tips: [
            "Lunch menus (polední menu) are €5–7 for 2 courses",
            "Beer is often cheaper than water — embrace it",
          ],
          typical: "Pub meals + 2–3 beers daily",
        },
        {
          label: "Transport",
          icon: "🚊",
          amount: 10,
          perUnit: { amount: 5, unit: "/day × 2" },
          color: "#9B7EBD",
          tips: [
            "3-day public transport pass is €13 — covers trams, metro, buses",
            "Walking is faster than driving in the center",
          ],
          typical: "Tram + metro pass",
        },
        {
          label: "Activities",
          icon: "🎭",
          amount: 15,
          perUnit: { unit: "free walking tours + 1 paid entry" },
          color: "#4ECDC4",
          tips: [
            "Most viewpoints (Letná, Petřín, Vyšehrad) are free",
            "Skip the astronomical clock crowd — view it from a café across the square",
          ],
          typical: "Mostly free sights + 1 museum",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-old-town",
        emoji: "🏰",
        vibe: "history meets nightlife",
        tagline: "Cover the postcard hits, end in a beer cellar",
        schedule: [
          {
            time: "Morning",
            activity:
              "Walk across Charles Bridge before 9am — empty cobblestones, soft light, your photos won't have 200 strangers in them.",
            tip: "Start from the Lesser Town side for the best first impression.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Lokál Dlouhááá — fresh-tapped Pilsner, classic Czech goulash, no tourists.",
            tip: "Order the svíčková — sirloin in cream sauce. Trust.",
          },
          {
            time: "Afternoon",
            activity:
              "Climb the Old Town Hall tower (€12) for the rooftop view, then wander Josefov (Jewish Quarter).",
            tip: "Skip the astronomical clock spectacle — watch it once from a café terrace nearby.",
          },
          {
            time: "Evening",
            activity:
              "Pub crawl through Žižkov — cheapest beer in the city, most bars per capita in Europe.",
            tip: "Start at U Sadu, end at Hospoda Parukářka with the city view.",
          },
        ],
      },
      {
        id: "day-2-castle-views",
        emoji: "👑",
        vibe: "castle district + viewpoints",
        tagline: "Prague Castle, hidden gardens, sunset from above",
        schedule: [
          {
            time: "Morning",
            activity:
              "Prague Castle complex — buy the basic ticket (€10), focus on St. Vitus Cathedral and Golden Lane.",
            tip: "Enter via the back from Pohořelec to skip the main entrance queue.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Café Savoy in Lesser Town — Art Nouveau interior, great breakfast served all day, mid-range prices.",
            tip: "Order the Savoy breakfast even if it's 2pm.",
          },
          {
            time: "Afternoon",
            activity:
              "Walk up to Petřín Hill through the orchards. Climb the mini Eiffel Tower (€8) or just chill in the gardens.",
            tip: "Take the funicular up, walk down — saves your legs for the evening.",
          },
          {
            time: "Evening",
            activity:
              "Sunset beer at Letná Beer Garden — locals only, panoramic view of the city's spires, beer at €2.",
            tip: "Bring snacks from a nearby Žabka — outside food is allowed.",
          },
        ],
      },
      {
        id: "day-3-local-prague",
        emoji: "🍺",
        vibe: "off-the-tourist-trail",
        tagline: "How locals actually spend a weekend",
        schedule: [
          {
            time: "Morning",
            activity:
              "Breakfast at Můj šálek kávy in Karlín — best coffee in Prague, no English menu (use Google Translate, it's part of the charm).",
            tip: "Try the chlebíčky (open-faced sandwiches) — a Czech institution.",
          },
          {
            time: "Midday",
            activity:
              "Walk through Vyšehrad fortress — fewer tourists than the castle, stunning cemetery, views over the Vltava bend.",
            tip: "The basilica is free to enter and absolutely worth 15 minutes.",
          },
          {
            time: "Afternoon",
            activity:
              "Náplavka riverside — Saturday farmers' market (if it's Saturday) or just grab a beer and sit on the stairs by the water.",
            tip: "Locals bring their own snacks — totally normal.",
          },
          {
            time: "Evening",
            activity:
              "Farewell dinner at Eska in Karlín — modern Czech cuisine, €25 tasting menu, books out 2 weeks ahead.",
            tip: "If Eska is full, try Lokál Hamburk or Field — same neighborhood, different price points.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "💶",
        title: "Cash still rules in pubs",
        detail:
          "Most traditional hospodas are card-friendly now, but smaller spots in Žižkov and Vinohrady are cash-only. Keep €30 in koruna on you.",
      },
      {
        icon: "🍺",
        title: "Beer ordering etiquette",
        detail:
          "You sit down, they bring beer. Don't flag anyone down. Put a coaster on top of your empty glass when you're done — that's the signal to stop.",
      },
      {
        icon: "🚇",
        title: "Validate your tram ticket",
        detail:
          "Yellow machine, stamp it as you board. Inspectors are real, fines are €25 on the spot, and tourists are their favorite target.",
      },
      {
        icon: "🗣️",
        title: "Dobrý den goes a long way",
        detail:
          "Just saying 'dobrý den' (hello) and 'děkuju' (thank you) flips the service energy from neutral to genuinely warm. Try it.",
      },
    ],
    goodToKnow: {
      currency: "Czech Koruna (CZK, Kč) — €1 ≈ 25 Kč",
      language: "Czech (English widely spoken in central Prague, less so in Žižkov/Karlín)",
      plugType: "Type E (European standard, 230V)",
      timezone: "CEST (UTC+2 in summer, same as most of EU)",
      emergencyNumber: "112",
      bestSimCard: "Vodafone or O2 prepaid — €15 for 10GB, sold at any Albert supermarket",
      tippingCustom:
        "Round up or add 10% in restaurants. Don't leave coins on the table — hand it directly or say the total amount when paying.",
    },
    whatToPack: [
      { icon: "👟", label: "Comfortable walking shoes", reason: "Cobblestones are brutal on bad soles" },
      { icon: "🧥", label: "Light jacket or hoodie", reason: "Evenings drop to 10–12°C even in May" },
      { icon: "☂️", label: "Compact umbrella", reason: "Prague has unpredictable spring showers" },
      { icon: "🔌", label: "EU plug adapter", reason: "Type E sockets — UK and US plugs don't fit" },
      {
        icon: "💳",
        label: "Card with no foreign fees",
        reason: "Revolut, Wise, or N26 — avoid Dynamic Currency Conversion at ATMs",
      },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/prg/",
          primary: true,
          description: "Best for comparing budget airlines across Europe",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/prague-czech-republic",
          description: "Good for multi-city or unusual route combos",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/city/cz/prague.html",
          primary: true,
          description: "Widest selection of budget hostels and Vinohrady apartments",
        },
        {
          provider: "Hostelworld",
          url: "https://www.hostelworld.com/hostels/Prague",
          description: "Best for groups looking for private rooms in hostels",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/prague-l10/",
          primary: true,
          description: "Skip-the-line castle tickets and beer tasting tours",
        },
        {
          provider: "Prague Free Tour",
          url: "https://www.praguefreetour.com/",
          description: "Tip-based walking tours, daily at 10am from Old Town Square",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g274707-Prague_Bohemia-Vacations.html",
          description: "User reviews for restaurants and attractions",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/prague-budget-weekend.jpg", alt: "Prague Old Town and Charles Bridge at dusk" },
    ],
  },

  "albanian-riviera-hidden-gem": {
    id: "albanian-riviera-hidden-gem",
    destination: "Albanian Riviera",
    country: "Albania",
    countryCode: "AL",
    description:
      "Albania's coast before everyone else figures it out. Ionian-blue water at Czech prices, sheer mountain backdrops, and tavernas where you point at fish in a fridge. Six nights to slow down before this gets gentrified into oblivion.",
    vibes: ["hidden_gem", "beach", "coastal", "underrated"],
    weather: {
      temperature: 25,
      sunHours: 10,
      seaTemperature: 22,
      precipitation: "dry",
      month: "June",
    },
    nights: 6,
    checkIn: "2026-06-06",
    checkOut: "2026-06-12",
    budget: {
      total: 390,
      range: { min: 320, max: 480 },
      perPerson: true,
      travelers: 2,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 110,
          perUnit: { amount: 110, unit: "round-trip via Tirana or Corfu" },
          color: "#FF6B47",
          tips: [
            "Flying into Corfu and ferrying across to Saranda is often cheaper than direct to Tirana",
            "Wizz Air flies Tirana from most of central Europe under €100 if booked early",
          ],
          typical: "Budget airline + Corfu–Saranda ferry combo",
        },
        {
          label: "Accommodation",
          icon: "🏨",
          amount: 120,
          perUnit: { amount: 20, unit: "/night × 6" },
          color: "#0D7377",
          tips: [
            "Family-run guesthouses in Himarë and Dhërmi start at €30/night for a couple",
            "Avoid Ksamil itself in peak July/August — base in Saranda and day-trip across",
          ],
          typical: "Private guesthouse room with sea view",
        },
        {
          label: "Food & drinks",
          icon: "🍤",
          amount: 90,
          perUnit: { amount: 15, unit: "/day × 6" },
          color: "#FFB347",
          tips: [
            "Grilled fish is €8–12 a plate at family tavernas; same dish is €25+ in Corfu",
            "Local wine (Kallmet, Shesh i Bardhë) is €3 a glass and surprisingly good",
          ],
          typical: "Two meals out daily + wine",
        },
        {
          label: "Transport",
          icon: "🚍",
          amount: 40,
          perUnit: { unit: "buses, taxis, Corfu ferry" },
          color: "#9B7EBD",
          tips: [
            "Furgon minibuses connect every coastal town for €3–5 a leg",
            "Renting a scooter (€20/day) is the single best upgrade for the riviera",
          ],
          typical: "Furgons + one scooter day",
        },
        {
          label: "Activities",
          icon: "🏖️",
          amount: 30,
          perUnit: { unit: "beach loungers + 1 boat trip" },
          color: "#4ECDC4",
          tips: [
            "Most beaches are free if you bring a towel; loungers cost €5–10",
            "Boat trips to grotto caves out of Himarë are €25 per person, half day",
          ],
          typical: "Mostly free beaches + one boat day",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-saranda-ksamil",
        emoji: "🏝️",
        vibe: "Saranda & Ksamil",
        tagline: "Land, drop bags, get in the water",
        schedule: [
          {
            time: "Morning",
            activity:
              "Arrive into Tirana or ferry across from Corfu to Saranda. Walk the seafront promenade — Saranda is functional, not pretty, but the water makes up for it.",
            tip: "Corfu–Saranda ferry runs 4× daily, 30 minutes, €25. Bring your passport — yes, even within Schengen-ish.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Demi Restaurant on Saranda's promenade — grilled sea bass, Greek-Albanian salads, owners speak six languages.",
            tip: "Point at the fish in the ice display, ask the price per kilo. That's the actual prices, not the menu.",
          },
          {
            time: "Afternoon",
            activity:
              "Take a taxi or local bus 25 minutes south to Ksamil. Four tiny islands you can swim between in waist-deep water.",
            tip: "Rent a kayak for €10 instead of paying for loungers — the second island has zero people on it.",
          },
          {
            time: "Evening",
            activity:
              "Back to Saranda for sunset drinks at Mango Beach Bar, then late dinner at Taverna Tradita.",
            tip: "Saranda prices creep up after 8pm — eat by 7 and save 30%.",
          },
        ],
      },
      {
        id: "day-2-himare-gjipe",
        emoji: "⛰️",
        vibe: "Himarë & Gjipe Beach",
        tagline: "The riviera's most cinematic beach takes a hike",
        schedule: [
          {
            time: "Morning",
            activity:
              "Furgon north to Himarë (90 minutes, €5). Drop bags at your guesthouse, grab a coffee at one of the seafront cafés.",
            tip: "The bus from Saranda leaves around 9am. Buy tickets on board — no online booking exists.",
          },
          {
            time: "Midday",
            activity:
              "Taxi (€15) to the Gjipe Beach turnoff. 20-minute downhill walk through a dry canyon to a beach trapped between cliffs.",
            tip: "Tell the driver 'Gjipe' and 'wait at 4pm' — they'll come back. There's no signal at the beach.",
          },
          {
            time: "Afternoon",
            activity:
              "Swim, sunbathe, paddle to the cave at the south end. The beach bar runs on solar power and serves cold beer only.",
            tip: "Bring cash — lek only. No ATM, no card machine, no exceptions. €40 in lek covers food and drinks for the day.",
          },
          {
            time: "Evening",
            activity:
              "Back to Himarë. Dinner at Taverna Lefteri — family-run, grilled octopus, no menu, you eat what's cooking.",
            tip: "Ask what Lefteri is making before you sit down. If he says 'fish,' commit.",
          },
        ],
      },
      {
        id: "day-3-dhermi-llogara",
        emoji: "🌅",
        vibe: "Dhërmi & Llogara Pass",
        tagline: "Wider beaches, mountain pass, monk-poured raki",
        schedule: [
          {
            time: "Morning",
            activity:
              "Drive or furgon 25 minutes north to Dhërmi. Wider beaches than Himarë, splits between a chill Drymades side and a party-music Dhërmi side.",
            tip: "Drymades Beach is the quieter half — sandy, pine-shaded, fewer speakers.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Hotel Luxury Dhermi or any beach taverna — swordfish skewers, fresh salads, €8–10 plates.",
            tip: "Same swordfish costs €18 across the water in Corfu. Eat well here.",
          },
          {
            time: "Afternoon",
            activity:
              "Drive up Llogara Pass (€20 taxi up and back, or hire a scooter). 1000m of hairpins to the viewpoint over the whole riviera.",
            tip: "Stop at the small Orthodox monastery near the top — monks pour free raki if you say hello. Decline politely if you're driving.",
          },
          {
            time: "Evening",
            activity:
              "Sunset back at the Llogara pass viewpoint, then drop into Himarë for dinner at Taverna Mare.",
            tip: "Bring a hoodie — Llogara is 1000m up and gets cold even in June.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "💶",
        title: "Lek and euro both 'work'",
        detail:
          "Tourist spots quote in euros, locals in lek (1 EUR ≈ 100 LEK). Pay in lek whenever possible — euro 'exchange rates' at restaurants are quietly terrible. Withdraw from Credins or Raiffeisen ATMs (€2 fee). Avoid Euronet at all costs.",
      },
      {
        icon: "🚌",
        title: "Furgon culture",
        detail:
          "Minibuses (furgons) leave when full, not on schedule. The 'timetable' is aspirational. Show up early, bring water, accept that 'departing soon' might mean 40 minutes.",
      },
      {
        icon: "🤲",
        title: "Yes by shaking, no by nodding",
        detail:
          "Albanians shake their head sideways for yes and nod for no. It's the opposite of most of Europe. Confusing for a day, then you stop noticing.",
      },
      {
        icon: "🍽️",
        title: "Lunch is the big meal",
        detail:
          "Locals eat their main meal at 1–3pm and skip a heavy dinner. Many small tavernas close Sunday afternoon for family lunch — plan your dining accordingly.",
      },
    ],
    goodToKnow: {
      currency: "Albanian Lek (ALL) — €1 ≈ 100 ALL. Many tourist places also take euros.",
      language: "Albanian (English in tourist areas; Italian common along the coast)",
      plugType: "Type C/F (European standard, 230V)",
      timezone: "CEST (UTC+2 in summer)",
      emergencyNumber: "112",
      bestSimCard: "One or Vodafone prepaid — €10 for 15GB at any kiosk in Saranda",
      tippingCustom:
        "Round up to the nearest 100 lek in cafés, 5–10% in restaurants. Cash strongly preferred even when paying card.",
    },
    whatToPack: [
      { icon: "👟", label: "Water shoes", reason: "Most riviera beaches are pebble, not sand" },
      { icon: "🧴", label: "Reef-safe sunscreen", reason: "Strong sun by 10am, almost no shade on most beaches" },
      { icon: "💵", label: "Euros AND a card", reason: "Small-town ATMs sometimes run empty; cash gets you out of jams" },
      { icon: "🧥", label: "Light layer", reason: "Llogara Pass and sea breezes get cold even in June" },
      { icon: "🥾", label: "Trail sandals or sneakers", reason: "The Gjipe trail is 20 minutes of loose rock" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/tia/",
          primary: true,
          description: "Best for finding flights into Tirana from major EU hubs",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/tirana-albania",
          description: "Good for combining Tirana with a Corfu return on a different airline",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/region/al/albanian-riviera.html",
          primary: true,
          description: "Widest selection from Saranda to Dhërmi guesthouses",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Himare--Albania/homes",
          description: "Family-run apartments cheaper than hotels in Himarë and Dhërmi",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/s/?q=albanian+riviera",
          primary: true,
          description: "Day trips to Butrint ruins, Blue Eye spring, and Corfu",
        },
        {
          provider: "Visit Albania",
          url: "https://albania.travel/",
          description: "Official tourism board — bus schedules and seasonal ferry info",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g304076-Saranda_Vlore_County-Vacations.html",
          description: "User reviews for guesthouses and tavernas across the coast",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/albanian-riviera-hidden-gem.jpg", alt: "Albanian Riviera coastline with turquoise water and cliffs" },
    ],
  },

  "corfu-beach-reset": {
    id: "corfu-beach-reset",
    destination: "Corfu",
    country: "Greece",
    countryCode: "GR",
    description:
      "Five nights of doing very little, very well. Ionian blue water, Venetian fortresses, hill towns where the only schedule is the next swim. Designed for solo travelers who want a beach holiday that's also a reset.",
    vibes: ["beach", "greek-islands", "slow", "solo"],
    weather: {
      temperature: 26,
      sunHours: 10,
      seaTemperature: 21,
      precipitation: "dry",
      month: "June",
    },
    nights: 5,
    checkIn: "2026-06-10",
    checkOut: "2026-06-15",
    budget: {
      total: 440,
      range: { min: 370, max: 530 },
      perPerson: true,
      travelers: 1,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 120,
          perUnit: { amount: 120, unit: "round-trip to CFU from EU" },
          color: "#FF6B47",
          tips: [
            "Ryanair, easyJet, and Wizz fly to Corfu (CFU) from May to October",
            "Tuesday and Wednesday flights are 30% cheaper than weekend ones",
          ],
          typical: "Budget airline round-trip",
        },
        {
          label: "Accommodation",
          icon: "🏨",
          amount: 175,
          perUnit: { amount: 35, unit: "/night × 5" },
          color: "#0D7377",
          tips: [
            "Family-run studios in Agios Gordios or Paleokastritsa from €30 in early June",
            "Avoid Kavos unless you're 19 and angry",
          ],
          typical: "Simple studio with kitchenette and balcony",
        },
        {
          label: "Food & drinks",
          icon: "🥗",
          amount: 100,
          perUnit: { amount: 20, unit: "/day × 5" },
          color: "#FFB347",
          tips: [
            "Souvlaki is €3.50 anywhere on the island — the cheapest meal in Europe with the best view",
            "Skip the seafront tavernas; walk one block back for half the price, same food",
          ],
          typical: "One taverna meal + one beach snack daily",
        },
        {
          label: "Transport",
          icon: "🛵",
          amount: 25,
          perUnit: { unit: "scooter + buses" },
          color: "#9B7EBD",
          tips: [
            "Scooter rental in Paleokastritsa is €15/day — the island opens up immediately",
            "Green KTEL buses connect every village for €2–4 a leg",
          ],
          typical: "Two scooter days + bus rest",
        },
        {
          label: "Activities",
          icon: "🏝️",
          amount: 20,
          perUnit: { unit: "Old Fortress + monastery + Porto Timoni hike" },
          color: "#4ECDC4",
          tips: [
            "Most viewpoints (Drastis, Bella Vista, Pantokrator) are free",
            "Porto Timoni hike is free; €15 if you boat in instead",
          ],
          typical: "Mostly free + one paid entry",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-corfu-town",
        emoji: "🏛️",
        vibe: "Corfu Town & Old Fortress",
        tagline: "Venetian skyline, narrow alleys, sunset cocktail",
        schedule: [
          {
            time: "Morning",
            activity:
              "Land at CFU, bus 19 to Corfu Town (€1.70). Drop bags, walk the Liston — the arcaded boulevard the French built when they thought they owned Greece.",
            tip: "Skip cabs from the airport. Bus 19 stops 300m from the old town, runs every 30 minutes.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Pomo d'Oro on Schulemburg Square — Corfiot pastitsada (slow-cooked rooster in cinnamon sauce), shaded courtyard.",
            tip: "Order pastitsada or sofrito — these are the Corfu specialties you can't get on other Greek islands.",
          },
          {
            time: "Afternoon",
            activity:
              "Climb the Old Fortress (€6) for the panorama over the harbor. Wander Campiello — the old Venetian quarter, narrow alleys with laundry strung above.",
            tip: "Go before 5pm — the fortress closes early and the alleys get tour-group crowded after.",
          },
          {
            time: "Evening",
            activity:
              "Sunset at Café Liston, then dinner at Rouvas (lunch-only but iconic Corfiot home cooking — if it's still open at 5pm, go).",
            tip: "If Rouvas is closed, head to Salto Wine Bar for small plates and a glass of Robola.",
          },
        ],
      },
      {
        id: "day-2-paleokastritsa",
        emoji: "🐚",
        vibe: "Paleokastritsa & monastery",
        tagline: "Six coves, one monastery, swim until you forget the date",
        schedule: [
          {
            time: "Morning",
            activity:
              "Bus or scooter west to Paleokastritsa (45 minutes). Walk up the cypress road to the Paleokastritsa Monastery on the headland.",
            tip: "Free entry, but cover shoulders and knees. They provide wrap-skirts at the door if you forget.",
          },
          {
            time: "Midday",
            activity:
              "Boat taxi (€10) from Paleokastritsa main beach to one of the hidden coves — Rovinia, Stelari, or Limni — that you can't reach by foot.",
            tip: "Ask for Rovinia. It's the prettiest, has a small taverna, and 80% of tourists never make it there.",
          },
          {
            time: "Afternoon",
            activity:
              "Lunch at Limani Restaurant at the harbor — grilled octopus, fava, a half-litre of house white.",
            tip: "Order the cuttlefish ink risotto. It looks alarming, tastes incredible.",
          },
          {
            time: "Evening",
            activity:
              "Sunset drinks at La Grotta — a beach bar built into a sea cave. Cliff-jumping platform if you're brave.",
            tip: "Walk down the stairs by Hotel Akrotiri. 200 steps each way — worth it.",
          },
        ],
      },
      {
        id: "day-3-porto-timoni",
        emoji: "🥾",
        vibe: "Porto Timoni hike",
        tagline: "Two beaches in one cove, reached on foot",
        schedule: [
          {
            time: "Morning",
            activity:
              "Drive or bus to Afionas village in the north-west. Walk 30 minutes downhill on a stony trail to Porto Timoni — a double beach split by a thin spit of land.",
            tip: "Start before 9am. The trail has zero shade and the climb back up in afternoon sun is brutal.",
          },
          {
            time: "Midday",
            activity:
              "Swim across the spit between the two beaches. One side is calm, the other has small waves. There's a single beach shack selling toasties.",
            tip: "Bring 2L of water. The shack runs out by 1pm in peak season.",
          },
          {
            time: "Afternoon",
            activity:
              "Hike back up. Recover with lunch at Panorama Restaurant in Afionas — yes, named after its view, yes, the view is that good.",
            tip: "Get the seat by the cliff edge. Order the gigantes (giant beans in tomato).",
          },
          {
            time: "Evening",
            activity:
              "Drive 20 minutes north to Cape Drastis viewpoint for sunset — chalk-white sea stacks dropping into impossibly blue water.",
            tip: "Park in the dirt lot near the taverna and walk the last 5 minutes. The unpaved road eats rental scooters.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "🕐",
        title: "Greek schedule is not your schedule",
        detail:
          "Lunch starts at 2pm, dinner at 9pm minimum, locals roll out at 10:30. Eating dinner at 7pm marks you as a tourist and means the food is reheated. Adjust.",
      },
      {
        icon: "💶",
        title: "Card now works almost everywhere",
        detail:
          "Greece's tax crackdown means even small tavernas have card readers. Keep €50 cash for the very smallest village kafenios and the boat taxis.",
      },
      {
        icon: "🛵",
        title: "Scooter, not car",
        detail:
          "Corfu's roads are narrow and parking is a nightmare. A scooter unlocks coves cars can't reach. €15/day, helmet required, EU license accepted.",
      },
      {
        icon: "🍋",
        title: "Kumquat is Corfu, not Greece",
        detail:
          "The kumquat liqueur (and everything kumquat-flavored) is unique to Corfu — Venetians brought it from Asia 200 years ago. Try a shot, buy a small bottle, skip the cheap orange-dyed knockoffs.",
      },
    ],
    goodToKnow: {
      currency: "Euro (€)",
      language: "Greek (English nearly universal in tourist areas)",
      plugType: "Type C/F (European standard, 230V)",
      timezone: "EEST (UTC+3 in summer, 1 hour ahead of central Europe)",
      emergencyNumber: "112",
      bestSimCard: "Cosmote or Vodafone prepaid — €15 for 20GB at any kiosk in Corfu Town",
      tippingCustom:
        "Round up or leave a euro per person in tavernas. 10% is generous, not expected. Service is not included.",
    },
    whatToPack: [
      { icon: "🩴", label: "Reef sandals", reason: "Most beaches are pebble; barefoot is painful" },
      { icon: "🧴", label: "Strong sunscreen (50+)", reason: "10 hours of sun a day, no clouds for shade" },
      { icon: "🪖", label: "Hat with a wide brim", reason: "The Porto Timoni hike is fully exposed" },
      { icon: "📸", label: "Phone with offline maps", reason: "Trails are unsigned; GPS works without data" },
      { icon: "🩱", label: "Two swimsuits", reason: "You'll be in and out of the water four times a day" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/cfu/",
          primary: true,
          description: "Best for budget routes into Corfu (CFU) from May to October",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/corfu-greece",
          description: "Good for routing via Athens or combining with Albania",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/city/gr/corfu.en-gb.html",
          primary: true,
          description: "Family-run studios across Paleokastritsa, Agios Gordios, and Corfu Town",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Corfu--Greece/homes",
          description: "Whole-villa rentals get cheap for solo travelers off-peak",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/corfu-l175/",
          primary: true,
          description: "Boat trips to the Blue Lagoon and Old Fortress tickets",
        },
        {
          provider: "Visit Corfu",
          url: "https://www.visitcorfu.gr/",
          description: "Official tourism site — bus schedules, hike maps, beach access info",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g189454-Corfu_Ionian_Islands-Vacations.html",
          description: "User reviews for tavernas and beach clubs across the island",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/corfu-beach-reset.jpg", alt: "Paleokastritsa coves and turquoise Ionian water" },
    ],
  },

  "dolomites-mountain-stretch": {
    id: "dolomites-mountain-stretch",
    destination: "Dolomites",
    country: "Italy",
    countryCode: "IT",
    description:
      "Five nights of altitude, alpine pasta, and trails that turn corners into postcards. Solo-friendly mountain hut culture, half-board everywhere, and June light that lasts until 9:30pm. Designed for people who'd rather hike than scroll.",
    vibes: ["mountain", "hiking", "alps", "solo"],
    weather: {
      temperature: 14,
      sunHours: 7,
      seaTemperature: 0,
      precipitation: "mixed",
      month: "June",
    },
    nights: 5,
    checkIn: "2026-06-10",
    checkOut: "2026-06-15",
    budget: {
      total: 480,
      range: { min: 400, max: 580 },
      perPerson: true,
      travelers: 1,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 100,
          perUnit: { amount: 100, unit: "round-trip to VCE or INN" },
          color: "#FF6B47",
          tips: [
            "Fly into Venice (VCE) for the southern Dolomites, Innsbruck (INN) for the north",
            "Treviso (TSF) is the Ryanair gateway and 30% cheaper than Venice",
          ],
          typical: "Budget airline + 3-hour bus transfer",
        },
        {
          label: "Accommodation",
          icon: "🏔️",
          amount: 200,
          perUnit: { amount: 40, unit: "/night × 5" },
          color: "#0D7377",
          tips: [
            "Mountain rifugios run €55–70/night with half board — incredible value",
            "Val Gardena and Alta Badia have cheaper farm-stay garnis than Cortina",
          ],
          typical: "Mix of rifugio bunk + guesthouse half-board",
        },
        {
          label: "Food & drinks",
          icon: "🍝",
          amount: 100,
          perUnit: { amount: 20, unit: "/day × 5" },
          color: "#FFB347",
          tips: [
            "Rifugio half-board (€20 supplement) is the best food deal in the Alps",
            "Pack a lunch from the supermarket; trail huts charge €15 for a plate of pasta",
          ],
          typical: "Half-board dinners + packed trail lunches",
        },
        {
          label: "Transport",
          icon: "🚐",
          amount: 40,
          perUnit: { unit: "Cortina Express + local buses" },
          color: "#9B7EBD",
          tips: [
            "Cortina Express runs Venice airport ↔ Cortina for €23 each way",
            "SüdtirolMobil card (€12) covers all local buses + cable cars in Alta Badia for 7 days",
          ],
          typical: "Airport transfer + regional bus pass",
        },
        {
          label: "Activities",
          icon: "🥾",
          amount: 40,
          perUnit: { unit: "cable cars + Tre Cime parking" },
          color: "#4ECDC4",
          tips: [
            "Cable cars are €25–35 each way — the Seceda one is worth every cent",
            "Tre Cime parking is €30 in summer; bus from Cortina is €8 round-trip and avoids the chaos",
          ],
          typical: "Two cable car rides + trail entries",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-cortina-tre-cime",
        emoji: "🗻",
        vibe: "Cortina & Tre Cime",
        tagline: "The classic loop everyone Instagrams, done right",
        schedule: [
          {
            time: "Morning",
            activity:
              "Catch the 7am bus from Cortina d'Ampezzo to Rifugio Auronzo (€8 round-trip). Saves €30 in parking and avoids the 9am traffic war.",
            tip: "Bus tickets at Cortina bus station counter, not on board. Buy the night before.",
          },
          {
            time: "Midday",
            activity:
              "Hike the Tre Cime di Lavaredo loop — 10km, mostly flat, the three iconic peaks in your face the entire way.",
            tip: "Walk it counter-clockwise (left out of Rifugio Auronzo) — the best views hit you halfway in, not at the start.",
          },
          {
            time: "Afternoon",
            activity:
              "Lunch break at Rifugio Locatelli at the loop's midpoint — pasta al ragù €12, the view costs nothing extra.",
            tip: "Cash works but card is fine now. Tip €1, not 10% — it's not US culture.",
          },
          {
            time: "Evening",
            activity:
              "Bus back to Cortina, dinner at Osteria al Cocoloto — northern Italian comfort food, casunziei (pink beet ravioli) is the local specialty.",
            tip: "Book ahead in summer or eat at 6pm before locals fill it.",
          },
        ],
      },
      {
        id: "day-2-lagazuoi",
        emoji: "⚔️",
        vibe: "Rifugio Lagazuoi",
        tagline: "WWI tunnels, panoramic terrace, optional via ferrata",
        schedule: [
          {
            time: "Morning",
            activity:
              "Drive or bus from Cortina to Passo Falzarego. Take the Lagazuoi cable car up (€20 one-way) to one of the best mountain terraces in the Alps.",
            tip: "Buy a one-way up, hike down through the WWI tunnels — saves €10 and is the better experience.",
          },
          {
            time: "Midday",
            activity:
              "Lunch on the Rifugio Lagazuoi sun terrace — speckknödel (bacon dumplings) and a Forst beer at 2750m.",
            tip: "If it's foggy, the food still slaps. Wait an hour — alpine weather flips fast.",
          },
          {
            time: "Afternoon",
            activity:
              "Walk down through the Galleria del Lagazuoi — restored WWI Austrian tunnels burrowing through the mountain. Bring a head torch, takes 90 minutes.",
            tip: "It's pitch dark inside. A phone flashlight works but a real head torch frees your hands on the ladders.",
          },
          {
            time: "Evening",
            activity:
              "Move base to Ortisei (Val Gardena) for the next two nights. Dinner at Anna Stuben — South Tyrolean food with a Michelin pedigree, if your budget allows.",
            tip: "Anna Stuben is the splurge. For half the price, Restaurant Mauriz serves a knockout schlutzkrapfen.",
          },
        ],
      },
      {
        id: "day-3-seceda",
        emoji: "🏞️",
        vibe: "Seceda ridgeline",
        tagline: "The cathedral of teeth from the most overused angle, in person",
        schedule: [
          {
            time: "Morning",
            activity:
              "Cable car from Ortisei to Seceda (€34 round-trip). 2500m up, the entire Geisler ridge in front of you, looking exactly like the wallpaper.",
            tip: "First lift at 8:30am. Be on it. By 11am the photo viewpoint is a queue.",
          },
          {
            time: "Midday",
            activity:
              "Walk the ridge trail toward Rifugio Firenze — 90 minutes, easy gradient, ridiculous views the entire way.",
            tip: "Wear layers. It's 25°C in Ortisei and 8°C with wind at the ridge — every June day.",
          },
          {
            time: "Afternoon",
            activity:
              "Lunch at Rifugio Firenze — kaiserschmarrn (shredded pancake with stewed berries) and a Radler. Hike back to the cable car via Col Raiser meadows.",
            tip: "Order kaiserschmarrn for two even if you're solo — it's enormous and shareable. Or just eat half and waddle.",
          },
          {
            time: "Evening",
            activity:
              "Back in Ortisei, soak feet at the public Mar Dolomit pool (€18) before dinner at Ramitzla — South Tyrolean classics, no English menu, the locals' spot.",
            tip: "Order in Italian if you can — even bad Italian gets you a noticeably warmer welcome than English.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "🗣️",
        title: "South Tyrol speaks German first",
        detail:
          "North of Cortina, German is the primary language and Italian is secondary. Menus, signs, and the conversation at the next table are in German. Learning 'grüß Gott' (hello) and 'danke' (thanks) gets a noticeably warmer reception than 'ciao.'",
      },
      {
        icon: "⛰️",
        title: "Weather flips at altitude",
        detail:
          "Sunny at the village, snowing at the rifugio. Always check the meteo report for the specific mountain pass you're aiming for. Aineva, Süd Tirol Meteo, and Bergfex are the apps locals actually use.",
      },
      {
        icon: "🥾",
        title: "Trail signage is honest about danger",
        detail:
          "Italian trail numbers in white-on-red are easy. The colored difficulty signs are not gentle — if it says EE (Escursionisti Esperti), you actually need scrambling experience. Don't bluff it.",
      },
      {
        icon: "🛌",
        title: "Rifugio etiquette is real",
        detail:
          "Earplugs, headlamp on red mode after 10pm, never wear hiking boots inside (croc-style slippers at the door). Most rifugios have a dinner-by-7:30 rule because the staff need to eat too.",
      },
    ],
    goodToKnow: {
      currency: "Euro (€)",
      language: "Italian and German (Ladin in some valleys; English in tourist towns)",
      plugType: "Type C/F/L (European standard, 230V)",
      timezone: "CEST (UTC+2 in summer)",
      emergencyNumber: "112 (or 118 for mountain rescue specifically)",
      bestSimCard: "TIM or Vodafone prepaid — €15 for 20GB at any tabacchi",
      tippingCustom:
        "Round up or leave €1–2 in rifugios; 5% in restaurants is generous. Service is usually included as 'coperto' (€2–3 per person).",
    },
    whatToPack: [
      { icon: "🥾", label: "Stiff hiking boots", reason: "Many trails are loose rock, not paths" },
      { icon: "🧥", label: "Hardshell + warm midlayer", reason: "Summer storms drop the temperature 20°C in an hour" },
      { icon: "🎒", label: "20L pack with rain cover", reason: "Day hikes need water, layers, lunch, and headlamp" },
      { icon: "🔦", label: "Headlamp", reason: "Mandatory for the Lagazuoi tunnels and any rifugio overnight" },
      { icon: "💧", label: "1.5L+ water capacity", reason: "Mountain water is glacier-cold but huts charge €5/bottle" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/vce/",
          primary: true,
          description: "Best for Venice (VCE) and Treviso (TSF) — the southern Dolomites entry",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/innsbruck-austria",
          description: "Innsbruck gets you to Alta Badia and Val Gardena faster than Venice",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/region/it/dolomites.html",
          primary: true,
          description: "Best for guesthouses across Cortina, Ortisei, and Corvara",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Dolomites--Italy/homes",
          description: "Farm-stay maso apartments at half the price of in-town hotels",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/s/?q=dolomites",
          primary: true,
          description: "Cable car combo tickets and guided hike days",
        },
        {
          provider: "Visit Dolomites",
          url: "https://www.visitdolomites.com/en/",
          description: "Official UNESCO Dolomites site — trail maps and refuge contacts",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g187835-Dolomites_Italian_Alps-Vacations.html",
          description: "User reviews for rifugios and mountain restaurants",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/dolomites-mountain-stretch.jpg", alt: "Tre Cime di Lavaredo at golden hour with hikers on the loop trail" },
    ],
  },

  "lisbon-city-pulse": {
    id: "lisbon-city-pulse",
    destination: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    description:
      "Four nights for a group that wants tiles, tram tracks, and late dinners with cheap wine. Atlantic light, hilltop miradouros every two blocks, and a nightlife pocket where the bars spill out into the street. Stop pretending you can do this in three days.",
    vibes: ["city", "food", "nightlife", "culture"],
    weather: {
      temperature: 22,
      sunHours: 10,
      seaTemperature: 17,
      precipitation: "dry",
      month: "May",
    },
    nights: 4,
    checkIn: "2026-05-21",
    checkOut: "2026-05-25",
    budget: {
      total: 380,
      range: { min: 320, max: 460 },
      perPerson: true,
      travelers: 4,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 110,
          perUnit: { amount: 110, unit: "round-trip from EU hub" },
          color: "#FF6B47",
          tips: [
            "Ryanair and easyJet fly Lisbon (LIS) from most of Europe under €100 mid-week",
            "TAP often matches budget prices when you book 8+ weeks ahead",
          ],
          typical: "Budget airline round-trip",
        },
        {
          label: "Accommodation",
          icon: "🏨",
          amount: 120,
          perUnit: { amount: 30, unit: "/night × 4 (group rate)" },
          color: "#0D7377",
          tips: [
            "A 4-bed Airbnb in Alfama runs €120–150/night total — €30–40 per person",
            "Bairro Alto is loud after midnight; Alfama or Príncipe Real sleeps better",
          ],
          typical: "Group apartment in Alfama or Príncipe Real",
        },
        {
          label: "Food & drinks",
          icon: "🍷",
          amount: 100,
          perUnit: { amount: 25, unit: "/day × 4" },
          color: "#FFB347",
          tips: [
            "Tasca menus (daily lunch specials) are €10 for soup, main, wine, coffee",
            "House vinho verde is €2 a glass — better than most €10 wines back home",
          ],
          typical: "One tasca + one nicer dinner + bar drinks",
        },
        {
          label: "Transport",
          icon: "🚋",
          amount: 20,
          perUnit: { amount: 5, unit: "/day × 4 (Viva Viagem)" },
          color: "#9B7EBD",
          tips: [
            "24h Viva Viagem pass is €6.80 — covers metro, bus, tram, funiculars",
            "Uber and Bolt are cheap (€5 across town) and faster than tram 28 with luggage",
          ],
          typical: "Daily transit pass + a couple Bolt rides",
        },
        {
          label: "Activities",
          icon: "🏰",
          amount: 30,
          perUnit: { unit: "Sintra day trip + Belém entries" },
          color: "#4ECDC4",
          tips: [
            "Pena Palace + Quinta da Regaleira combined is €18 — book online to skip queues",
            "Most miradouros (viewpoints) are free; that's where the city's best moments happen",
          ],
          typical: "Sintra entry tickets + one museum",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-alfama-tram",
        emoji: "🚋",
        vibe: "Alfama & Tram 28",
        tagline: "The yellow tram, fado dinner, sunset hilltop",
        schedule: [
          {
            time: "Morning",
            activity:
              "Pastéis de nata + bica (espresso) at Manteigaria in Chiado, then ride Tram 28 from Martim Moniz to Estrela.",
            tip: "Board at Martim Moniz (the start) — Praça do Comércio mid-route guarantees standing-room.",
          },
          {
            time: "Midday",
            activity:
              "Drop off at Largo Portas do Sol viewpoint, then wander down through Alfama's stepped alleys to lunch at Cantinho do Aziz — Mozambican prawn curry, no frills.",
            tip: "Aziz is small, cash-only, doesn't take reservations. Show up at 12:30 sharp.",
          },
          {
            time: "Afternoon",
            activity:
              "Climb to Castelo de São Jorge (€15) for the panoramic view, or skip the entrance and use Miradouro Santa Luzia for the same view, free.",
            tip: "Castelo is mostly walls and gardens — the view does the heavy lifting. Skip if you're on a tight budget.",
          },
          {
            time: "Evening",
            activity:
              "Sunset at Miradouro da Senhora do Monte (the city's highest viewpoint), then fado dinner at Tasca do Chico in Bairro Alto.",
            tip: "Tasca do Chico is tourist-heavy but the fado is the real thing. Show up before 8pm or queue.",
          },
        ],
      },
      {
        id: "day-2-belem-time-out",
        emoji: "🥮",
        vibe: "Belém & Time Out Market",
        tagline: "Pastel pilgrimage, monastery, then dinner-by-stall",
        schedule: [
          {
            time: "Morning",
            activity:
              "Tram 15 west to Belém. Pastéis de Belém (the original, 1837) — eat them warm with cinnamon and powdered sugar.",
            tip: "The takeaway queue moves fast. The sit-down hall on the right has zero wait and they bring you the same pastéis.",
          },
          {
            time: "Midday",
            activity:
              "Mosteiro dos Jerónimos (€12, book online) — the Manueline architecture is unreal. Then walk to the Belém Tower for photos from outside (skip the inside queue).",
            tip: "Online tickets save 30 minutes. The Jerónimos website (mosteirojeronimos.gov.pt) does same-day slots.",
          },
          {
            time: "Afternoon",
            activity:
              "MAAT museum riverside (€11) or just walk the Tagus promenade back to central Lisbon — flat and shaded by trees.",
            tip: "Bike rentals at Belém are €5/hour and turn the Tagus walk into the best 25 minutes of the trip.",
          },
          {
            time: "Evening",
            activity:
              "Time Out Market for dinner — 30 chef stalls, one giant shared table. Try Henrique Sá Pessoa's steak and Manteigaria for a second pastel.",
            tip: "Get there by 7:30pm or you're standing. Drinks at the central bar can be ordered without queueing the food stalls.",
          },
        ],
      },
      {
        id: "day-3-sintra",
        emoji: "🏰",
        vibe: "Sintra day trip",
        tagline: "Pena Palace, hilltop garden mazes, sunset back in Lisbon",
        schedule: [
          {
            time: "Morning",
            activity:
              "Catch the 8am train from Rossio to Sintra (40 min, €2.40 each way). Bus 434 from Sintra station to Pena Palace.",
            tip: "Book Pena Palace tickets for the 9:30am slot online the night before. Tickets sell out same-day in season.",
          },
          {
            time: "Midday",
            activity:
              "Pena Palace (€14) — half kitsch, half magnificent, all photogenic. Walk down through the park (free) to the gates.",
            tip: "Buy 'park + palace' not just 'park.' The interior is what you came for; the park is a long walk on top of it.",
          },
          {
            time: "Afternoon",
            activity:
              "Lunch at Tascantiga in Sintra town — sharing plates, decent prices, sit on the terrace. Then Quinta da Regaleira (€12) — the initiation well is the actual attraction.",
            tip: "At Regaleira, go down the well first while everyone else is photographing the surface. You'll have the underground tunnels to yourself.",
          },
          {
            time: "Evening",
            activity:
              "Train back to Lisbon. Sunset at Miradouro de São Pedro de Alcântara in Bairro Alto, then ginjinha shots at A Ginjinha (Rossio) before dinner.",
            tip: "Ginjinha is €1.40 a shot — sour cherry liqueur, served in a chocolate cup. The cup is the move.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "🥮",
        title: "Pastéis are made all day",
        detail:
          "Locals don't queue for pastéis at 4pm. Bakeries make them in batches every 2 hours — Manteigaria pulls a fresh tray every 20 minutes. Walk past any spot with a queue and find the next one.",
      },
      {
        icon: "💶",
        title: "Couvert is not free",
        detail:
          "The bread, olives, and cheese plate that 'arrives' at your table is charged unless you wave it back. €3–6 per person if you eat it. No shame in saying 'não, obrigado.'",
      },
      {
        icon: "🕘",
        title: "Bairro Alto is closed until 9",
        detail:
          "The nightlife district feels like a residential street until about 9:30pm, then it explodes. Show up at 7pm and you'll think you got bad directions.",
      },
      {
        icon: "🚇",
        title: "Tram 28 is also a pickpocket bus",
        detail:
          "It's a real working tram and a tourist landmark. Keep your phone and wallet in front pockets, hand on bag, especially at the Sé and Graça stops. Locals know.",
      },
    ],
    goodToKnow: {
      currency: "Euro (€)",
      language: "Portuguese (English universal in central Lisbon; Spanish ≠ Portuguese, don't try)",
      plugType: "Type C/F (European standard, 230V)",
      timezone: "WEST (UTC+1 in summer, 1 hour behind central Europe)",
      emergencyNumber: "112",
      bestSimCard: "MEO or NOS prepaid — €15 for 15GB at Vodafone/MEO shops or kiosks",
      tippingCustom:
        "Round up or 5–10% in restaurants. 10% is generous, not expected. Service is not included.",
    },
    whatToPack: [
      { icon: "👟", label: "Grippy sneakers", reason: "Calçada Portuguesa cobbles are slippery, especially on hills" },
      { icon: "🧥", label: "Light jacket for evenings", reason: "Atlantic breeze drops the temperature after sunset" },
      { icon: "🧴", label: "SPF 30+", reason: "May UV is stronger than it feels — the breeze hides it" },
      { icon: "🎒", label: "Crossbody bag with zips", reason: "Tram 28 and central Baixa have active pickpockets" },
      { icon: "🩴", label: "Comfortable sandals", reason: "You'll walk 15km+ a day; bring two pairs and rotate" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/lis/",
          primary: true,
          description: "Best for Ryanair and easyJet routes into Lisbon (LIS)",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/lisbon-portugal",
          description: "Good for open-jaw trips combining Lisbon with Porto or Madrid",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/city/pt/lisbon.html",
          primary: true,
          description: "Group apartments in Alfama, Príncipe Real, and Chiado",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Lisbon--Portugal/homes",
          description: "Often cheaper than hotels for groups of 4+",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/lisbon-l42/",
          primary: true,
          description: "Skip-the-line Pena Palace tickets and Sintra day tours",
        },
        {
          provider: "Lisbon Walker",
          url: "https://www.lisbonwalker.com/",
          description: "Themed walking tours — Old Town, Lisbon Legends, and Mysteries",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g189158-Lisbon_Lisbon_District_Central_Portugal-Vacations.html",
          description: "User reviews for restaurants, fado houses, and Sintra logistics",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/lisbon-city-pulse.jpg", alt: "Lisbon tram 28 climbing a steep Alfama street at golden hour" },
    ],
  },

  "romantic-lago-di-como": {
    id: "romantic-lago-di-como",
    destination: "Lago di Como",
    country: "Italy",
    countryCode: "IT",
    description:
      "Four nights of cypress-lined ferry hops, villas with stupid views, and dinners where the waiter pours wine and you forget what your phone is for. Designed for couples who'd rather be slow than sightseeing.",
    vibes: ["romantic", "lake", "italy", "slow-pace"],
    weather: {
      temperature: 20,
      sunHours: 8,
      seaTemperature: 16,
      precipitation: "mixed",
      month: "May",
    },
    nights: 4,
    checkIn: "2026-05-25",
    checkOut: "2026-05-29",
    budget: {
      total: 520,
      range: { min: 440, max: 640 },
      perPerson: true,
      travelers: 2,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 100,
          perUnit: { amount: 100, unit: "round-trip into MXP or BGY" },
          color: "#FF6B47",
          tips: [
            "Fly into Bergamo (BGY) for Ryanair, Milan Malpensa (MXP) for everyone else",
            "Trenord goes Malpensa → Varenna in 90 minutes, €15 — beats any transfer",
          ],
          typical: "Budget airline + train to the lake",
        },
        {
          label: "Accommodation",
          icon: "🏨",
          amount: 240,
          perUnit: { amount: 60, unit: "/night × 4 (per person, couple room)" },
          color: "#0D7377",
          tips: [
            "Varenna and Menaggio are 40% cheaper than Bellagio for the same lake view",
            "B&Bs near the ferry pier book up by March for May/June — lock it early",
          ],
          typical: "Couple's room in a small lakeside B&B",
        },
        {
          label: "Food & drinks",
          icon: "🍝",
          amount: 120,
          perUnit: { amount: 30, unit: "/day × 4" },
          color: "#FFB347",
          tips: [
            "Lago di Como pricing climbs every July — May menus are €5–8 cheaper per plate",
            "Lunch trattorias offer 2-course menus for €18 that match €40 dinner menus",
          ],
          typical: "One trattoria lunch + one terrace dinner daily",
        },
        {
          label: "Transport",
          icon: "⛴️",
          amount: 30,
          perUnit: { unit: "ferry day pass + train transfers" },
          color: "#9B7EBD",
          tips: [
            "Navigazione Laghi day pass is €23 — unlimited ferry between Bellagio/Varenna/Menaggio",
            "Skip the car. Driving the lake is hours of switchbacks and zero parking",
          ],
          typical: "Ferry pass + airport train",
        },
        {
          label: "Activities",
          icon: "🌳",
          amount: 30,
          perUnit: { unit: "Villa del Balbianello + 1 garden" },
          color: "#4ECDC4",
          tips: [
            "Villa del Balbianello (€22) is the cinematic one — Star Wars and James Bond filmed here",
            "Villa Melzi gardens in Bellagio are €8 and just as romantic without the crowds",
          ],
          typical: "One iconic villa + one garden",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-varenna",
        emoji: "🚢",
        vibe: "Varenna & evening swim",
        tagline: "Arrive, drop bags, dock-side aperitivo",
        schedule: [
          {
            time: "Morning",
            activity:
              "Trenord direct from Milano Centrale to Varenna-Esino (1h 5min, €7). Walk five minutes downhill from the station to the lake.",
            tip: "Sit on the right side of the train after Lecco for the lake-side first impression.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Il Caminetto in Gittana (above Varenna) — family-run, lake-view terrace, pasta with porcini.",
            tip: "Reserve ahead and they'll send a free shuttle from Varenna. Don't drive — the road is one car wide.",
          },
          {
            time: "Afternoon",
            activity:
              "Walk the Passeggiata degli Innamorati (Lovers' Walk) along Varenna's cliff edge — 800m, takes 20 minutes, no traffic.",
            tip: "Most photographed angle is from the second tunnel — bench right after, face east.",
          },
          {
            time: "Evening",
            activity:
              "Aperitivo at Bar Il Molo on the harbor — €10 spritzes and a free plate of olives, salumi, and focaccia at 6pm sharp.",
            tip: "Sit on the rocks below the bar, not the terrace, for the postcard view.",
          },
        ],
      },
      {
        id: "day-2-bellagio-balbianello",
        emoji: "🌺",
        vibe: "Bellagio & Villa del Balbianello",
        tagline: "Ferry across, walk the lakefront, villa terrace at sunset",
        schedule: [
          {
            time: "Morning",
            activity:
              "Ferry from Varenna to Bellagio (15 minutes, €5.20). Coffee on the lakefront at Bar Rossi — house specialty is a caffè con panna with the cream from the local dairy.",
            tip: "Take the slow ferry (battello), not the hydrofoil (aliscafo). It's the same fare and you can sit outside.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Ristorante Silvio in Bellagio — caught-that-morning lake fish, family-run since 1919, half-pension prices.",
            tip: "Order the misto del lago — three lake fish prepared three different ways. Tells you what's actually swimming below you.",
          },
          {
            time: "Afternoon",
            activity:
              "Ferry from Bellagio to Lenno, then short walk to Villa del Balbianello (€22). The peninsula garden where Star Wars II's lake scenes were filmed.",
            tip: "Take the boat shuttle from Lenno (€5 round trip) instead of walking the cliff path — saves 45 minutes and is the better arrival.",
          },
          {
            time: "Evening",
            activity:
              "Back to Varenna for dinner at Vecchia Varenna — same family for three generations, terrace right on the water.",
            tip: "Order the missoltini (sun-dried shad) if you want to taste what the lake tasted like 200 years ago. Then order something else for the actual dinner.",
          },
        ],
      },
      {
        id: "day-3-menaggio-sunset-boat",
        emoji: "🌅",
        vibe: "Menaggio & sunset boat",
        tagline: "Lazy lakefront, private boat hour, dinner up the hill",
        schedule: [
          {
            time: "Morning",
            activity:
              "Ferry to Menaggio. Walk the lakefront promenade north toward Loveno — 25 minutes one-way, mostly flat, zero crowds.",
            tip: "Coffee stop at Bar Centrale on Piazza Garibaldi. Same price as anywhere else but the people-watching is upgraded.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Osteria il Pozzo — sunken Roman courtyard, lake trout with hazelnut butter, €25 menu.",
            tip: "Sit in the courtyard, not the front room. The walls are 600 years old and they keep it cool.",
          },
          {
            time: "Afternoon",
            activity:
              "Hire a private boat for an hour (€80–100 from Menaggio's harbor). Skipper drives you past Villa Carlotta, Villa del Balbianello, into hidden coves.",
            tip: "Book at the harbor in person the morning of — no online platform matches the local rate.",
          },
          {
            time: "Evening",
            activity:
              "Dinner at La Vecchia Magnolia in Tremezzo (10 min ferry from Menaggio) — lake-view terrace, candle-lit, books out in summer but quiet in May.",
            tip: "Last ferry back to Menaggio is around 10pm — check the Navigazione Laghi app before you commit to a late dinner.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "⛴️",
        title: "Live by the ferry timetable",
        detail:
          "Navigazione Laghi runs the whole lake — slow ferries (battelli) and faster hydrofoils (aliscafi). Download their app. The schedule changes monthly; the printed signs at piers are often outdated.",
      },
      {
        icon: "🍽️",
        title: "Coperto and servizio are not the same",
        detail:
          "Coperto (€2–4 per person) is the bread-and-cover charge, not a tip. Servizio (10%) is sometimes added on weekends. Both are listed at the menu's bottom — read before you tip extra.",
      },
      {
        icon: "🚗",
        title: "Drive nothing on the lake",
        detail:
          "The roads are narrow, the parking is €5/hour if you find it, and the tunnels are stressful. Use ferries between towns, taxis or buses for villages above. Save the car for the airport transfer only.",
      },
      {
        icon: "🌸",
        title: "May vs July is a different lake",
        detail:
          "Hotels in May are 30% cheaper than July, restaurants take walk-ins, and the gardens are at peak bloom. The water is too cold to swim, but that's not why you came.",
      },
    ],
    goodToKnow: {
      currency: "Euro (€)",
      language: "Italian (English in tourist towns, especially Bellagio and Varenna)",
      plugType: "Type C/F/L (European standard, 230V)",
      timezone: "CEST (UTC+2 in summer)",
      emergencyNumber: "112",
      bestSimCard: "TIM or Vodafone prepaid — €15 for 20GB at any tabacchi in Milan or Como",
      tippingCustom:
        "Round up or leave €2–5 in restaurants. Tipping over 10% confuses servers. Don't tip in cafés.",
    },
    whatToPack: [
      { icon: "🧥", label: "Light blazer or smart layer", reason: "Lake-view restaurants lean dressier than coastal Italy" },
      { icon: "👟", label: "Comfortable but presentable shoes", reason: "Stone alleys + dinner reservations — no flip-flops" },
      { icon: "☂️", label: "Compact umbrella", reason: "May has unpredictable lake-effect showers" },
      { icon: "📱", label: "Phone + Navigazione Laghi app", reason: "The ferry timetable runs your entire week" },
      { icon: "👓", label: "Sunglasses", reason: "Lake glare from 10am onwards is intense" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/mxp/",
          primary: true,
          description: "Best for Milan Malpensa (MXP) and Bergamo (BGY) routes",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/milan-italy",
          description: "Good for combining Milan with another Italian city",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/region/it/lakecomo.html",
          primary: true,
          description: "B&Bs and small hotels in Varenna, Menaggio, and Bellagio",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Varenna--Italy/homes",
          description: "Lakeside apartments often cheaper than hotels in shoulder season",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/lake-como-l2102/",
          primary: true,
          description: "Villa del Balbianello tickets and private boat tours",
        },
        {
          provider: "Navigazione Laghi",
          url: "https://www.navigazionelaghi.it/",
          description: "Official ferry company — timetables, day passes, online tickets",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g187858-Lake_Como_Lombardy-Vacations.html",
          description: "User reviews for villas, restaurants, and ferry routes",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/romantic-lago-di-como.jpg", alt: "Lago di Como ferry approaching Varenna at golden hour" },
    ],
  },

  "slovenia-family-adventure": {
    id: "slovenia-family-adventure",
    destination: "Slovenia",
    country: "Slovenia",
    countryCode: "SI",
    description:
      "Five nights for a family that's done the beach-resort thing and is ready to swim in a glacial river, paddle to a church on a lake island, and eat cream cake bigger than a kid's face. Bled for the postcards, Soča Valley for the adventure.",
    vibes: ["family", "nature", "adventure", "alpine"],
    weather: {
      temperature: 22,
      sunHours: 7,
      seaTemperature: 0,
      precipitation: "mixed",
      month: "June",
    },
    nights: 5,
    checkIn: "2026-06-08",
    checkOut: "2026-06-13",
    budget: {
      total: 620,
      range: { min: 540, max: 740 },
      perPerson: false,
      travelers: 4,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 160,
          perUnit: { amount: 40, unit: "/person × 4" },
          color: "#FF6B47",
          tips: [
            "Wizz Air flies Ljubljana (LJU) from most of central and eastern Europe under €50 booked early",
            "Trieste (TRS) and Klagenfurt (KLU) are 1-hour drives away and often cheaper",
          ],
          typical: "Budget airline round-trips for 4",
        },
        {
          label: "Accommodation",
          icon: "🏡",
          amount: 240,
          perUnit: { amount: 48, unit: "/night × 5 (family apartment)" },
          color: "#0D7377",
          tips: [
            "Self-catering apartments are €40–60/night for a family in Bled and Bovec — way better than hotels",
            "Stay 2 nights in Bled, 3 in Bovec/Kobarid to minimize driving with kids",
          ],
          typical: "Family apartments with kitchens",
        },
        {
          label: "Food & drinks",
          icon: "🥧",
          amount: 100,
          perUnit: { amount: 20, unit: "/day × 5 (family rate)" },
          color: "#FFB347",
          tips: [
            "Apartment breakfast + one restaurant meal a day keeps costs sane",
            "Gostilna (village inns) do 3-course family menus for €15/adult, half for kids",
          ],
          typical: "One family meal out + groceries",
        },
        {
          label: "Transport",
          icon: "🚗",
          amount: 40,
          perUnit: { unit: "rental car + fuel" },
          color: "#9B7EBD",
          tips: [
            "Compact car rental is €25/day from Ljubljana airport — essential for Soča Valley",
            "Slovenia's motorway sticker (vinjeta) is €16/week, mandatory, bought at any petrol station",
          ],
          typical: "Compact car + vignette + fuel",
        },
        {
          label: "Activities",
          icon: "🛶",
          amount: 80,
          perUnit: { unit: "rafting + Vintgar + pletna boat" },
          color: "#4ECDC4",
          tips: [
            "Soča rafting with Bovec Rafting Team is €45/adult, €30/kid — minimum age 6",
            "Vintgar Gorge entrance is €10/adult; pletna boat to Bled Island is €18 round-trip",
          ],
          typical: "Rafting + gorge + island boat for 4",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-bled-vintgar",
        emoji: "🛶",
        vibe: "Bled & Vintgar Gorge",
        tagline: "Lake church, gorge walk, cream-cake bribe for the kids",
        schedule: [
          {
            time: "Morning",
            activity:
              "Pick up rental at Ljubljana airport (LJU), drive 45 minutes to Bled. Park at Bled Castle and walk down — cheaper than the lake-front lots.",
            tip: "Use parking.bled.si to see live availability. Castle lot is €3/hour; lake-front lots are €5.",
          },
          {
            time: "Midday",
            activity:
              "Pletna boat (the traditional flat-bottomed gondola) from Mlino harbor to Bled Island (€18/adult, €10/child). Climb the 99 steps to the Church of the Assumption and ring the wishing bell.",
            tip: "Mlino-side pletnas are 50% less crowded than the Bled-town side, same boat, same destination.",
          },
          {
            time: "Afternoon",
            activity:
              "Drive 15 minutes to Vintgar Gorge — wooden boardwalk over a 1.6km Soča-blue river canyon, ends at a waterfall. Easy for kids 5+.",
            tip: "Book the Vintgar slot online (vintgar.si) — it's timed entry now to control crowds. Aim for 3pm onwards when morning tours clear out.",
          },
          {
            time: "Evening",
            activity:
              "Kremšnita (cream cake) on the Park Hotel Bled terrace — the original recipe since 1953. Dinner at Gostilna Pri Planincu for hearty Slovenian classics like štruklji and ajdovi žganci.",
            tip: "Kremšnita is hilarious in size — order two slices for four people. The kids will thank you for the volume.",
          },
        ],
      },
      {
        id: "day-2-bled-to-bovec",
        emoji: "🚗",
        vibe: "Bled to Bovec drive",
        tagline: "Mountain pass, picnic by the river, Soča blue water",
        schedule: [
          {
            time: "Morning",
            activity:
              "Drive south from Bled to Kranjska Gora (45 min), then over the Vršič Pass — 50 hairpin bends, panoramic Julian Alps views, 30 minutes of slow driving.",
            tip: "Stop at hairpin #24 for the Russian Chapel (Ruska Kapelica). Free entry, 10 minutes, worth the leg stretch.",
          },
          {
            time: "Midday",
            activity:
              "Descend into the Soča Valley, picnic at the Soča Source car park — short 15-min walk to where the river bursts from rock.",
            tip: "Buy lunch supplies at the Mercator in Kranjska Gora before climbing the pass. There's nothing on Vršič itself.",
          },
          {
            time: "Afternoon",
            activity:
              "Continue down to Bovec (1 hour). Check into your apartment, walk to the Boka Waterfall viewpoint — 30 minutes round-trip from the road, Slovenia's highest waterfall.",
            tip: "The viewpoint trail starts opposite the bus stop — there's no big sign. Look for the wooden footbridge over the stream.",
          },
          {
            time: "Evening",
            activity:
              "Dinner at Gostilna Sovdat in Bovec — local trout, polenta, and apple strudel. Family-run, casual, kids welcome.",
            tip: "Order Bovški krafi — local cheese-and-pear pasta you can't get anywhere else in Slovenia.",
          },
        ],
      },
      {
        id: "day-3-soca-tolmin",
        emoji: "🛟",
        vibe: "Soča rafting & Tolmin Gorges",
        tagline: "Glacier-blue rafting morning, narrow canyon afternoon",
        schedule: [
          {
            time: "Morning",
            activity:
              "Family rafting with Bovec Rafting Team on the Soča River — 10km, Class II–III, gentle enough for kids 6+. Wetsuits, helmets, and a safety briefing included.",
            tip: "Book the 9am slot — the river is calmer, the sun isn't beating you, and you finish in time for lunch.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Gostilna Letni Vrt in Bovec or pack sandwiches from Mercator. Drive south to Tolmin (45 min) — easy road following the river.",
            tip: "Stop at Napoleon Bridge (Most na Soči viewpoint) en route — postcard angle of the Soča and Tolminka rivers meeting.",
          },
          {
            time: "Afternoon",
            activity:
              "Tolmin Gorges (€8/adult, €4/kid) — narrow walking trail through the deepest canyon in Triglav National Park. 1.5-hour loop, easy with kids.",
            tip: "The 'Bear's Head' rock above the trail is the photo spot. Look up halfway through — it's easy to miss.",
          },
          {
            time: "Evening",
            activity:
              "Drive back to Bovec, dinner at Pizzerija Letni Vrt — wood-fired pizzas big enough to share, garden seating, the kids run around safely.",
            tip: "Order the Bovec local craft beer (Pelicon brewery, 30 minutes away). The pale ale pairs with everything.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "🚗",
        title: "The vignette is non-negotiable",
        detail:
          "All Slovenian motorways require a vignette (vinjeta) sticker on your windshield. €16 for a week. Sold at any petrol station near the border. Fines for driving without are €150 — they check.",
      },
      {
        icon: "👶",
        title: "Kids are welcomed everywhere",
        detail:
          "Slovenia is one of Europe's most family-friendly countries. Restaurants have high chairs, no one tuts at noise, and gostilnas often have free playgrounds out back. Bring kids to dinner without apology.",
      },
      {
        icon: "💧",
        title: "Tap water is glacier-quality",
        detail:
          "Slovenia's drinking water is genuinely some of the best in Europe — straight from alpine sources. Refill bottles from any tap or village fountain. The Soča River is drinkable upstream.",
      },
      {
        icon: "📅",
        title: "Sunday means closed",
        detail:
          "Most supermarkets and many shops close Sundays. Plan groceries for Saturday, especially in smaller towns like Bovec. Bakeries and restaurants stay open.",
      },
    ],
    goodToKnow: {
      currency: "Euro (€)",
      language: "Slovenian (English widely spoken, especially with younger generations)",
      plugType: "Type C/F (European standard, 230V)",
      timezone: "CEST (UTC+2 in summer, same as central Europe)",
      emergencyNumber: "112 (or 113 for mountain rescue)",
      bestSimCard: "Telekom Slovenije or A1 prepaid — €15 for 20GB at any kiosk or petrol station",
      tippingCustom:
        "Round up or add 10% in restaurants for good service. Service is not included. Tipping in cafés is unusual — locals just round up.",
    },
    whatToPack: [
      { icon: "🩱", label: "Quick-dry swimwear", reason: "Soča swimming and Bled Lake swims need wetsuit-grade speed-dry" },
      { icon: "🥾", label: "Sneakers or trail shoes", reason: "Vintgar and Tolmin Gorge boardwalks get slick after rain" },
      { icon: "🧥", label: "Rain layer + warm fleece", reason: "Alpine weather flips fast; June can drop to 8°C in the valley" },
      { icon: "🧴", label: "Insect repellent", reason: "Tolmin and forested areas have mosquitoes near the rivers" },
      { icon: "🍫", label: "Snacks for the kids", reason: "Mountain roads have long gaps between shops" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/lju/",
          primary: true,
          description: "Best for direct flights into Ljubljana (LJU) and nearby Trieste (TRS)",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/ljubljana-slovenia",
          description: "Good for routing via Vienna or Munich and renting a car at a bigger hub",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/city/si/bled.html",
          primary: true,
          description: "Family apartments in Bled and Bovec at family-friendly prices",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Bovec--Slovenia/homes",
          description: "Whole-house rentals near the Soča River often cheaper for families",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/bled-l2103/",
          primary: true,
          description: "Pre-booked Vintgar Gorge slots, pletna boats, and Bled Castle tickets",
        },
        {
          provider: "Bovec Rafting Team",
          url: "https://www.bovec-rafting-team.com/",
          description: "Family-friendly Soča rafting and canyoning, minimum age 6",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g274856-Slovenia-Vacations.html",
          description: "User reviews for accommodations and family activities across Slovenia",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/slovenia-family-adventure.jpg", alt: "Lake Bled island church with pletna boat in foreground" },
    ],
  },

  "tbilisi-underrated-capital": {
    id: "tbilisi-underrated-capital",
    destination: "Tbilisi",
    country: "Georgia",
    countryCode: "GE",
    description:
      "Six nights in the capital nobody books and everyone who goes loves. Wooden balconies on the verge of collapse, sulfur baths in stone domes, and supra dinners that escalate into life philosophy by toast #8. Designed for couples curious enough to skip the obvious.",
    vibes: ["underrated", "food", "culture", "wine"],
    weather: {
      temperature: 22,
      sunHours: 8,
      seaTemperature: 0,
      precipitation: "mixed",
      month: "May",
    },
    nights: 6,
    checkIn: "2026-05-15",
    checkOut: "2026-05-21",
    budget: {
      total: 410,
      range: { min: 340, max: 510 },
      perPerson: true,
      travelers: 2,
      breakdown: [
        {
          label: "Flights",
          icon: "✈️",
          amount: 170,
          perUnit: { amount: 170, unit: "round-trip to TBS from EU" },
          color: "#FF6B47",
          tips: [
            "Wizz Air flies Tbilisi (TBS) from Vienna, Warsaw, and Milan — €150–200 round-trip if booked 6+ weeks ahead",
            "Late-night arrivals are normal; book a hotel that confirms 1am check-in",
          ],
          typical: "Budget airline round-trip",
        },
        {
          label: "Accommodation",
          icon: "🏨",
          amount: 100,
          perUnit: { amount: 17, unit: "/night × 6 (per person, couple room)" },
          color: "#0D7377",
          tips: [
            "Boutique hotels in Old Town from €40/night for a couple — way better than Tbilisi's chain hotels",
            "Vera and Sololaki are the quietest central neighborhoods",
          ],
          typical: "Boutique hotel or Airbnb in Old Town",
        },
        {
          label: "Food & drinks",
          icon: "🍷",
          amount: 90,
          perUnit: { amount: 15, unit: "/day × 6" },
          color: "#FFB347",
          tips: [
            "Khinkali dumplings are €0.50 each — a supra dinner for two with wine runs €25",
            "Georgian wine is €3 a glass; a bottle of natural amber wine is €8–12",
          ],
          typical: "Two restaurant meals + bar wine daily",
        },
        {
          label: "Transport",
          icon: "🚇",
          amount: 20,
          perUnit: { unit: "metro, marshrutkas, occasional Bolt" },
          color: "#9B7EBD",
          tips: [
            "Tbilisi metro is €0.30 a ride (1 GEL) — use a MetroMoney card from any station",
            "Bolt is everywhere: €3 across town, €15 from the airport to Old Town",
          ],
          typical: "Transit card + 2–3 Bolt rides",
        },
        {
          label: "Activities",
          icon: "♨️",
          amount: 30,
          perUnit: { unit: "sulfur bath + Kakheti day trip" },
          color: "#4ECDC4",
          tips: [
            "Chreli Abano sulfur baths are €15/hour for a private room",
            "Day tour to Kakheti wine country is €35/person with hotel pickup",
          ],
          typical: "Private bath + wine country day",
        },
      ],
    },
    mustDo: [],
    dayPlans: [
      {
        id: "day-1-old-town-baths",
        emoji: "♨️",
        vibe: "Old Town & sulfur baths",
        tagline: "Wooden balconies, dome-roofed bathhouse, first supra",
        schedule: [
          {
            time: "Morning",
            activity:
              "Wander Old Town's lopsided wooden balconies in the morning light — Betlemi street up to the Narikala Fortress. The funicular up is €1.50 each way.",
            tip: "Walk down from Narikala via the Mother of Georgia statue path. The descent has the best Old Town photo angles.",
          },
          {
            time: "Midday",
            activity:
              "Lunch at Pasanauri on Pushkin Street — the gold standard for khinkali (Georgian soup dumplings), order them by the dozen.",
            tip: "Eat khinkali with your hands: pinch the top knob, bite a hole, slurp the broth, then eat the rest. Never use a fork or you'll get politely stared at.",
          },
          {
            time: "Afternoon",
            activity:
              "Abanotubani sulfur bath district — book a private room at Chreli Abano (€15/hour) or No. 5 Royal Bath. Sulfur smell is real, the soak is unreal.",
            tip: "Book ahead by phone or in person — the private rooms have walk-in tubs and a small steam corner.",
          },
          {
            time: "Evening",
            activity:
              "Dinner at Shavi Lomi (Black Lion) for an upscale-rustic Georgian supra — eggplant rolls, badrijani, khachapuri Adjaruli (boat-shaped cheese bread with egg).",
            tip: "Book ahead — Shavi Lomi is the most charming dining room in Tbilisi and locals know.",
          },
        ],
      },
      {
        id: "day-2-mtatsminda-wine",
        emoji: "🍷",
        vibe: "Mtatsminda & wine bars",
        tagline: "Sunset funicular, wine flight, midnight khachapuri",
        schedule: [
          {
            time: "Morning",
            activity:
              "Breakfast at Café Linville in Vake — Tbilisi's most underrated brunch, sit on the leafy terrace.",
            tip: "Order the chashushuli (slow-cooked beef in tomato) instead of the European brunch options. Trust.",
          },
          {
            time: "Midday",
            activity:
              "Walk Rustaveli Avenue — Tbilisi's main boulevard, drop into the Georgian National Museum (€7) for the prehistoric gold collection.",
            tip: "The pre-Christian gold from Vani is jaw-dropping. Skip the lower floors and head straight to the Treasury.",
          },
          {
            time: "Afternoon",
            activity:
              "Mtatsminda Funicular (€1) up to Mtatsminda Park for the panoramic city view. Coffee at the rooftop café, then ride back down to Rustaveli.",
            tip: "Go up at 5:30pm to catch sunset over the Trinity Cathedral. The summit park is also a Soviet-era theme park, which is its own oddity.",
          },
          {
            time: "Evening",
            activity:
              "Wine flight at 8000 Vintages — natural Georgian wines, English-speaking sommeliers, an entire orange wine education in one sitting.",
            tip: "Order the qvevri flight — wines made in the traditional clay vessels. Skin contact whites are the Georgian signature.",
          },
        ],
      },
      {
        id: "day-3-kakheti-wine",
        emoji: "🍇",
        vibe: "Kakheti wine country",
        tagline: "Hilltop town, family winery, supra lunch that won't quit",
        schedule: [
          {
            time: "Morning",
            activity:
              "Day tour to Kakheti (€35/person, picked up from hotel at 9am) or rent a car. Drive 2 hours east to Sighnaghi — the 'City of Love' on a hilltop overlooking the Alazani Valley.",
            tip: "If renting, avoid driving the Mtskheta-Tbilisi highway after dark. Daytime is fine; nighttime is a different sport.",
          },
          {
            time: "Midday",
            activity:
              "Walk the Sighnaghi city walls — 4km loop, 23 towers, all 18th-century. Coffee at Pheasant's Tears wine bar.",
            tip: "Pheasant's Tears makes some of Georgia's best amber wines. The €15 tasting flight is genuinely educational.",
          },
          {
            time: "Afternoon",
            activity:
              "Drive 30 minutes to Telavi region for a family-winery supra — long lunch with toasts, qvevri wines, mtsvadi (Georgian shashlik). Many tour operators include this; if independent, book Twins Wine Cellar.",
            tip: "There will be vodka after the wine. There will be more toasts than you expected. The tamada (toastmaster) is sacred — let him lead.",
          },
          {
            time: "Evening",
            activity:
              "Back in Tbilisi, late-night khinkali at Zakhar Zakharich — gritty, no-English-menu, the locals' midnight spot.",
            tip: "Open until 5am. Pay in cash. Don't bother attempting English — point at what someone else is eating.",
          },
        ],
      },
    ],
    itinerary: [],
    localWisdom: [
      {
        icon: "🥖",
        title: "Supra is not just dinner",
        detail:
          "A supra is a Georgian feast led by a tamada (toastmaster). Each toast is an essay. You drink at each one. Saying no to a toast is rude; sipping is fine. Pace yourself — there will be 12.",
      },
      {
        icon: "💶",
        title: "Lari, not euro",
        detail:
          "Georgian Lari (GEL) is the only legal currency. 1 EUR ≈ 3 GEL. ATMs are everywhere; TBC Bank and Bank of Georgia are fee-friendly. Avoid Euronet. Card is accepted in central Tbilisi but cash rules in marshrutkas and small Old Town spots.",
      },
      {
        icon: "🚖",
        title: "Bolt over Yandex",
        detail:
          "Bolt is the local Uber — cheap, reliable, English app. Yandex also works but is slightly pricier. Hailing a taxi on the street gets you scammed unless you speak Russian or Georgian. Use the app.",
      },
      {
        icon: "🗣️",
        title: "Older generation speaks Russian, not English",
        detail:
          "Under 30 speaks decent English; over 50 mostly speaks Russian and Georgian. Learning 'gamarjoba' (hello) and 'madloba' (thanks) buys huge goodwill. Don't speak Russian unless you can do it well — it's politically loaded.",
      },
    ],
    goodToKnow: {
      currency: "Georgian Lari (GEL, ₾) — €1 ≈ 3 GEL",
      language: "Georgian (English in central Tbilisi, Russian among older locals)",
      plugType: "Type C/F (European standard, 220V)",
      timezone: "GET (UTC+4 in summer, 2 hours ahead of central Europe)",
      emergencyNumber: "112",
      bestSimCard: "Magti or Geocell prepaid — 30 GEL (~€10) for 25GB, sold at any kiosk or the airport on arrival",
      tippingCustom:
        "10% in restaurants is standard; it's often already added to the bill (check the 'service' line). Round up in taxis. No tipping in supras — it's family.",
    },
    whatToPack: [
      { icon: "🩴", label: "Slip-on shoes", reason: "Sulfur baths and many guesthouses are shoes-off" },
      { icon: "🧥", label: "Light layers", reason: "May days hit 25°C; evenings can drop to 12°C with mountain wind" },
      { icon: "💊", label: "Stomach settler", reason: "Food is incredible, but qvevri wines and rich meats catch up to you by day 4" },
      { icon: "📱", label: "Bolt + Google Translate apps", reason: "Bolt is your taxi; Translate handles Cyrillic/Georgian menus" },
      { icon: "🧣", label: "Modest cover for churches", reason: "Trinity Cathedral and monasteries require knees/shoulders covered" },
    ],
    booking: {
      flights: [
        {
          provider: "Skyscanner",
          url: "https://www.skyscanner.com/transport/flights-to/tbs/",
          primary: true,
          description: "Best for Wizz Air and Pegasus routes into Tbilisi (TBS)",
        },
        {
          provider: "Kiwi.com",
          url: "https://www.kiwi.com/en/search/results/anywhere/tbilisi-georgia",
          description: "Good for routing via Istanbul or Warsaw with overnight stopovers",
        },
      ],
      hotels: [
        {
          provider: "Booking.com",
          url: "https://www.booking.com/city/ge/tbilisi.html",
          primary: true,
          description: "Boutique hotels in Old Town, Sololaki, and Vera",
        },
        {
          provider: "Airbnb",
          url: "https://www.airbnb.com/s/Tbilisi--Georgia/homes",
          description: "Apartments in restored Old Town buildings — often cheaper than hotels",
        },
      ],
      activities: [
        {
          provider: "GetYourGuide",
          url: "https://www.getyourguide.com/tbilisi-l1145/",
          primary: true,
          description: "Kakheti wine day tours, food walks, and Mtskheta day trips",
        },
        {
          provider: "Georgia Travel",
          url: "https://georgia.travel/",
          description: "Official tourism site — practical info on routes, marshrutka schedules, and visa rules",
        },
      ],
      reviews: [
        {
          provider: "TripAdvisor",
          url: "https://www.tripadvisor.com/Tourism-g294195-Tbilisi-Vacations.html",
          description: "User reviews for restaurants, baths, and tour operators",
        },
      ],
    },
    photos: [
      { url: "/quick-picks/tbilisi-underrated-capital.jpg", alt: "Tbilisi Old Town wooden balconies with Narikala Fortress above" },
    ],
  },
};

export function getQuickPickTrip(slug: string): TripDetail | undefined {
  return QUICK_PICK_TRIPS[slug];
}
