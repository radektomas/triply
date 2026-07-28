"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon, InstagramIcon, PlaneIcon } from "@/components/landing/VibeIcons";

// ── Editable numbers: every figure on the page lives here ───────────────────

const DEAL = {
  stake: "30 %",
  forStake: "250 000 Kč",
  marketing: "200 000 Kč",
  total: "450 000 Kč",
  flightNo: "TRP-2026",
};

const METRICS = {
  cities: "740",
  travelers: "1 000+",
  countries: "60+",
  trips: "200+",
  bookingClicks: "50",
};

// Revenue channels in the order a trip is planned: stay, flights, activities.
// `status` drives the marker on each card: "live" renders a filled teal dot,
// "ready" an outline ring in the muted color.
const CHANNELS = [
  { key: "stay", status: "live" },
  { key: "flights", status: "ready" },
  { key: "activities", status: "ready" },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];

type Lang = "cs" | "en";

// ── Copy: single dictionary, Czech default ──────────────────────────────────

export const CONTENT: Record<
  Lang,
  {
    nav: { cta: string };
    hero: {
      eyebrow: string;
      h1: string;
      lead: string;
      strip: { label: string; value: string }[];
    };
    how: { title: string; steps: { h: string; p: string }[] };
    built: {
      title: string;
      sub: string;
      groups: { h: string; items: string[] }[];
    };
    revenue: {
      title: string;
      intro: string;
      channels: Record<
        ChannelKey,
        { h: string; statusWord: string; p: string; status: string }
      >;
      evidence: string;
      tie: string;
      freeTraffic: string;
      quote: string;
    };
    numbers: {
      title: string;
      labels: Record<"trips" | "travelers" | "countries", string>;
      note: string;
    };
    offer: {
      title: string;
      intro: string;
      ticket: Record<
        "passenger" | "flight" | "forStake" | "marketing" | "stake" | "total",
        string
      >;
      points: string[];
    };
    marketing: {
      title: string;
      body1: string;
      body2: string;
      listTitle: string;
      items: string[];
    };
    founder: { title: string; body: string };
    footer: { disclaimer: string };
  }
> = {
  cs: {
    nav: { cta: "Přejít na nabídku ↓" },
    hero: {
      eyebrow: "INVESTIČNÍ NABÍDKA · SRPEN 2026",
      h1: "Produkt je hotový. Monetizace běží. Chybí palivo.",
      lead: "Triply je AI plánovač cest pro lidi s omezeným rozpočtem. Zadáš, kolik můžeš utratit, a dostaneš tři konkrétní destinace i s programem na každý den a rozpočtem rozepsaným do koruny. Rezervace jde přes Booking.com a z každé nám padá provize. Všechno běží v produkci na flytriply.eu.",
      strip: [
        { label: "DATABÁZE", value: "740 měst" },
        { label: "KANÁLY", value: "1 aktivní, 2 připravené" },
        { label: "CESTOVATELÉ", value: "1 000+" },
      ],
    },
    how: {
      title: "Jak to funguje",
      steps: [
        {
          h: "Řekneš, kolik máš",
          p: "Rozpočet, měsíc, počet nocí, odkud vyrážíš. Nebo si vyber region, případně rovnou konkrétní město.",
        },
        {
          h: "AI vybere tři destinace",
          p: "Ne seznam odkazů. Tři města s programem den po dni a rozpočtem rozepsaným na dopravu, ubytování, jídlo a útratu.",
        },
        {
          h: "Klikneš na rezervaci",
          p: "Booking.com se otevře s předvyplněnými termíny. Když si host zarezervuje, Triply dostane provizi.",
        },
      ],
    },
    built: {
      title: "Co už stojí",
      sub: "Tohle není prezentace nápadu. Tohle je popis běžící aplikace.",
      groups: [
        {
          h: "Produkt",
          items: [
            "Tři režimy zadání: překvap mě, region, konkrétní město",
            "Detail výletu s programem na každý den a rozpisem rozpočtu",
            "Uživatelské profily, ukládání a srdíčkování výletů",
            "Filtr podle atmosféry: pláž, kultura, párty, umění, historie, aktivní dovolená",
            "Doprava letecky i autem",
            "Více měn",
            "Maskot Triply, šest stavů a přes 200 hlášek",
            "Minihra GuessTheCity",
            "Denní limit generování, aby náklady na AI neutekly",
          ],
        },
        {
          h: "Data a technologie",
          items: [
            "740 měst v databázi, otagovaných podle atmosféry přes Foursquare a Wikidata",
            "Generování běží na n8n a OpenAI jako workflow, ne jako prompt zadrátovaný v kódu, takže se dá ladit bez nasazování",
            "Next.js 15, Supabase, Vercel",
            "Fotky destinací z Pexels s vlastní cache",
          ],
        },
        {
          h: "Monetizace",
          items: [
            "Booking.com přes CJ Affiliate. Schválené, aktivní, s předáváním termínů do rezervace.",
            "Skyscanner. Odkazy na letenky jsou v detailu výletu, přihláška do programu čeká na provoz.",
            "GetYourGuide. Odkazy na zážitky jsou v programu dne, přihláška čeká na provoz.",
            "Prostor pro placený tarif.",
          ],
        },
        {
          h: "Provoz a právo",
          items: [
            "GDPR audit hotový, RLS na všech citlivých tabulkách",
            "Souhlas s e-maily, funkční odhlášení, zásady ochrany osobních údajů",
            "Transakční e-maily přes Resend",
            "Vlastní analytika trychtýře. Vidím, kde lidé odpadávají.",
          ],
        },
      ],
    },
    revenue: {
      title: "Tři kanály, jeden výlet",
      intro:
        "Triply nevydělává na uživateli. Vydělává na tom, co si uživatel stejně koupí, a co mu Triply spočítá dřív, než ho pošle rezervovat.",
      channels: {
        stay: {
          h: "Ubytování / Booking.com",
          statusWord: "AKTIVNÍ",
          p: "Rezervační odkaz otevře Booking.com s předvyplněnou destinací i termíny. Za dokončenou rezervaci padá provize.",
          status: "Schváleno přes CJ Affiliate. Integrace odladěná, testovaná rezervace prošla.",
        },
        flights: {
          h: "Letenky / Skyscanner",
          statusWord: "PŘIPRAVENO",
          p: "Každý výlet začíná letem. Odkaz na vyhledávání letenek je přímo v detailu výletu, s trasou i termínem.",
          status: "Program běží přes Impact.com a otevírá se zhruba na 5 000 unikátních návštěvnících měsíčně. Přihlášku podáme, jakmile na to číslo dosáhneme.",
        },
        activities: {
          h: "Zážitky / GetYourGuide",
          statusWord: "PŘIPRAVENO",
          p: "Program na každý den je napojený na prohlídky a aktivity v destinaci. Odkaz vede rovnou na konkrétní nabídku ve městě.",
          status: "Vlastní program GetYourGuide neprovozuje, vstupuje se přes sítě Awin nebo Travelpayouts se sazbou 5 až 8 procent. Přihláška jde ven spolu se Skyscannerem.",
        },
      },
      evidence:
        "Přes tisíc cestovatelů zatím vygenerovalo {clicks} prokliků na Booking.com. Je to malé číslo, ale je to průchozí trychtýř od první obrazovky až k rezervaci. Chybí mu jen vstup.",
      tie: "Ty tři kanály kopírují tři největší položky rozpočtu, který Triply sám počítá: ubytování, dopravu a zážitky. Uživatel neodchází nic hledat jinam, odkazy jsou přímo v plánu.",
      freeTraffic:
        "Dva ze tří kanálů dnes posílají provoz zadarmo. Odkazy v aplikaci jsou, chybí jen objem, na kterém se dá programy otevřít. Právě proto míří investice do získávání uživatelů, ne do vývoje.",
      quote:
        "Nebudu předstírat, že Triply už vydělává ve velkém. Kanály jsou postavené, jeden schválený a živý. Chybí objem, který jimi proteče. Přesně na to jsou ty peníze.",
    },
    numbers: {
      title: "Čísla",
      labels: {
        trips: "Vygenerovaných výletů",
        travelers: "Cestovatelů",
        countries: "Zemí",
      },
      note: "Data k červenci 2026. Zatím bez placené reklamy, všechno z organického obsahu na TikToku a Instagramu.",
    },
    offer: {
      title: "Nabídka",
      intro:
        "Hledám partnera, ne jen peníze. Podíl je 30 %, z toho 250 000 Kč za podíl a 200 000 Kč jde přímo do firmy na marketing.",
      ticket: {
        passenger: "PASAŽÉR",
        flight: "LET",
        forStake: "ZA PODÍL",
        marketing: "MARKETING",
        stake: "PODÍL",
        total: "CELKEM",
      },
      points: [
        "Podíl 30 % a reálné spolurozhodování o směru produktu",
        "200 000 Kč vázaných na marketing, ne na provoz",
        "Produkt je hotový a tři příjmové kanály jsou postavené. Peníze nejdou na vývoj, ale na uživatele, kteří jimi projdou.",
      ],
    },
    marketing: {
      title: "Marketing neumím",
      body1:
        "Postavil jsem produkt, databázi, AI workflow i affiliate integraci. Marketing mezi to nepatří. Organicky běží TikTok a Instagram pod @flytriplyapp, ale placené kanály jsem nikdy neřídil a nebudu předstírat, že vím jak na to.",
      body2:
        "Proto těch 200 000 Kč nemá rozepsaný rozpočet. Jsou vázané na získávání uživatelů a jejich použití chci nechat na partnerovi, ať už to bude jeho vlastní zkušenost, nebo agentura, kterou vybere. Hledám někoho, kdo tuhle část umí lépe než já. To je taky důvod, proč nabízím 30 % a ne pět.",
      listTitle: "Co už běží",
      items: [
        "TikTok a Instagram pod @flytriplyapp",
        "Série krátkých videí o levném cestování",
        "Analytika trychtýře je hotová, takže půjde měřit, co z rozpočtu funguje",
      ],
    },
    founder: {
      title: "Kdo za tím stojí",
      body: "Jmenuju se Radek, je mi 20 a Triply jsem postavil sám. Frontend, databázi, AI workflow, affiliate integraci, právní část i obsah na sociálních sítích. Nemám za sebou tým ani agenturu. Mám za sebou produkt, který funguje.",
    },
    footer: {
      disclaimer: "Dokument slouží jako podklad k jednání, není závaznou nabídkou.",
    },
  },
  en: {
    nav: { cta: "Go to the offer ↓" },
    hero: {
      eyebrow: "INVESTMENT OFFER · AUGUST 2026",
      h1: "The product is built. Monetization is live. It needs fuel.",
      lead: "Triply is an AI trip planner for people traveling on a fixed budget. Tell it what you can spend and it returns three real destinations, each with a day-by-day plan and a budget broken down to the last euro. Booking goes through Booking.com, and every completed reservation pays Triply a commission. All of it is live in production at flytriply.eu.",
      strip: [
        { label: "DATABASE", value: "740 cities" },
        { label: "CHANNELS", value: "1 live, 2 ready" },
        { label: "TRAVELERS", value: "1,000+" },
      ],
    },
    how: {
      title: "How it works",
      steps: [
        {
          h: "Tell us your budget",
          p: "Budget, month, number of nights, where you're flying from. Or pick a region, or name the exact city.",
        },
        {
          h: "AI picks three destinations",
          p: "Not a list of links. Three cities with a day-by-day plan and a budget split across transport, accommodation, food and spending money.",
        },
        {
          h: "You click through to book",
          p: "Booking.com opens with the dates already filled in. When the guest books, Triply earns a commission.",
        },
      ],
    },
    built: {
      title: "What's already built",
      sub: "This isn't a pitch for an idea. This is a description of a running app.",
      groups: [
        {
          h: "Product",
          items: [
            "Three ways to start: surprise me, pick a region, name the city",
            "Trip detail with a day-by-day plan and a full budget breakdown",
            "User profiles, saved and favorited trips",
            "Vibe filtering: beach, culture, party, art, history, active",
            "Travel by plane or by car",
            "Multi-currency support",
            "Triply mascot with six states and over 200 lines",
            "GuessTheCity mini-game",
            "Daily generation limit, so AI costs stay predictable",
          ],
        },
        {
          h: "Data and tech",
          items: [
            "740 cities in the database, tagged by vibe using Foursquare and Wikidata",
            "Trip generation runs on n8n and OpenAI as a workflow, not as a prompt hardcoded in the app, so it can be tuned without a deploy",
            "Next.js 15, Supabase, Vercel",
            "Destination photos from Pexels with our own cache",
          ],
        },
        {
          h: "Monetization",
          items: [
            "Booking.com via CJ Affiliate. Approved, live, with dates passed into the reservation.",
            "Skyscanner. Flight links sit in the trip detail, the program application is waiting on traffic.",
            "GetYourGuide. Activity links sit in the day plan, the application is waiting on traffic.",
            "Room for a paid tier.",
          ],
        },
        {
          h: "Operations and legal",
          items: [
            "GDPR audit complete, RLS on every sensitive table",
            "Email consent, working unsubscribe, published privacy policy",
            "Transactional email through Resend",
            "Custom funnel analytics. I can see exactly where people drop off.",
          ],
        },
      ],
    },
    revenue: {
      title: "Three channels, one trip",
      intro:
        "Triply doesn't make money off the user. It makes money on what the user is going to buy anyway, and on having costed it out before sending them off to book.",
      channels: {
        stay: {
          h: "Accommodation / Booking.com",
          statusWord: "LIVE",
          p: "The booking link opens Booking.com with the destination and dates already filled in. A completed reservation pays a commission.",
          status: "Approved through CJ Affiliate. The integration is tuned and a test booking has gone through.",
        },
        flights: {
          h: "Flights / Skyscanner",
          statusWord: "READY",
          p: "Every trip starts with a flight. The flight search link sits inside the trip detail, with the route and dates carried over.",
          status: "The program runs through Impact.com and opens up at roughly 5,000 unique visitors a month. The application goes in as soon as we reach that.",
        },
        activities: {
          h: "Activities / GetYourGuide",
          statusWord: "READY",
          p: "The day-by-day plan links out to tours and activities in the destination. The link goes straight to what's on offer in that city.",
          status: "GetYourGuide runs no in-house program. Entry is through the Awin or Travelpayouts networks at 5 to 8 percent. The application goes in alongside Skyscanner.",
        },
      },
      evidence:
        "Over a thousand travelers have produced {clicks} click-throughs to Booking.com so far. It's a small number, but the funnel runs all the way from the first screen to a booking. What it's missing is volume at the top.",
      tie: "The three channels mirror the three biggest lines in the budget Triply already calculates: accommodation, transport and activities. Users don't leave to go looking elsewhere, the links are inside the plan.",
      freeTraffic:
        "Two of the three channels are sending traffic for free right now. The links are in the app. What's missing is the volume needed to get the programs approved. That's exactly why the investment goes into distribution rather than development.",
      quote:
        "I'm not going to pretend Triply is already earning at scale. The channels are built and one is approved and live. What's missing is the volume flowing through them. That's exactly what this money is for.",
    },
    numbers: {
      title: "Numbers",
      labels: {
        trips: "Trips generated",
        travelers: "Travelers",
        countries: "Countries",
      },
      note: "Figures as of July 2026. No paid advertising yet, everything so far has come from organic content on TikTok and Instagram.",
    },
    offer: {
      title: "The offer",
      intro:
        "I'm looking for a partner, not just money. The stake is 30%: 250,000 CZK for the stake and 200,000 CZK going straight into the company for marketing.",
      ticket: {
        passenger: "PASSENGER",
        flight: "FLIGHT",
        forStake: "FOR THE STAKE",
        marketing: "MARKETING",
        stake: "STAKE",
        total: "TOTAL",
      },
      points: [
        "A 30% stake and a real say in where the product goes",
        "200,000 CZK ring-fenced for marketing, not for running costs",
        "The product is finished and three revenue channels are built. The money doesn't go into development, it goes into the traffic that flows through them.",
      ],
    },
    marketing: {
      title: "Marketing isn't my skill",
      body1:
        "I built the product, the database, the AI workflows and the affiliate integration. Marketing isn't on that list. TikTok and Instagram run organically under @flytriplyapp, but I've never run paid channels and I'm not going to pretend I know how.",
      body2:
        "That's why the 200,000 CZK doesn't come with a line-by-line budget. It's ring-fenced for acquiring users, and how it gets spent is something I want the partner to shape, whether that's their own experience or an agency they pick. I'm looking for someone who does this part better than I do. That's also why the stake on offer is 30% and not five.",
      listTitle: "What's already running",
      items: [
        "TikTok and Instagram at @flytriplyapp",
        "A running series of short videos about traveling cheap",
        "Funnel analytics already built, so whatever gets spent can be measured",
      ],
    },
    founder: {
      title: "Who's building this",
      body: "My name is Radek, I'm 20, and I built Triply on my own. The frontend, the database, the AI workflows, the affiliate integration, the legal work and the social content. I don't have a team or an agency behind me. I have a product that works.",
    },
    footer: {
      disclaimer: "This document is a basis for discussion and is not a binding offer.",
    },
  },
};

// ── Small shared bits ───────────────────────────────────────────────────────

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

/** Values still waiting to be filled in ("…" and bracketed tokens). */
function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-muted underline decoration-dotted decoration-2 underline-offset-4">
      {children}
    </span>
  );
}

/** Renders body copy with any [DOPLNIT…] / [FILL IN…] token as a visible placeholder. */
function withPlaceholders(text: string) {
  return text
    .split(/(\[[^\]]+\])/)
    .map((part, i) =>
      part.startsWith("[") ? <Placeholder key={i}>{part}</Placeholder> : part,
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-3">
      {children}
    </h2>
  );
}

// Status markers for the revenue-channel cards: same inline-SVG pattern as
// VibeIcons (color prop, no icon library). Filled dot = live and earning,
// outline ring = links live in the product, program application pending.
function StatusDotIcon({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="4" cy="4" r="4" fill={color} />
    </svg>
  );
}

function StatusRingIcon({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="4" cy="4" r="3.25" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-[#1A1A1A]/80 leading-relaxed">
      <span className="mt-0.5 shrink-0 text-teal" aria-hidden="true">
        <CheckIcon color="currentColor" size={15} />
      </span>
      <span>{children}</span>
    </li>
  );
}

// Reads ?lang=en once the client mounts. Isolated in its own component so the
// Suspense boundary (required by useSearchParams) only covers this null-render,
// so the full Czech-default page stays in the prerendered no-JS HTML.
function LangFromUrl({ apply }: { apply: (lang: Lang) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("lang") === "en") apply("en");
  }, [searchParams, apply]);
  return null;
}

// ── Boarding pass ───────────────────────────────────────────────────────────

// CSS barcode: [width(px), dim?] pairs, no image.
const BARCODE: ReadonlyArray<readonly [number, boolean]> = [
  [2, false], [1, true], [3, false], [1, true], [2, false], [4, false],
  [1, true], [2, false], [1, true], [3, false], [2, true], [1, false],
  [4, false], [1, true], [2, false], [3, true], [1, false], [2, false],
];

function TicketField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60 mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function BoardingPass({ t }: { t: (typeof CONTENT)[Lang]["offer"]["ticket"] }) {
  return (
    <div className="relative flex flex-col md:flex-row rounded-2xl bg-teal-800 text-white shadow-xl">
      {/* Main body */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] tracking-[0.2em] uppercase text-white/60 mb-7">
          <span>BOARDING · 002</span>
          <span>07 / 2026</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-7">
          <TicketField label={t.passenger}>
            {/* Empty field: a dotted rule to write the investor's name on */}
            <span
              className="block h-7 sm:h-8 border-b-2 border-dotted border-white/40"
              aria-hidden="true"
            />
          </TicketField>
          <TicketField label={t.flight}>
            <div className="font-mono text-lg sm:text-xl font-semibold tracking-wider whitespace-nowrap">
              {DEAL.flightNo}
            </div>
          </TicketField>
          <TicketField label={t.forStake}>
            <div className="font-display text-lg sm:text-2xl font-bold tabular-nums whitespace-nowrap">
              {DEAL.forStake}
            </div>
          </TicketField>
          <TicketField label={t.marketing}>
            <div className="font-display text-lg sm:text-2xl font-bold tabular-nums whitespace-nowrap">
              {DEAL.marketing}
            </div>
          </TicketField>
        </div>
      </div>

      {/* Perforation: vertical on md+, horizontal below. The notch
          semicircles are filled with the page background (bg-bg). */}
      <div
        className="relative hidden md:block self-stretch border-l border-dashed border-white/40"
        aria-hidden="true"
      >
        <span className="absolute -top-3 left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-bg" />
        <span className="absolute -bottom-3 left-0 -translate-x-1/2 w-6 h-6 rounded-full bg-bg" />
      </div>
      <div
        className="relative md:hidden border-t border-dashed border-white/40"
        aria-hidden="true"
      >
        <span className="absolute top-0 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-bg" />
        <span className="absolute top-0 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-bg" />
      </div>

      {/* Tear-off stub */}
      <div className="md:w-52 shrink-0 flex flex-col items-center justify-center gap-5 p-6 sm:p-8 bg-teal-900/40 rounded-b-2xl md:rounded-bl-none md:rounded-tr-2xl">
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60 mb-1">
            {t.stake}
          </div>
          <div className="font-display text-5xl font-extrabold tabular-nums whitespace-nowrap">
            {DEAL.stake}
          </div>
        </div>
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60 mb-1">
            {t.total}
          </div>
          <div className="font-display text-xl font-bold tabular-nums whitespace-nowrap">
            {DEAL.total}
          </div>
        </div>
        <div className="flex items-stretch gap-[3px] h-9 mt-1" aria-hidden="true">
          {BARCODE.map(([w, dim], i) => (
            <span
              key={i}
              style={{ width: `${w}px` }}
              className={`rounded-[1px] ${dim ? "bg-white/50" : "bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function InvestContent() {
  const [lang, setLang] = useState<Lang>("cs");
  const router = useRouter();
  const t = CONTENT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const switchLang = (next: Lang) => {
    if (next === lang) return;
    setLang(next);
    router.replace(next === "en" ? "/invest?lang=en" : "/invest", {
      scroll: false,
    });
  };

  const metricTiles = [
    { key: "trips", value: METRICS.trips },
    { key: "travelers", value: METRICS.travelers },
    { key: "countries", value: METRICS.countries },
  ] as const;

  const langButton = (code: Lang, label: string) => (
    <button
      type="button"
      onClick={() => switchLang(code)}
      aria-pressed={lang === code}
      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${FOCUS_RING} ${
        lang === code
          ? "bg-[#1A1A1A] text-white"
          : "text-muted border border-border hover:text-[#1A1A1A]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div lang={lang} className="relative overflow-x-clip bg-bg">
      <Suspense fallback={null}>
        <LangFromUrl apply={setLang} />
      </Suspense>

      {/* Background monstera leaves: decoration only, hidden on mobile */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden md:block absolute z-0 top-[-90px] right-[-80px] w-[300px]"
        style={{ transform: "rotate(145deg)", opacity: 0.35 }}
      >
        <Image
          src="/illustrations/tropical-leaf.webp"
          alt=""
          width={2000}
          height={2000}
          sizes="300px"
          className="w-full h-auto"
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none hidden md:block absolute z-0 bottom-[60px] left-[-110px] w-[340px]"
        style={{ transform: "rotate(35deg)", opacity: 0.3 }}
      >
        <Image
          src="/illustrations/tropical-leaf.webp"
          alt=""
          width={2000}
          height={2000}
          sizes="340px"
          className="w-full h-auto"
        />
      </div>

      {/* Slim sticky header: logo + language toggle + jump-to-offer CTA */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="Triply home"
            className={`inline-flex items-center rounded-md transition hover:opacity-80 ${FOCUS_RING}`}
          >
            <Image
              src="/triply-logo-tropical.webp"
              alt="Triply"
              width={936}
              height={279}
              priority
              className="w-[88px] h-auto select-none"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div role="group" aria-label="Language" className="flex items-center gap-1">
              {langButton("cs", "CS")}
              {langButton("en", "EN")}
            </div>
            <a
              href="#offer"
              className={`inline-flex items-center rounded-full bg-teal hover:bg-teal-deep text-white text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 transition-colors whitespace-nowrap ${FOCUS_RING}`}
            >
              {t.nav.cta}
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-14 md:pt-20 pb-14 md:pb-16 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <div className="mb-10 flex justify-center">
              <Image
                src="/triply-logo-tropical.webp"
                alt="Triply"
                width={936}
                height={279}
                priority
                className="w-[200px] md:w-[260px] h-auto select-none"
                style={{
                  transform: "rotate(-2.5deg)",
                  filter:
                    "drop-shadow(0 8px 14px rgba(56, 27, 8, 0.22)) drop-shadow(0 2px 4px rgba(56, 27, 8, 0.16))",
                }}
              />
            </div>
            <p className="font-mono text-xs sm:text-sm font-medium uppercase text-accent tracking-[0.2em] mb-4">
              {t.hero.eyebrow}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] text-[#1A1A1A] text-balance mb-6">
              {t.hero.h1}
            </h1>
            <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto mb-8">
              {t.hero.lead}
            </p>
            {/* Ticket data strip: repeats the boarding pass's label language */}
            <dl className="mx-auto max-w-[640px] grid sm:grid-cols-3 border-y border-border">
              {t.hero.strip.map((cell, i) => (
                <div
                  key={cell.label}
                  className={`px-4 py-4 text-center ${
                    i > 0 ? "border-t sm:border-t-0 sm:border-l border-border" : ""
                  }`}
                >
                  <dt className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-1">
                    {cell.label}
                  </dt>
                  <dd className="text-sm text-[#1A1A1A]">{cell.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works: steps strung along a dotted flight route instead of
            numbered cards. Horizontal route on md+, vertical down the left
            edge below. Waypoint nodes get a bg-colored ring so the dotted
            line reads as passing behind them. */}
        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6">
            <SectionTitle>{t.how.title}</SectionTitle>
            {/* The dot and its connector live INSIDE each step column (see
                .invest-route-* in globals.css, plain CSS on purpose) so they
                cannot drift from the text they belong to. */}
            <div className="invest-route-grid mt-10">
              {t.how.steps.map((step, i) => (
                <div
                  key={step.h}
                  className={`invest-route-step${
                    i === t.how.steps.length - 1 ? " invest-route-step--last" : ""
                  }`}
                >
                  <div className="invest-route-node" aria-hidden="true">
                    <span className="invest-route-dot" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#1A1A1A] mb-2">
                    {step.h}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">{step.p}</p>
                </div>
              ))}
              <div className="invest-route-plane" aria-hidden="true">
                <span className="invest-route-plane-glyph">
                  <PlaneIcon color="currentColor" size={22} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* What's already built: a spec-sheet manifest. Mono group labels in
            a fixed left column, items separated by hairlines, no cards and
            no icons so the boarding pass stays the page's only bold element. */}
        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6">
            <SectionTitle>{t.built.title}</SectionTitle>
            <p className="text-muted mb-8">{t.built.sub}</p>
            <div className="border-y border-border divide-y divide-border">
              {t.built.groups.map((group) => (
                <div key={group.h} className="md:flex md:gap-10 py-6">
                  <h3 className="font-display text-2xl font-bold text-[#1A1A1A] leading-snug mb-3 md:mb-0 md:w-[220px] md:shrink-0">
                    {group.h}
                  </h3>
                  <ul className="flex-1 max-w-[620px] divide-y divide-border/60">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="py-2.5 text-sm text-[#1A1A1A]/80 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Revenue: three channels, one per card */}
        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6">
            <SectionTitle>{t.revenue.title}</SectionTitle>
            <p className="text-[#1A1A1A]/80 leading-relaxed max-w-3xl mb-8">
              {t.revenue.intro}
            </p>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {CHANNELS.map((channel) => {
                const c = t.revenue.channels[channel.key];
                const live = channel.status === "live";
                return (
                  <div
                    key={channel.key}
                    className="flex flex-col bg-card rounded-2xl border border-border/60 shadow-card p-6"
                  >
                    <h3 className="font-display text-lg font-bold text-[#1A1A1A] mb-2">
                      {c.h}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-4">{c.p}</p>
                    <div className="mt-auto">
                      <p
                        className={`flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase mb-1.5 ${
                          live ? "text-teal" : "text-muted"
                        }`}
                      >
                        <span aria-hidden="true">
                          {live ? (
                            <StatusDotIcon color="currentColor" size={8} />
                          ) : (
                            <StatusRingIcon color="currentColor" size={8} />
                          )}
                        </span>
                        {c.statusWord}
                      </p>
                      <p className="text-xs text-muted leading-relaxed">{c.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Evidence line: the funnel already converts end to end, the
                click count set in the display font via {clicks} split. */}
            <p className="text-lg text-[#1A1A1A]/80 leading-relaxed max-w-3xl mt-8">
              {t.revenue.evidence.split("{clicks}").map((part, i) =>
                i === 0 ? (
                  part
                ) : (
                  <span key={i}>
                    <span className="font-display font-bold text-[#1A1A1A]">
                      {METRICS.bookingClicks}
                    </span>
                    {part}
                  </span>
                ),
              )}
            </p>
            <p className="text-[#1A1A1A]/80 leading-relaxed max-w-3xl mt-4">
              {t.revenue.tie}
            </p>
            <p className="text-sm text-muted leading-relaxed max-w-3xl mt-4">
              {t.revenue.freeTraffic}
            </p>
            <blockquote className="border-l-4 border-accent pl-5 sm:pl-6 py-1 mt-8 max-w-3xl font-display text-xl sm:text-2xl font-semibold leading-snug text-[#1A1A1A]">
              {t.revenue.quote}
            </blockquote>
          </div>
        </section>

        {/* Numbers */}
        <section className="py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6">
            <SectionTitle>{t.numbers.title}</SectionTitle>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8">
              {metricTiles.map((tile) => (
                <div
                  key={tile.key}
                  className="bg-card rounded-2xl border border-border/60 shadow-card p-3 sm:p-5 text-center"
                >
                  <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums tracking-tight text-accent-deep">
                    {tile.value}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mt-1.5">
                    {t.numbers.labels[tile.key]}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted mt-4">{t.numbers.note}</p>
          </div>
        </section>

        {/* The offer: boarding pass */}
        <section id="offer" className="py-12 md:py-16 scroll-mt-20">
          <div className="max-w-3xl mx-auto px-6">
            <SectionTitle>{t.offer.title}</SectionTitle>
            <p className="text-[#1A1A1A]/80 leading-relaxed mb-8">{t.offer.intro}</p>
            <BoardingPass t={t.offer.ticket} />
            <ul className="mt-8 space-y-2.5">
              {t.offer.points.map((point) => (
                <CheckItem key={point}>{point}</CheckItem>
              ))}
            </ul>
          </div>
        </section>

        {/* Marketing: an honest statement of where the founder's competence
            ends, in place of a made-up line-by-line budget. */}
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-6">
            <SectionTitle>{t.marketing.title}</SectionTitle>
            <div className="max-w-[620px] space-y-4">
              <p className="text-[#1A1A1A]/80 leading-relaxed">{t.marketing.body1}</p>
              <p className="text-[#1A1A1A]/80 leading-relaxed">{t.marketing.body2}</p>
            </div>
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mt-8 mb-1">
              {t.marketing.listTitle}
            </h3>
            <ul className="max-w-[620px] divide-y divide-border/60">
              {t.marketing.items.map((item) => (
                <li
                  key={item}
                  className="py-2.5 text-sm text-[#1A1A1A]/80 leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Founder */}
        <section className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-6">
            <SectionTitle>{t.founder.title}</SectionTitle>
            <p className="text-[#1A1A1A]/80 leading-relaxed">
              {withPlaceholders(t.founder.body)}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-white mt-8">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between text-sm text-muted">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <Image
                src="/triply-logo-tropical.webp"
                alt="Triply"
                width={936}
                height={279}
                className="w-[80px] h-auto select-none"
              />
              <p className="text-xs text-muted/70">© 2026 Triply</p>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <a
                href="mailto:hello@flytriply.eu"
                className={`rounded-sm text-muted hover:text-[#1A1A1A] transition-colors ${FOCUS_RING}`}
              >
                hello@flytriply.eu
              </a>
              <a
                href="https://flytriply.eu"
                className={`rounded-sm text-muted hover:text-[#1A1A1A] transition-colors ${FOCUS_RING}`}
              >
                flytriply.eu
              </a>
            </nav>
            <a
              href="https://www.instagram.com/flytriplyapp/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Triply on Instagram"
              className={`group flex items-center gap-2 self-center sm:self-auto rounded-sm ${FOCUS_RING}`}
            >
              <span className="text-sm text-muted">@flytriplyapp</span>
              <span className="text-teal group-hover:text-accent transition-colors duration-200 flex">
                <InstagramIcon color="currentColor" size={24} />
              </span>
            </a>
          </div>
          <p className="mt-8 text-xs text-muted/80 text-center sm:text-left">
            {t.footer.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}
