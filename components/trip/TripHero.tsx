import Link from "next/link";
import { getCityPhoto } from "@/lib/utils/photo";
import type { APIDestination } from "@/lib/types";

const rainLabel = { low: "Dry", medium: "Some rain", high: "Wet" } as const;

function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

interface Props {
  destination: APIDestination;
  gradient: string;
  month: string;
  nights: number;
  returnUrl: string;
}

export function TripHero({ destination, gradient, month, nights, returnUrl }: Props) {
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  const { weather, estimates } = destination;
  const flag = destination.countryCode ? countryCodeToFlag(destination.countryCode) : "";
  const photoUrl = getCityPhoto(destination.name, destination.country);

  return (
    <div
      className="relative py-14 px-4"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.1) 100%), url('${photoUrl}'), ${gradient}`,
        backgroundSize: "100% 100%, cover, 100% 100%",
        backgroundPosition: "center, center, center",
      }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href={returnUrl}
          className="inline-flex items-center gap-1 text-white/70 text-sm font-medium hover:text-white transition-colors mb-8"
        >
          ← Back to results
        </Link>

        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">
          {flag && <span className="mr-1.5">{flag}</span>}
          {destination.country}
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-3">
          {destination.name}
        </h1>
        <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-lg">
          {destination.description}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2.5">
            <span className="text-2xl font-bold text-white">
              €{estimates.totalEstimate.typical}
            </span>
            <span className="text-white/70 text-sm ml-1.5">typical</span>
            <p className="text-white/55 text-xs mt-0.5">
              €{estimates.totalEstimate.min}–€{estimates.totalEstimate.max}
            </p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2.5 text-white">
            <span className="font-bold">{nights}</span>
            <span className="text-white/70 text-sm ml-1.5">
              {nights === 1 ? "night" : "nights"}
            </span>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2.5 text-white text-sm">
            <span className="font-semibold">{weather.tempC}°C</span>
            <span className="text-white/70 mx-1.5">·</span>
            <span>{weather.sunshineHours}h sun</span>
            <span className="text-white/70 mx-1.5">·</span>
            <span>{rainLabel[weather.rain]}</span>
            {weather.seaTemp !== undefined && (
              <>
                <span className="text-white/70 mx-1.5">·</span>
                <span>{weather.seaTemp}°C sea</span>
              </>
            )}
            <span className="text-white/60 ml-1.5">in {monthLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
