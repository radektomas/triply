// Microcopy banks for the "Guess the city" mini-game and the loading overlay.
// Pulled into stable per-render strings via getRandomQuote so re-renders don't
// reroll the line under the user.

export const CORRECT_QUOTES = [
  "Nailed it. ✈️",
  "Ok geographer 👀",
  "You're going places.",
  "Atlas vibes only.",
  "Passport-worthy.",
  "Big globe energy.",
  "Sherlock of cities.",
  "Were you born there or what?",
  "Bro went to school.",
  "Confidence: justified.",
];

export const WRONG_QUOTES = [
  "Bold guess. Wrong, but bold.",
  "Geography teacher disappointed.",
  "Close-ish. Continent-ish.",
  "We don't talk about that one.",
  "Plot twist: you were wrong.",
  "Atlas would like a word.",
  "Vibes were off.",
  "Maybe stick to the trip part.",
  "Google Maps is free btw.",
  "Not the W you wanted.",
];

export const PERFECT_QUOTES = [
  "3/3. Cartographer behavior.",
  "Flawless. Book the flight.",
  "Geography PhD energy.",
  "You should be planning OUR trips.",
  "Triply employee of the month.",
];

export const ZERO_QUOTES = [
  "0/3. We'll plan the trip anyway.",
  "Geography isn't for everyone. Travel is.",
  "Don't worry, the AI got this.",
  "Skill issue. But the trip will slap.",
  "0/3 and still going on vacation. Iconic.",
];

export const MID_QUOTES = [
  "Not bad. Not great. Travel-ready.",
  "Solid B-. Trip incoming.",
  "Could be worse. Could be 0.",
  "We've seen better. We've seen worse.",
];

export const LOADING_QUOTES = [
  "Bribing the algorithm...",
  "Asking the AI nicely...",
  "Negotiating with budget gods...",
  "Checking if your wallet is okay...",
  "Convincing destinations to be cheap...",
  "Reading 1000 travel blogs so you don't have to...",
  "Stalking flight prices...",
  "Whispering to Booking.com...",
  "Doing math. Lots of math.",
  "Picking destinations that won't bankrupt you...",
  "Filtering out tourist traps...",
  "Vibe-checking each city...",
];

export const ROUND_QUOTES = [
  "Next one. No pressure.",
  "Round 2. Don't choke.",
  "One more time, with feeling.",
  "Final round. Make it count.",
];

export const HERO_QUOTES = [
  "Tell me your budget. I'll find you a trip.",
  "€300 left? I got you.",
  "Cheap flights, real vibes.",
  "Your wallet's tour guide.",
];

export const ERROR_QUOTES = [
  "I broke. Try again?",
  "That wasn't supposed to happen.",
  "Even I get lost sometimes.",
];

// ---------- Trip-form field reactions ----------
// Phase 2B: a second Triply instance reacts to user input on each form field.
// Banks below are keyed by the field's user-visible state (budget bucket,
// month name, vibe value, traveler bucket, etc.) and consumed via the helper
// functions further down.

export const BUDGET_LOW_QUOTES = [
  "ambitious. but ok.",
  "tight. let's see.",
  "challenging, not impossible.",
  "we'll get creative.",
  "hard mode activated.",
  "respect for the hustle.",
];

export const BUDGET_MID_QUOTES = [
  "now we're talking.",
  "ok, doable.",
  "this works.",
  "solid budget.",
  "comfortable territory.",
  "sweet spot.",
];

export const BUDGET_HIGH_QUOTES = [
  "wow, big moves.",
  "now you're spending.",
  "fancy. love it.",
  "premium options unlocked.",
  "now you're spoiling me.",
  "the good stuff.",
  "yacht territory.",
  "let's go premium.",
  "okay big spender.",
];

export const MONTH_QUOTES: Record<string, string[]> = {
  january: ["winter escape mode.", "snow or sun?", "post-holiday recovery."],
  february: [
    "short month, big plans.",
    "valentine's getaway?",
    "still winter, sorry.",
  ],
  march: [
    "spring incoming.",
    "shoulder season pricing.",
    "blossoms about to drop.",
  ],
  april: [
    "spring is alive.",
    "easter pricing alert.",
    "perfect weather window.",
  ],
  may: [
    "chef's kiss season.",
    "pre-summer sweet spot.",
    "everything is blooming.",
  ],
  june: [
    "officially summer.",
    "long days, longer nights.",
    "peak season prices though.",
  ],
  july: [
    "full tourist mode.",
    "hot. very hot.",
    "book everything yesterday.",
  ],
  august: [
    "europe is on vacation.",
    "crowded but iconic.",
    "heat wave incoming.",
  ],
  september: [
    "secret best month.",
    "warm, less crowded.",
    "shoulder season W.",
  ],
  october: [
    "sweater weather.",
    "fall colors mode.",
    "autumn vibes only.",
  ],
  november: [
    "off-season deals.",
    "cozy travel era.",
    "low-key escape.",
  ],
  december: [
    "holiday escape.",
    "winter wonderland.",
    "year-end recharge.",
  ],
};

export const NIGHTS_SHORT_QUOTES = [
  "quick getaway.",
  "weekend warrior.",
  "blink and miss it.",
];

export const NIGHTS_MEDIUM_QUOTES = [
  "now that's a trip.",
  "proper escape.",
  "good length.",
];

export const NIGHTS_LONG_QUOTES = [
  "we're settling in.",
  "long-haul mode.",
  "you're really doing it.",
];

// Keys mirror the 6 vibe values in TripForm's VIBE_PRESETS. `getVibeQuotes`
// falls back to FORM_IDLE_QUOTES for any unexpected key — defensive only.
export const VIBE_QUOTES: Record<string, string[]> = {
  beach: [
    "sunscreen. coconut. you.",
    "ocean energy.",
    "sand between toes incoming.",
  ],
  city: [
    "coffee shops and chaos.",
    "concrete jungle vibes.",
    "subway maps in your future.",
  ],
  mountains: [
    "altitude unlocked.",
    "fresh air era.",
    "hiking boots and bad weather, probably.",
  ],
  party: [
    "sleep is for the plane.",
    "we're going OUT out.",
    "headphones on, plans loose.",
  ],
  culture: [
    "museums and ruins.",
    "intellectual unlock.",
    "history nerd era.",
  ],
  adventure: [
    "pack light, fall hard.",
    "knees better be ready.",
    "type 2 fun activated.",
  ],
};

export const TRAVELERS_SOLO_QUOTES = [
  "main character energy.",
  "you and the open road.",
  "no compromises.",
];

export const TRAVELERS_COUPLE_QUOTES = [
  "romantic mode loaded.",
  "the cute one and the planner.",
  "two passports, one plan.",
];

export const TRAVELERS_FAMILY_QUOTES = [
  "family chaos incoming.",
  "everyone gets a window seat. maybe.",
  "patience packed?",
];

export const TRAVELERS_GROUP_QUOTES = [
  "party mode.",
  "the more the merrier.",
  "group chat is about to pop off.",
  "logistics nightmare. fun though.",
];

// `{origin}` placeholder is substituted at render time by the consumer.
export const ORIGIN_QUOTES = [
  "starting point logged.",
  "got it. flying out of {origin}.",
  "{origin} → somewhere good.",
];

export const SUBMIT_QUOTES = [
  "give me a sec...",
  "doing the math...",
  "reading travel blogs at 3am for you...",
  "negotiating with the algorithm...",
];

export const FORM_IDLE_QUOTES = [
  "fill it in. I'll handle the rest.",
  "tell me what you got.",
  "where to start? budget. always budget.",
  "no wrong answers.",
];

export const FORM_ERROR_QUOTES = [
  "wait, that's not right.",
  "try again with that one.",
  "that won't fly. literally.",
];

// ---------- Helpers ----------

export function getRandomQuote(quotes: readonly string[]): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getNextQuote(
  quotes: readonly string[],
  currentIndex: number,
): { quote: string; nextIndex: number } {
  const nextIndex = (currentIndex + 1) % quotes.length;
  return { quote: quotes[nextIndex], nextIndex };
}

// Budget thresholds (EUR per person).
// < LOW  → sad       (e.g. < 250)
// MID    → happy     (250–500 inclusive of LOW, exclusive of HIGH)
// > HIGH → smug      (sunglasses on at >500)
export const BUDGET_LOW_THRESHOLD = 250;
export const BUDGET_HIGH_THRESHOLD = 500;

export function getBudgetQuotes(budget: number): readonly string[] {
  if (budget < BUDGET_LOW_THRESHOLD) return BUDGET_LOW_QUOTES;
  if (budget > BUDGET_HIGH_THRESHOLD) return BUDGET_HIGH_QUOTES;
  return BUDGET_MID_QUOTES;
}

export function getNightsQuotes(nights: number): readonly string[] {
  if (nights <= 2) return NIGHTS_SHORT_QUOTES;
  if (nights >= 7) return NIGHTS_LONG_QUOTES;
  return NIGHTS_MEDIUM_QUOTES;
}

// Maps the TripForm's TRAVELER_PRESETS counts (1/2/4/5) to their respective
// banks. Any other count is bucketed into GROUP as a defensive fallback.
export function getTravelersQuotes(count: number): readonly string[] {
  if (count === 1) return TRAVELERS_SOLO_QUOTES;
  if (count === 2) return TRAVELERS_COUPLE_QUOTES;
  if (count === 4) return TRAVELERS_FAMILY_QUOTES;
  if (count >= 5) return TRAVELERS_GROUP_QUOTES;
  return TRAVELERS_GROUP_QUOTES;
}

export function getVibeQuotes(vibe: string): readonly string[] {
  return VIBE_QUOTES[vibe] ?? FORM_IDLE_QUOTES;
}

// Returns a single resolved string with `{origin}` substituted in-line.
// Origin reactions fire once per change, so we resolve eagerly rather than
// returning a bank for the consumer to pick from.
export function getOriginQuote(originCity: string): string {
  const template =
    ORIGIN_QUOTES[Math.floor(Math.random() * ORIGIN_QUOTES.length)];
  return template.replace(/\{origin\}/g, originCity);
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Resolves the bank for the given date's calendar month. `undefined` falls
// back to FORM_IDLE_QUOTES so the consumer can call this with `range?.from`
// without a guard.
export function getMonthQuotes(date: Date | undefined): readonly string[] {
  if (!date) return FORM_IDLE_QUOTES;
  const monthKey = MONTH_NAMES[date.getMonth()];
  return MONTH_QUOTES[monthKey] ?? FORM_IDLE_QUOTES;
}
