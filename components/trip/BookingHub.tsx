"use client";

import { motion } from "framer-motion";
import type { TripDetail, BookingLink } from "@/lib/types/trip";
import { formatRange } from "@/lib/dates";
import { isAffiliateActive } from "@/lib/affiliate";
import {
  buildBookingAffiliateLink,
  isBookingAffiliateActive,
} from "@/lib/affiliates/booking";
import { useCurrency } from "@/contexts/CurrencyContext";
import { track } from "@/lib/analytics";
import { CarIcon } from "@/components/landing/VibeIcons";
import { TriplyBookingSignoff } from "./TriplyBookingSignoff";

// Normalize a provider name into the affiliate partner key the funnel
// dashboard breaks down on. The three target partners are matched by
// substring; any other provider (Kiwi, Hostelworld, Viator…) gets a slug so it
// still records distinctly without polluting the booking/skyscanner/getyourguide
// counts.
function affiliatePartner(provider: string): string {
  const p = provider.toLowerCase();
  if (p.includes("booking")) return "booking";
  if (p.includes("skyscanner")) return "skyscanner";
  if (p.includes("getyourguide") || p.includes("gyg")) return "getyourguide";
  return p.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "other";
}

// Fire-and-forget on affiliate link click. track() never throws or awaits, so
// the browser's default navigation to the affiliate URL proceeds uninterrupted.
function trackAffiliateClick(provider: string, destination: string): void {
  track("affiliate_clicked", {
    partner: affiliatePartner(provider),
    destination,
  });
}

// Booking.com supports a `selected_currency` URL param that pre-selects the
// currency on their search results page. We inject the user's currently
// selected currency so display continuity is preserved from Triply → Booking.
// EUR is Booking's default for many EU markets — skip the param when EUR to
// keep the URL shorter. Only applied to Booking.com URLs; other providers
// (Hostelworld, Airbnb) handle currency on their own.
function withBookingCurrency(url: string, currency: string): string {
  if (currency === "EUR") return url;
  if (!url.includes("booking.com")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}selected_currency=${encodeURIComponent(currency)}`;
}

// Road-logistics tips (from the model's free-text tips[]) surfaced in the
// car-mode slot where the flight card would have been. Matching is scoped to
// the vocabulary of driving costs — vignette/toll/motorway/fuel — so generic
// sightseeing tips never leak into the booking hub (TipsList shows them all).
const CAR_TIP_RE = /vignette|toll|motorway|fuel/i;

interface Props {
  detail: TripDetail;
  /**
   * How the traveler gets there (from the trip's input). Car trips hide the
   * flight CTA entirely and surface road-logistics tips in its place.
   * Defaults to plane so callers without a trip input (quick picks) keep the
   * historical layout.
   */
  transportMode?: "plane" | "car";
  /**
   * The destination's free-text tips[] (same array TipsList renders). Only
   * read in car mode, to populate CarEssentialsSlot. Optional so callers
   * without tips (quick picks) need no change.
   */
  tips?: string[];
}

export function BookingHub({ detail, transportMode = "plane", tips = [] }: Props) {
  const { booking, destination, checkIn, checkOut, budget } = detail;
  const isCar = transportMode === "car";
  const carTips = isCar ? tips.filter((t) => CAR_TIP_RE.test(t)) : [];
  const travelers = budget.travelers || 1;
  // Flights/Activities amounts come from budget.breakdown — which are per-person
  // (never multiplied by travelers). The whole detail page reads per-person
  // (matching the Budget widget hero), so label these per-person too. (Was
  // "total · N travelers", which overstated/contradicted the per-person figure.)
  const perPersonLabel = "per person";
  const dateRange = checkIn && checkOut ? formatRange(checkIn, checkOut) : undefined;
  const { selectedCurrency, format } = useCurrency();
  const fmt = (eur: number) => format(eur, { rounded: true });

  // The Booking.com hotel provider's href is rebuilt here as a CJ affiliate
  // deep link (destination + adults; no dates — Triply doesn't capture exact
  // dates, so Booking prompts for them). This is the single chokepoint every
  // hotel card flows through, so both AI-generated and quick-pick trips get the
  // affiliate link. Currency is passed through (skipping EUR, matching the
  // legacy `withBookingCurrency` behaviour) so it lands on the INNER Booking
  // URL. Non-Booking hotel providers keep the existing Booking.com
  // `selected_currency` injection (a no-op for non-booking.com URLs). Flights
  // and activities pass through untouched.
  const hotelProviders = booking.hotels.map((p) =>
    p.provider.toLowerCase().includes("booking")
      ? {
          ...p,
          url: buildBookingAffiliateLink({
            destination,
            adults: travelers,
            checkIn,
            checkOut,
            currency: selectedCurrency === "EUR" ? undefined : selectedCurrency,
          }),
        }
      : { ...p, url: withBookingCurrency(p.url, selectedCurrency) },
  );

  // Whether a live CJ Booking.com affiliate card is actually rendered. The CJ
  // link is always earning-capable (static tracking URL), so the commission
  // disclosure must show when such a card is present — independent of the
  // env-gated AWIN path. ORed with isAffiliateActive() so the existing AWIN
  // disclosure is never weakened.
  const hasBookingAffiliateCard =
    isBookingAffiliateActive() &&
    booking.hotels.some((p) => p.provider.toLowerCase().includes("booking"));
  const showAffiliateDisclosure = isAffiliateActive() || hasBookingAffiliateCard;

  const findCost = (key: string) =>
    budget.breakdown.find((c) => c.label.toLowerCase().includes(key))?.amount;

  const flightEstimate = findCost("flight");
  const hotelEstimate = findCost("hotel") ?? findCost("accommodation");
  const activitiesEstimate = findCost("activ");

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0D7377] mb-2">
          Ready to book?
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[#1a1a1a]">
          Your trip to {destination}
        </h2>
        {dateRange && (
          <p className="text-[#1a1a1a]/60 mt-2 text-sm md:text-base">
            {dateRange} · {travelers} {travelers === 1 ? "traveler" : "travelers"}
          </p>
        )}
      </div>

      <div className="relative mb-6">
        {/* The stay is the hero: a full-width primary card, visually dominant
            over everything below. The Booking.com CTA it carries is the hub's
            single most prominent action. Everything else (flights,
            activities) demotes to the compact secondary grid underneath. */}
        <StayHeroCard
          destination={destination}
          estimate={hotelEstimate ? `~${fmt(hotelEstimate)}` : undefined}
          estimateLabel="per person · whole stay"
          providers={hotelProviders}
          forceDisclosure={hasBookingAffiliateCard}
        />

        <div className="grid sm:grid-cols-2 gap-4 items-stretch mt-4">
          {/* Car trips have no flight leg — the flight CTA disappears
              entirely rather than demoting further. */}
          {!isCar && (
            <BookingCTACard
              icon="✈️"
              title="Flights"
              estimate={flightEstimate ? `from ${fmt(flightEstimate)}` : undefined}
              estimateLabel={perPersonLabel}
              providers={booking.flights}
              destination={destination}
            />
          )}
          <BookingCTACard
            icon="🎭"
            title="Activities"
            estimate={activitiesEstimate ? `from ${fmt(activitiesEstimate)}` : undefined}
            estimateLabel={perPersonLabel}
            providers={booking.activities}
            destination={destination}
          />
          {isCar && <CarEssentialsSlot tips={carTips} />}
        </div>

        <div className="hidden lg:flex absolute right-[-220px] top-[-140px] z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <TriplyBookingSignoff />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#FFF4E6] border border-[#F4A261]/30 p-4 flex items-start gap-3 mb-6">
        <span className="text-xl leading-none mt-0.5">💡</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1a1a1a] mb-0.5">Best time to book</p>
          <p className="text-sm text-[#1a1a1a]/70 leading-snug">
            {isCar
              ? "Book hotels 2–3 weeks ahead for best rates."
              : "Flight prices are typically lowest 6–8 weeks before departure. Book hotels 2–3 weeks ahead for best rates."}
          </p>
        </div>
      </div>

      {showAffiliateDisclosure && (
        <p className="text-xs text-[#1a1a1a]/50 mt-8 text-center leading-relaxed">
          Triply may earn a commission when you book through our partner links, at no extra cost to you.
        </p>
      )}
    </section>
  );
}

// The hub's hero: a full-width primary card for the stay, dominated by the
// Booking.com CTA (the primary hotel provider is rebuilt as the CJ affiliate
// deep link upstream in BookingHub — this component only lays it out).
function StayHeroCard({
  destination,
  estimate,
  estimateLabel,
  providers,
  forceDisclosure,
}: {
  destination: string;
  estimate?: string;
  estimateLabel?: string;
  providers: BookingLink[];
  forceDisclosure?: boolean;
}) {
  if (providers.length === 0) return null;

  const primary = providers.find((p) => p.primary) ?? providers[0];
  const secondary = providers
    .filter((p) => p.provider !== primary.provider)
    .slice(0, 2);

  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.06), 0 28px 56px -16px rgba(13,115,119,0.24)",
      }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl p-6 sm:p-8"
      style={{
        border: "1px solid rgba(13,115,119,0.12)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 20px 44px -14px rgba(13,115,119,0.16)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl leading-none">🏨</span>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0D7377]">
              Where you&apos;ll sleep
            </p>
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-bold text-[#1A1A1A]">
            Find your stay in {destination}
          </h3>
          {estimate && (
            <p className="mt-2 text-[#1A1A1A]/60 text-sm">
              <span className="font-semibold text-lg text-[#1A1A1A]">{estimate}</span>
              {estimateLabel && <span className="ml-1.5">{estimateLabel}</span>}
            </p>
          )}
        </div>

        <div className="md:shrink-0 w-full md:w-auto md:text-right">
          <motion.a
            href={primary.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackAffiliateClick(primary.provider, destination)}
            whileHover={{
              y: -1,
              boxShadow: "0 8px 24px rgba(13,115,119,0.36)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="group/cta w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-teal hover:bg-teal-deep text-white transition-colors"
            style={{
              border: "1px solid transparent",
              boxShadow: "0 4px 14px rgba(13,115,119,0.26)",
            }}
          >
            <span>Search on {primary.provider}</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.a>

          {(isAffiliateActive() || forceDisclosure) && (
            <p className="text-[11px] text-[#1A1A1A]/45 mt-2 text-center md:text-right leading-snug">
              Partner link — at no extra cost to you.
            </p>
          )}

          {secondary.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center md:justify-end gap-x-3 gap-y-1">
              {secondary.map((s) => (
                <a
                  key={s.provider}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => trackAffiliateClick(s.provider, destination)}
                  className="text-[12px] text-[#0D7377]/55 hover:text-[#0D7377]/80 transition-colors underline-offset-2 hover:underline"
                >
                  or try {s.provider}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Secondary-grid slot for car trips, in the flight card's place: the
// destination's road-logistics tips (vignette/toll/motorway/fuel, filtered by
// CAR_TIP_RE upstream). Purely informational — no CTA, no affiliate link —
// styled to the same quiet weight as the demoted BookingCTACards. Renders
// nothing when the model's tips carry no road content, so the grid never
// shows an empty card.
function CarEssentialsSlot({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;

  return (
    <div
      className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col h-full"
      style={{
        border: "1px solid rgba(13,115,119,0.06)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 10px 24px -12px rgba(13,115,119,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CarIcon color="#0D7377" size={20} />
        <h3 className="font-bold text-base text-[#1A1A1A]">On the road</h3>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li
            key={i}
            className="text-sm text-[#374151] leading-snug flex items-start gap-2"
          >
            <span className="text-[#0D7377] font-bold flex-shrink-0 mt-px">
              →
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookingCTACard({
  icon,
  title,
  estimate,
  estimateLabel,
  providers,
  destination,
}: {
  icon: string;
  title: string;
  estimate?: string;
  estimateLabel?: string;
  providers: BookingLink[];
  destination: string;
}) {
  if (providers.length === 0) return null;

  const primary = providers.find((p) => p.primary) ?? providers[0];
  const secondary = providers.filter((p) => p.provider !== primary.provider).slice(0, 2);

  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.06), 0 16px 32px -14px rgba(13,115,119,0.14)",
      }}
      transition={{ duration: 0.2 }}
      // Secondary tier: deliberately smaller and quieter than StayHeroCard —
      // tighter padding, smaller type, outline (not filled) CTA.
      className="bg-white rounded-3xl p-5 sm:p-6 flex flex-col h-full"
      style={{
        border: "1px solid rgba(13,115,119,0.06)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 10px 24px -12px rgba(13,115,119,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl leading-none">{icon}</span>
        <h3 className="font-bold text-base text-[#1A1A1A]">{title}</h3>
      </div>

      {estimate && (
        <div className="mb-5">
          <p className="font-semibold text-lg text-[#1A1A1A] whitespace-nowrap">
            {estimate}
          </p>
          {estimateLabel && (
            <p className="text-xs text-[#1A1A1A]/55 mt-0.5">{estimateLabel}</p>
          )}
        </div>
      )}

      <motion.a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => trackAffiliateClick(primary.provider, destination)}
        whileHover={{
          y: -1,
          boxShadow: "0 4px 14px rgba(13,115,119,0.20)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        // Quiet teal outline pill — the booking role's secondary weight. The
        // filled bg-teal treatment is reserved for the StayHeroCard CTA so
        // the hub has exactly one dominant action.
        className="group/cta mt-auto w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-teal hover:text-white bg-white hover:bg-teal transition-colors"
        style={{
          border: "1px solid rgba(13,115,119,0.35)",
        }}
      >
        <span>Search on {primary.provider}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover/cta:translate-x-0.5"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </motion.a>

      {isAffiliateActive() && (
        <p className="text-[11px] text-[#1A1A1A]/45 mt-2 text-center leading-snug">
          Partner link — at no extra cost to you.
        </p>
      )}

      {secondary.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {secondary.map((s) => (
            <a
              key={s.provider}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackAffiliateClick(s.provider, destination)}
              className="text-[12px] text-[#0D7377]/55 hover:text-[#0D7377]/80 transition-colors underline-offset-2 hover:underline"
            >
              or try {s.provider}
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
}
