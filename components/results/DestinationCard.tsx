import Link from "next/link";
import Image from "next/image";
import { VibeTag } from "@/components/ui/VibeTag";
import { getGradient } from "@/lib/utils/gradient";
import { computeReconciledTotal } from "@/lib/budget";
import { computeNights } from "@/lib/dates";
import { getCityPhoto } from "@/lib/photos";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { SaveButton } from "@/components/auth/SaveButton";
import { buildGygUrl } from "@/lib/gyg";
import type { APIDestination } from "@/lib/types";

function GygTicketIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M9 7v10" strokeDasharray="2 2" />
    </svg>
  );
}

interface Props {
  destination: APIDestination;
  checkIn: string;
  checkOut: string;
  budget: number;
  vibe: string;
  originCity: string;
  href?: string;
  tripId?: string;
}

// Fix 1 — badge: warm text on frosted white, no generic Tailwind semantic colors
const badgeTextStyle = {
  under: "text-emerald-700",
  fit: "text-slate-700",
  over: "text-rose-700",
} as const;

const budgetFitLabel = {
  under: "Under budget",
  fit: "Fits budget",
  over: "Over budget",
} as const;

// Budget-fit is now computed in-app (n8n no longer classifies — it returns an
// honest estimates.totalEstimate.typical and an empty budgetFit). Both inputs
// are per-person, whole-trip, so it's a direct ratio — no travelers
// multiplication, no pp/total conversion. Thresholds are the ratio of estimated
// per-person total to per-person budget; tune here.
const BUDGET_FIT_OVER_RATIO = 1.05; // > 5% over budget → "over"
const BUDGET_FIT_UNDER_RATIO = 0.85; // < 85% of budget → "under"

function computeBudgetFit(
  typical: number | undefined,
  budget: number,
): "under" | "fit" | "over" | null {
  // Missing/zero/NaN on either side → no honest verdict; caller hides the badge.
  if (!budget || !typical || Number.isNaN(typical)) return null;
  const ratio = typical / budget;
  if (ratio > BUDGET_FIT_OVER_RATIO) return "over";
  if (ratio < BUDGET_FIT_UNDER_RATIO) return "under";
  return "fit";
}

// Fix 2 — rain label + color for weather chips
const rainLabel = { low: "Dry", medium: "Some rain", high: "Wet" } as const;
const rainColor = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-rose-500",
} as const;

export async function DestinationCard({
  destination,
  checkIn,
  checkOut,
  budget,
  vibe,
  originCity,
  href: hrefOverride,
  tripId,
}: Props) {
  const href =
    hrefOverride ??
    `/trip/${destination.id}?budget=${budget}&checkIn=${checkIn}&checkOut=${checkOut}&vibe=${vibe}&originCity=${encodeURIComponent(originCity)}`;

  // P0-1: tolerate a malformed / partial n8n payload. Every nested field is
  // optional-chained and each sub-element is hidden (not faked) when its data is
  // missing, and the whole body is wrapped in a try/catch that returns a
  // contained fallback card — so one bad destination can no longer throw and
  // blank the entire results grid (this is an async server component rendered
  // inside a .map, so an uncaught throw would hit the route error boundary).
  try {
    const estimates = destination.estimates;
    const weather = destination.weather;
    // Reconciled per-person total — the SAME shared computation the detail page
    // uses (lib/budget.ts), so the card total/range always equals the detail
    // page total/range for the same destination (no grid↔detail drift). The
    // badge is computed from this same reconciled total so it reflects the
    // number actually shown, not n8n's unreliable totalEstimate.
    const nights = computeNights(checkIn, checkOut);
    const reconciled = computeReconciledTotal(estimates, nights);
    const budgetFit = computeBudgetFit(reconciled?.total, budget);
    const gradient = getGradient(destination.id);
    const photoUrl = await getCityPhoto(
      destination.name ?? "",
      destination.country ?? "",
    );

    const tempC = weather?.tempC;
    const sunHours = weather?.sunshineHours;
    // Guard against an unexpected rain value (not just missing) so the label/
    // color lookups can never yield "undefined".
    const rainRaw = weather?.rain;
    const rainKey =
      rainRaw === "low" || rainRaw === "medium" || rainRaw === "high"
        ? rainRaw
        : undefined;
    const seaTemp = weather?.seaTemp;
    const hasWeather =
      tempC != null || sunHours != null || rainKey != null || seaTemp != null;

    const flightTypical = estimates?.flightRange?.typical;
    const flightMin = estimates?.flightRange?.min;
    const flightMax = estimates?.flightRange?.max;
    const hotelNightly = estimates?.hotelPerNightRange?.typical;
    const foodDaily = estimates?.foodPerDay?.midRange;
    // Big "Per-person total" — sourced from the reconciled budget (sum of rows),
    // matching the detail page. null → the block is hidden (no fake number).
    const totalTypical = reconciled?.total;
    const totalMin = reconciled?.min;
    const totalMax = reconciled?.max;
    const hasEstimateRows =
      flightTypical != null || hotelNightly != null || foodDaily != null;

    return (
      // Fix 5 — card hover: lift + warm ring + boosted shadow. `group` enables image zoom.
      <div className="group bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-orange-200">

        {/* Fix 5 — image zoom on hover via inner div scale */}
        <div className="h-64 sm:h-72 lg:h-80 relative shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
            style={{ background: gradient }}
          >
            {photoUrl && (
              <>
                <Image
                  src={photoUrl}
                  alt={`${destination.name ?? "Destination"}${destination.country ? `, ${destination.country}` : ""}`}
                  fill
                  // Tracks the responsive grid: 1-up <md, 2-up md, 3-up lg+
                  // so next/image picks the right source width per breakpoint.
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
                {/* Darkening overlay — keeps the white country/title legible */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
                  }}
                />
              </>
            )}
          </div>

          {/* Budget fit badge: frosted white pill, warm text. Verdict is computed
              in-app (computeBudgetFit) from the per-person estimate vs the user's
              per-person budget — hidden entirely when those numbers are missing,
              never falling back to the (now-empty) n8n budgetFit. */}
          {budgetFit && (
            <span
              className={`absolute top-3 right-3 bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeTextStyle[budgetFit]}`}
            >
              {budgetFitLabel[budgetFit]}
            </span>
          )}

          <SaveButton
            destination={destination}
            context={{ tripId, checkIn, checkOut, budget, vibe, originCity }}
          />

          {destination.confidence === "low" && (
            <span
              className="absolute top-3 left-14 text-white/70 text-sm cursor-default"
              title="Lower confidence — AI had limited data for this destination"
            >
              ⓘ
            </span>
          )}

          {/* Country + title pinned to bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {destination.country && (
              <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-0.5">
                {destination.country}
              </p>
            )}
            {destination.name && (
              <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                {destination.name}
              </h2>
            )}
          </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {destination.tagline && (
            <p className="text-sm text-muted mb-3 leading-relaxed">
              {destination.tagline}
            </p>
          )}

          {(destination.vibes?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {(destination.vibes ?? []).map((v) => (
                <VibeTag key={v} label={v} />
              ))}
            </div>
          )}

          {/* Fix 2 — weather chips with inline SVG icons, no middots, no "in Month".
              Whole row + each chip hidden when the underlying value is missing. */}
          {hasWeather && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 pb-4 border-b border-border">
              {tempC != null && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  {/* Thermometer — lucide path */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                  </svg>
                  {tempC}°C
                </span>
              )}

              {sunHours != null && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  {/* Sun */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </svg>
                  {sunHours}h sun
                </span>
              )}

              {rainKey != null && (
                <span className={`inline-flex items-center gap-1 text-xs ${rainColor[rainKey]}`}>
                  {/* Cloud rain / cloud (conditionally) */}
                  {rainKey === "low" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/>
                      <line x1="8" y1="19" x2="8" y2="21"/>
                      <line x1="8" y1="13" x2="8" y2="15"/>
                      <line x1="16" y1="19" x2="16" y2="21"/>
                      <line x1="16" y1="13" x2="16" y2="15"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="12" y1="15" x2="12" y2="17"/>
                    </svg>
                  )}
                  {rainLabel[rainKey]}
                </span>
              )}

              {seaTemp != null && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  {/* Waves */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  </svg>
                  {seaTemp}°C sea
                </span>
              )}
            </div>
          )}

          {/* Estimates — each row hidden when its figure is missing */}
          <div className="flex-1 text-xs text-muted space-y-1">
            {flightTypical != null && (
              <p>
                <span className="font-medium text-[#374151]">Flights</span>{" "}
                ~<FormattedPrice eur={flightTypical} />
                {flightMin != null && flightMax != null && (
                  <span className="ml-1 text-muted/70">
                    (<FormattedPrice eur={flightMin} />–<FormattedPrice eur={flightMax} />)
                  </span>
                )}
              </p>
            )}
            {hotelNightly != null && (
              <p>
                <span className="font-medium text-[#374151]">Hotel</span>{" "}
                ~<FormattedPrice eur={hotelNightly} />/night
              </p>
            )}
            {foodDaily != null && (
              <p>
                <span className="font-medium text-[#374151]">Food</span>{" "}
                ~<FormattedPrice eur={foodDaily} />/day
              </p>
            )}
            {!hasEstimateRows && (
              <p className="text-muted/70">Estimate unavailable</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 mt-4">
            {totalTypical != null && (
              <>
                <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
                  Per-person total
                </p>
                <div>
                  <p className="text-4xl font-bold text-slate-900 leading-none">
                    <FormattedPrice eur={totalTypical} />
                  </p>
                  {totalMin != null && totalMax != null && (
                    <p className="text-xs text-slate-400 mt-1">
                      <FormattedPrice eur={totalMin} />–<FormattedPrice eur={totalMax} />
                    </p>
                  )}
                </div>
              </>
            )}
            <Link
              href={href}
              prefetch
              className="mt-4 block w-full bg-orange-700 hover:bg-orange-800 text-white font-semibold px-5 py-3 rounded-full text-sm shadow-sm hover:shadow-md transition-all text-center"
            >
              See full plan →
            </Link>
            {destination.name && (
              <a
                href={buildGygUrl(`${destination.name} ${destination.country ?? ""}`.trim())}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-[#0D7377] transition-colors"
              >
                <GygTicketIcon size={12} />
                <span>Things to do in {destination.name} →</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error(
      `[DestinationCard] render failed for "${destination?.id ?? "unknown"}":`,
      err,
    );
    // Contained fallback — keeps grid layout intact and never fakes numbers.
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col items-center justify-center text-center p-6 min-h-[420px]">
        <p className="text-sm text-muted">This destination couldn’t be loaded.</p>
        {destination?.name && (
          <p className="mt-1 font-semibold text-[#1A1A1A]">
            {destination.name}
            {destination.country ? `, ${destination.country}` : ""}
          </p>
        )}
        <Link
          href={href}
          className="mt-4 text-sm font-semibold text-[#0D7377] hover:underline"
        >
          See full plan →
        </Link>
      </div>
    );
  }
}
