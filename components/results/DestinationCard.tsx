import Link from "next/link";
import { VibeTag } from "@/components/ui/VibeTag";
import { WeatherBadge } from "@/components/ui/WeatherBadge";
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

const budgetFitStyle = {
  under: "bg-green-100 text-green-700",
  fit: "bg-blue-100 text-blue-700",
  over: "bg-orange-100 text-orange-700",
} as const;

const budgetFitLabel = {
  under: "Under budget",
  fit: "Fits budget",
  over: "Over budget",
} as const;

export async function DestinationCard({ destination, month, nights, budget, vibe, originCity, href: hrefOverride }: Props) {
  const { estimates } = destination;
  const gradient = getGradient(destination.id);
  const photoUrl = await getCityPhoto(destination.name, destination.country);
  const href = hrefOverride ?? `/trip/${destination.id}?budget=${budget}&month=${month}&nights=${nights}&vibe=${vibe}&originCity=${encodeURIComponent(originCity)}`;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Photo/gradient header */}
      <div
        className="h-44 relative flex items-end p-4 shrink-0"
        style={{
          background: photoUrl
            ? `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%), url('${photoUrl}') center/cover, ${gradient}`
            : gradient,
        }}
      >
        <span
          className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${budgetFitStyle[destination.budgetFit]}`}
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
        <div>
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

        <div className="mb-4 pb-4 border-b border-border">
          <WeatherBadge weather={destination.weather} month={month} />
        </div>

        <div className="mb-4 flex-1 text-xs text-muted space-y-1">
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

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted mb-0.5">Typical total</p>
            <p className="text-xl font-bold text-[#1A1A1A]">
              €{estimates.totalEstimate.typical}
            </p>
            <p className="text-xs text-muted">
              €{estimates.totalEstimate.min}–€{estimates.totalEstimate.max}
            </p>
          </div>
          <Link
            href={href}
            prefetch
            className="bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all"
          >
            See full plan →
          </Link>
        </div>
      </div>
    </div>
  );
}
