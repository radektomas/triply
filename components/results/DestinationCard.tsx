import Link from "next/link";
import { VibeTag } from "@/components/ui/VibeTag";
import { getGradient } from "@/lib/utils/gradient";
import { getCityPhoto } from "@/lib/photos";
import type { APIDestination } from "@/lib/types";

interface Props {
  destination: APIDestination;
  month: string;
  nights: number;
  budget: number;
  vibe: string;
  originCity: string;
  href?: string;
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

// Fix 2 — rain label + color for weather chips
const rainLabel = { low: "Dry", medium: "Some rain", high: "Wet" } as const;
const rainColor = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-rose-500",
} as const;

export async function DestinationCard({
  destination,
  month,
  nights,
  budget,
  vibe,
  originCity,
  href: hrefOverride,
}: Props) {
  const { estimates, weather } = destination;
  const gradient = getGradient(destination.id);
  const photoUrl = await getCityPhoto(destination.name, destination.country);
  const href =
    hrefOverride ??
    `/trip/${destination.id}?budget=${budget}&month=${month}&nights=${nights}&vibe=${vibe}&originCity=${encodeURIComponent(originCity)}`;

  return (
    // Fix 5 — card hover: lift + warm ring + boosted shadow. `group` enables image zoom.
    <div className="group bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-orange-200">

      {/* Fix 5 — image zoom on hover via inner div scale */}
      <div className="h-44 relative shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          style={{
            background: photoUrl
              ? `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%), url('${photoUrl}') center/cover, ${gradient}`
              : gradient,
          }}
        />

        {/* Fix 1 — budget fit badge: frosted white pill, warm text */}
        <span
          className={`absolute top-3 right-3 bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeTextStyle[destination.budgetFit]}`}
        >
          {budgetFitLabel[destination.budgetFit]}
        </span>

        {destination.confidence === "low" && (
          <span
            className="absolute top-3 left-3 text-white/70 text-sm cursor-default"
            title="Lower confidence — AI had limited data for this destination"
          >
            ⓘ
          </span>
        )}

        {/* Country + title pinned to bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {destination.country}
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            {destination.name}
          </h2>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-sm text-muted mb-3 leading-relaxed">
          {destination.tagline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {destination.vibes.map((v) => (
            <VibeTag key={v} label={v} />
          ))}
        </div>

        {/* Fix 2 — weather chips with inline SVG icons, no middots, no "in Month" */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 pb-4 border-b border-border">
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            {/* Thermometer — lucide path */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
            </svg>
            {weather.tempC}°C
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            {/* Sun */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            {weather.sunshineHours}h sun
          </span>

          <span className={`inline-flex items-center gap-1 text-xs ${rainColor[weather.rain]}`}>
            {/* Cloud rain / cloud (conditionally) */}
            {weather.rain === "low" ? (
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
            {rainLabel[weather.rain]}
          </span>

          {weather.seaTemp !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              {/* Waves */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              </svg>
              {weather.seaTemp}°C sea
            </span>
          )}
        </div>

        {/* Estimates — unchanged content, removed bottom border (moved to price block) */}
        <div className="flex-1 text-xs text-muted space-y-1">
          <p>
            <span className="font-medium text-[#374151]">Flights</span>{" "}
            ~€{estimates.flightRange.typical}
            <span className="ml-1 text-muted/70">
              (€{estimates.flightRange.min}–€{estimates.flightRange.max})
            </span>
          </p>
          <p>
            <span className="font-medium text-[#374151]">Hotel</span>{" "}
            ~€{estimates.hotelPerNightRange.typical}/night
          </p>
          <p>
            <span className="font-medium text-[#374151]">Food</span>{" "}
            ~€{estimates.foodPerDay.midRange}/day
          </p>
        </div>

        {/* Fix 3 — total as hero element */}
        <div className="pt-4 border-t border-slate-200 mt-4">
          <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Per-person total
          </p>
          {/* Fix 4 — deep coral CTA, stacks full-width on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-4xl font-bold text-slate-900 leading-none">
                €{estimates.totalEstimate.typical}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                €{estimates.totalEstimate.min}–€{estimates.totalEstimate.max}
              </p>
            </div>
            <Link
              href={href}
              prefetch
              className="bg-orange-700 hover:bg-orange-800 text-white font-semibold px-5 py-2.5 rounded-full text-sm shadow-sm hover:shadow-md transition-all text-center whitespace-nowrap"
            >
              See full plan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
