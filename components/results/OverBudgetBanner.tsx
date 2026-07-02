import Link from "next/link";
import { FormattedPrice } from "@/components/shared/FormattedPrice";

interface Props {
  /** Per-person budget the user entered (EUR). */
  budget: number;
  /** Requested trip length in nights. */
  nights: number;
  /**
   * Estimated max nights that WOULD fit the budget at the cheapest returned
   * destination's cost basis. null when it can't be computed (missing data).
   */
  fitNights: number | null;
  /** True when the fixed cost (flights) alone already exceeds the budget. */
  flightsAloneExceed: boolean;
  /** Where the "adjust your trip" CTA points (the wizard). */
  editHref: string;
}

// Shown ONLY when every returned destination is over budget (see
// DestinationSelector). It's guidance, not an error — on-brand coral/teal, never
// alarmist red. The cards still render below, honestly labeled "Over budget";
// this just explains why and what to change, with a real computed number.
export function OverBudgetBanner({
  budget,
  nights,
  fitNights,
  flightsAloneExceed,
  editHref,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#FF6B47]/20 bg-[#FFF6F0] p-5 shadow-sm sm:flex-row sm:items-start sm:p-6">
      <span
        className="text-2xl leading-none shrink-0"
        aria-hidden="true"
      >
        🧭
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="mb-1 text-base font-bold text-[#1A1A1A] sm:text-lg">
          It&apos;s the length, not the picks
        </h2>

        <p className="text-sm leading-relaxed text-muted">
          For {nights} {nights === 1 ? "night" : "nights"}, a realistic trip
          costs more than <FormattedPrice eur={budget} /> per person — so
          everything here lands over budget.{" "}
          {flightsAloneExceed ? (
            <>
              At these destinations, flights alone already exceed your budget —
              try a higher budget or somewhere closer to home.
            </>
          ) : fitNights != null && fitNights >= 1 ? (
            <>
              For <FormattedPrice eur={budget} /> per person you&apos;d fit about{" "}
              <span className="font-semibold text-[#0D7377]">
                {fitNights} {fitNights === 1 ? "night" : "nights"}
              </span>{" "}
              — shorten your trip, or raise your budget to keep the full {nights}
              -night plan.
            </>
          ) : fitNights != null ? (
            <>
              Even a short stay won&apos;t fit at this budget here — try raising
              your budget or picking a closer destination.
            </>
          ) : (
            <>Try shortening your trip, or raising your budget.</>
          )}
        </p>

        <Link
          href={editHref}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-deep"
        >
          Adjust your trip →
        </Link>
      </div>
    </div>
  );
}
