"use client";

import type { TripDetail, BookingLink } from "@/lib/types/trip";
import { formatRange } from "@/lib/dates";
import { isAffiliateActive } from "@/lib/affiliate";

interface Props {
  detail: TripDetail;
}

export function BookingHub({ detail }: Props) {
  const { booking, destination, checkIn, checkOut, budget } = detail;
  const travelers = budget.travelers || 1;
  const dateRange = checkIn && checkOut ? formatRange(checkIn, checkOut) : undefined;

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

      <div className="grid md:grid-cols-3 gap-4 mb-6 items-start">
        <BookingCTACard
          icon="🏨"
          title="Hotels"
          estimate={hotelEstimate ? `~€${hotelEstimate}` : undefined}
          estimateLabel="total stay"
          providers={booking.hotels}
          emphasis="#FF6B47"
          featured
        />
        <BookingCTACard
          icon="✈️"
          title="Flights"
          estimate={flightEstimate ? `from €${flightEstimate}` : undefined}
          estimateLabel="per person"
          providers={booking.flights}
          emphasis="#4A90E2"
        />
        <BookingCTACard
          icon="🎭"
          title="Activities"
          estimate={activitiesEstimate ? `from €${activitiesEstimate}` : undefined}
          estimateLabel="per person"
          providers={booking.activities}
          emphasis="#F4A261"
        />
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

      {booking.reviews.length > 0 && (
        <div className="pt-6 border-t border-[#1a1a1a]/10">
          <p className="text-xs uppercase tracking-widest text-[#1a1a1a]/50 mb-3 font-semibold">
            Research the destination
          </p>
          <div className="flex flex-wrap gap-2">
            {booking.reviews.map((r) => (
              <a
                key={r.provider}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a1a]/5 hover:bg-[#1a1a1a]/10 text-sm text-[#1a1a1a]/70 transition-colors"
              >
                <span>⭐</span>
                <span>{r.provider}</span>
              </a>
            ))}
          </div>
        </div>
      )}

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
  emphasis,
  featured = false,
}: {
  icon: string;
  title: string;
  estimate?: string;
  estimateLabel?: string;
  providers: BookingLink[];
  emphasis: string;
  featured?: boolean;
}) {
  if (providers.length === 0) return null;

  const primary = providers.find((p) => p.primary) ?? providers[0];
  const secondary = providers.filter((p) => p.provider !== primary.provider).slice(0, 2);

  return (
    <div
      className={`relative rounded-2xl bg-white p-5 transition-shadow flex flex-col gap-4 ${
        featured
          ? "border-2 shadow-md hover:shadow-lg"
          : "border border-[#1a1a1a]/10 shadow-sm hover:shadow-md"
      }`}
      style={featured ? { borderColor: `${emphasis}40` } : undefined}
    >
      {featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm whitespace-nowrap"
          style={{ backgroundColor: emphasis }}
        >
          Most popular
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl leading-none">{icon}</span>
          <h3 className="font-bold text-lg text-[#1a1a1a]">{title}</h3>
        </div>
        {estimate && (
          <div className="flex items-baseline gap-1.5">
            <span
              className={featured ? "text-2xl font-bold" : "text-xl font-bold"}
              style={{ color: emphasis }}
            >
              {estimate}
            </span>
            {estimateLabel && (
              <span className="text-xs text-[#1a1a1a]/50">{estimateLabel}</span>
            )}
          </div>
        )}
      </div>

      <a
        href={primary.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`rounded-xl px-4 text-white font-semibold text-center transition-all hover:scale-[1.02] hover:shadow-md ${
          featured ? "py-3.5 text-base" : "py-3 text-sm"
        }`}
        style={{ backgroundColor: emphasis }}
      >
        Search on {primary.provider} →
      </a>

      {isAffiliateActive() && (
        <p className="text-[11px] text-[#1a1a1a]/45 -mt-2 text-center leading-snug">
          Partner link — at no extra cost to you.
        </p>
      )}

      {secondary.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
          {secondary.map((s) => (
            <a
              key={s.provider}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="text-xs text-[#1a1a1a]/60 hover:text-[#1a1a1a] underline-offset-2 hover:underline"
            >
              or try {s.provider}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
