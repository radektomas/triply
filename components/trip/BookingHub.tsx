"use client";

import { motion } from "framer-motion";
import type { TripDetail, BookingLink } from "@/lib/types/trip";
import { formatRange } from "@/lib/dates";
import { isAffiliateActive } from "@/lib/affiliate";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TriplyBookingSignoff } from "./TriplyBookingSignoff";

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

interface Props {
  detail: TripDetail;
}

export function BookingHub({ detail }: Props) {
  const { booking, destination, checkIn, checkOut, budget } = detail;
  const travelers = budget.travelers || 1;
  // Flights/Activities amounts come from budget.breakdown — same source as the
  // Budget widget, which labels them as totals for the trip. Reuse the same
  // phrasing here so units stay consistent.
  const travelersTotalLabel = `total · ${travelers} ${travelers === 1 ? "traveler" : "travelers"}`;
  const dateRange = checkIn && checkOut ? formatRange(checkIn, checkOut) : undefined;
  const { selectedCurrency, format } = useCurrency();
  const fmt = (eur: number) => format(eur, { rounded: true });

  // Hotel providers get Booking.com `selected_currency` injection. Other
  // category providers (flights, activities) pass through unchanged.
  const hotelProviders = booking.hotels.map((p) => ({
    ...p,
    url: withBookingCurrency(p.url, selectedCurrency),
  }));

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
        <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a1a]">
          Your trip to {destination}
        </h2>
        {dateRange && (
          <p className="text-[#1a1a1a]/60 mt-2 text-sm md:text-base">
            {dateRange} · {travelers} {travelers === 1 ? "traveler" : "travelers"}
          </p>
        )}
      </div>

      <div className="relative mb-6">
        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          <BookingCTACard
            icon="🏨"
            title="Hotels"
            estimate={hotelEstimate ? `~${fmt(hotelEstimate)}` : undefined}
            estimateLabel="total stay"
            providers={hotelProviders}
          />
          <BookingCTACard
            icon="✈️"
            title="Flights"
            estimate={flightEstimate ? `from ${fmt(flightEstimate)}` : undefined}
            estimateLabel={travelersTotalLabel}
            providers={booking.flights}
          />
          <BookingCTACard
            icon="🎭"
            title="Activities"
            estimate={activitiesEstimate ? `from ${fmt(activitiesEstimate)}` : undefined}
            estimateLabel={travelersTotalLabel}
            providers={booking.activities}
          />
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
            Flight prices are typically lowest 6–8 weeks before departure. Book hotels 2–3 weeks ahead for best rates.
          </p>
        </div>
      </div>

      {isAffiliateActive() && (
        <p className="text-xs text-[#1a1a1a]/50 mt-8 text-center leading-relaxed">
          Triply may earn a commission when you book through our partner links, at no extra cost to you.
        </p>
      )}
    </section>
  );
}

function BookingCTACard({
  icon,
  title,
  estimate,
  estimateLabel,
  providers,
}: {
  icon: string;
  title: string;
  estimate?: string;
  estimateLabel?: string;
  providers: BookingLink[];
}) {
  if (providers.length === 0) return null;

  const primary = providers.find((p) => p.primary) ?? providers[0];
  const secondary = providers.filter((p) => p.provider !== primary.provider).slice(0, 2);

  return (
    <motion.div
      whileHover={{
        y: -2,
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.06), 0 20px 40px -16px rgba(13,115,119,0.18)",
      }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl p-6 sm:p-7 flex flex-col h-full"
      style={{
        border: "1px solid rgba(13,115,119,0.06)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -12px rgba(13,115,119,0.10)",
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl leading-none">{icon}</span>
        <h3 className="font-bold text-lg text-[#1A1A1A]">{title}</h3>
      </div>

      {estimate && (
        <div className="mb-6">
          <p className="font-semibold text-2xl text-[#1A1A1A] whitespace-nowrap">
            {estimate}
          </p>
          {estimateLabel && (
            <p className="text-sm text-[#1A1A1A]/55 mt-0.5">{estimateLabel}</p>
          )}
        </div>
      )}

      <motion.a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        whileHover={{
          y: -1,
          background: "#0A5D60",
          boxShadow: "0 6px 18px rgba(13,115,119,0.32)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="group/cta mt-auto w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold"
        style={{
          background: "#0D7377",
          color: "#FFFFFF",
          border: "1px solid transparent",
          boxShadow: "0 2px 8px rgba(13,115,119,0.18)",
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
