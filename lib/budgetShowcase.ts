// Hand-picked example trips grouped by budget tier, used by the landing
// page's BudgetShowcase section. NOT pulled from live generations — these
// are illustrative, real-looking examples chosen to make the showcase shine.
//
// Prices are stored as EUR (the app's canonical currency) and rendered via
// useCurrency().format(...) so the user's currency choice applies uniformly
// across tier-toggle labels AND per-card prices — no mixed-currency UI.

import type { CityPhoto } from "./photos";
import type { CanonicalTag } from "./vibeDestinations";

// Same shape as CityPhoto (project-wide Pexels return type), plus the Pexels
// photo id so we can recurate / dedupe later without re-running the search.
// Resolved once via scripts/fetchShowcasePhotos.mjs and pasted in below.
export type ShowcasePhoto = CityPhoto & { id: number };

export interface ShowcaseExample {
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2. Used to construct a CitySelection on prefill. */
  countryCode: string;
  lat: number;
  lng: number;
  /** Two vibe tags to show as pills on the card. */
  vibes: CanonicalTag[];
  weather: {
    tempC: number;
    sunHours: number;
    /** Freeform short label — "Dry", "Mild", "Cool", etc. */
    conditions: string;
  };
  /** Per-person, all-in total. Stored as EUR; formatted via CurrencyContext. */
  perPersonEur: number;
  /**
   * Optional slug pointing at a pre-generated /trips/<slug> result. When set,
   * the card links straight there. When absent, the card prefills the planner
   * (destination + budget) and scrolls the user to the form.
   */
  slug?: string;
  /**
   * Curated Pexels photo for the card header. Resolved once via
   * scripts/fetchShowcasePhotos.mjs and baked in. Fallback-safe — the card
   * keeps showing the gradient header if the URL fails or this is omitted.
   */
  photo?: ShowcasePhoto;
}

export interface BudgetTier {
  /** EUR — used both as the toggle label (formatted) and as the prefilled budget. */
  value: number;
  examples: ShowcaseExample[];
}

// Note on lat/lng + countryCode: copied from lib/vibeDestinations.ts where
// the same city exists, so the prefilled CitySelection is identical to the
// one VibeSearch would produce.
export const BUDGET_TIERS: ReadonlyArray<BudgetTier> = [
  {
    value: 500,
    examples: [
      {
        city: "Kraków",
        country: "Poland",
        countryCode: "PL",
        lat: 50.0647,
        lng: 19.945,
        vibes: ["cheap", "culture"],
        weather: { tempC: 22, sunHours: 9, conditions: "Dry" },
        perPersonEur: 480,
        photo: {
          id: 37383038,
          url: "https://images.pexels.com/photos/37383038/pexels-photo-37383038.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/37383038/pexels-photo-37383038.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "Oleksandr Petroniuk",
          photographerUrl: "https://www.pexels.com/@oleksandr-petroniuk-2156010930",
          alt: "Aerial view of Kraków's historic architecture and landmarks.",
        },
      },
      {
        city: "Budapest",
        country: "Hungary",
        countryCode: "HU",
        lat: 47.4979,
        lng: 19.0402,
        vibes: ["cheap", "party"],
        weather: { tempC: 24, sunHours: 10, conditions: "Dry" },
        perPersonEur: 460,
        photo: {
          id: 18815996,
          url: "https://images.pexels.com/photos/18815996/pexels-photo-18815996.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/18815996/pexels-photo-18815996.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "Efrem Efre",
          photographerUrl: "https://www.pexels.com/@efrem-efre-2786187",
          alt: "Hungarian Parliament Building along the Danube River in Budapest.",
        },
      },
      {
        city: "Valencia",
        country: "Spain",
        countryCode: "ES",
        lat: 39.4699,
        lng: -0.3763,
        vibes: ["beach", "food"],
        weather: { tempC: 26, sunHours: 11, conditions: "Dry" },
        perPersonEur: 495,
        photo: {
          id: 17446514,
          url: "https://images.pexels.com/photos/17446514/pexels-photo-17446514.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/17446514/pexels-photo-17446514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "Mateusz Walendzik",
          photographerUrl: "https://www.pexels.com/@mateusz",
          alt: "Aerial view of Valencia, Spain with the Navis Building.",
        },
      },
    ],
  },
  {
    value: 1000,
    examples: [
      {
        city: "Lisbon",
        country: "Portugal",
        countryCode: "PT",
        lat: 38.7223,
        lng: -9.1393,
        vibes: ["beach", "food"],
        weather: { tempC: 23, sunHours: 11, conditions: "Dry" },
        perPersonEur: 940,
        photo: {
          id: 33659330,
          url: "https://images.pexels.com/photos/33659330/pexels-photo-33659330.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/33659330/pexels-photo-33659330.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "thorl5",
          photographerUrl: "https://www.pexels.com/@thorl5-2154653228",
          alt: "Sunset over Lisbon with the 25 de Abril Bridge.",
        },
      },
      {
        city: "Athens",
        country: "Greece",
        countryCode: "GR",
        lat: 37.9838,
        lng: 23.7275,
        vibes: ["culture", "warm"],
        weather: { tempC: 28, sunHours: 12, conditions: "Dry" },
        perPersonEur: 980,
        photo: {
          id: 13356918,
          url: "https://images.pexels.com/photos/13356918/pexels-photo-13356918.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/13356918/pexels-photo-13356918.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "David Iglesias",
          photographerUrl: "https://www.pexels.com/@iglp11",
          alt: "Aerial view of Athens cityscape with mountains in the background.",
        },
      },
      {
        city: "Split",
        country: "Croatia",
        countryCode: "HR",
        lat: 43.5081,
        lng: 16.4402,
        vibes: ["island", "relax"],
        weather: { tempC: 27, sunHours: 11, conditions: "Dry" },
        perPersonEur: 910,
        photo: {
          id: 6701514,
          url: "https://images.pexels.com/photos/6701514/pexels-photo-6701514.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/6701514/pexels-photo-6701514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "Salim Chauhan",
          photographerUrl: "https://www.pexels.com/@scpffm",
          alt: "Coastal cityscape of Split, Croatia, with harbor and mountain backdrop.",
        },
      },
    ],
  },
  {
    value: 2000,
    examples: [
      {
        city: "Tokyo",
        country: "Japan",
        countryCode: "JP",
        lat: 35.6762,
        lng: 139.6503,
        vibes: ["city", "food"],
        weather: { tempC: 24, sunHours: 8, conditions: "Mild" },
        perPersonEur: 1920,
        photo: {
          id: 31048512,
          url: "https://images.pexels.com/photos/31048512/pexels-photo-31048512.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/31048512/pexels-photo-31048512.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "Guohua Song",
          photographerUrl: "https://www.pexels.com/@railgunbreaker",
          alt: "Twilight view of Tokyo's cityscape with iconic landmarks and city lights.",
        },
      },
      {
        city: "Reykjavík",
        country: "Iceland",
        countryCode: "IS",
        lat: 64.1466,
        lng: -21.9426,
        vibes: ["nature", "relax"],
        weather: { tempC: 12, sunHours: 18, conditions: "Cool" },
        perPersonEur: 1780,
        photo: {
          id: 33840488,
          url: "https://images.pexels.com/photos/33840488/pexels-photo-33840488.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/33840488/pexels-photo-33840488.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "Benjamin Alanis Ibarra",
          photographerUrl: "https://www.pexels.com/@balanisph",
          alt: "Aerial view of Reykjavík, Iceland, with colorful architecture and coast.",
        },
      },
      {
        city: "Cape Town",
        country: "South Africa",
        countryCode: "ZA",
        lat: -33.9249,
        lng: 18.4241,
        vibes: ["nature", "beach"],
        weather: { tempC: 20, sunHours: 9, conditions: "Dry" },
        perPersonEur: 1850,
        photo: {
          id: 33622083,
          url: "https://images.pexels.com/photos/33622083/pexels-photo-33622083.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
          urlLarge: "https://images.pexels.com/photos/33622083/pexels-photo-33622083.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          photographer: "K",
          photographerUrl: "https://www.pexels.com/@kelly",
          alt: "Aerial view of Cape Town city lights at night against Table Mountain.",
        },
      },
    ],
  },
];

export const DEFAULT_TIER_VALUE = 1000;
