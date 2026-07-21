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
// DestinationSelector). Guidance, not an error. No icon — the panel carries
// the visual weight instead: the same warm coral-gradient surface as the
// GenerateMore panel (one shared "Triply speaks" language on this page), a
// display-face heading with the key figures picked out in coral, and the fix
// one tap away. Never alarmist red, no emoji, no em-dashes.
export function OverBudgetBanner({
  budget,
  nights,
  fitNights,
  flightsAloneExceed,
  editHref,
}: Props) {
  let heading: React.ReactNode;
  let body: React.ReactNode;

  if (flightsAloneExceed) {
    heading = (
      <>
        Flights alone are over{" "}
        <span className="text-accent">
          <FormattedPrice eur={budget} estimate={false} />
        </span>
      </>
    );
    body =
      "Getting to these spots costs more than the whole budget. Somewhere closer to home, or a higher budget, will fix it.";
  } else if (fitNights != null && fitNights >= 1) {
    heading = (
      <>
        <FormattedPrice eur={budget} /> covers about{" "}
        <span className="text-accent">
          {fitNights} {fitNights === 1 ? "night" : "nights"}
        </span>{" "}
        here
      </>
    );
    body = `These picks run over for the full ${nights} ${
      nights === 1 ? "night" : "nights"
    }. Shorten the stay, or raise the budget to keep the whole plan.`;
  } else if (fitNights != null) {
    heading = "This budget won't stretch here";
    body = (
      <>
        Even a short stay in these spots costs more than{" "}
        <FormattedPrice eur={budget} estimate={false} /> per person. Try a higher budget or
        somewhere closer to home.
      </>
    );
  } else {
    heading = "These came in over budget";
    body =
      "Shortening the trip or raising the budget will bring them in line.";
  }

  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border border-accent/15 shadow-sm px-5 py-5 sm:px-7 sm:py-6"
      style={{
        background:
          "linear-gradient(135deg, #FFF0ED 0%, rgba(255,228,204,0.55) 100%)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1A1A1A] leading-tight">
            {heading}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
        </div>

        <Link
          href={editHref}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-deep active:scale-95"
        >
          Adjust my trip →
        </Link>
      </div>
    </div>
  );
}
