import Link from "next/link";
import { getCityPhotos } from "@/lib/photos";
import { getGradient } from "@/lib/utils/gradient";
import { PhotoCarousel } from "./PhotoCarousel";
import type { APIDestination } from "@/lib/types";

const rainLabel = { low: "Dry", medium: "Some rain", high: "Wet" } as const;

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

interface Props {
  destination: APIDestination;
  month: string;
  nights: number;
  returnUrl: string;
}

export async function TripHero({ destination, month, nights, returnUrl }: Props) {
  const photos = await getCityPhotos(destination.name, destination.country);
  const gradient = getGradient(destination.id);
  const flag = countryCodeToFlag(destination.countryCode);
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  const { weather, estimates } = destination;

  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <PhotoCarousel
        photos={photos}
        fallbackGradient={gradient}
        destinationName={destination.name}
        country={destination.country}
      />

      {/* Back link */}
      <div className="absolute top-0 left-0 right-0 z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        <Link
          href={returnUrl}
          className="inline-flex items-center gap-1 text-white/70 text-sm font-medium hover:text-white transition-colors"
        >
          ← Back to results
        </Link>
      </div>

      {/* Hero content pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-10">
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">
          {flag && <span className="mr-1.5">{flag}</span>}
          {destination.country}
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-3">
          {destination.name}
        </h1>
        <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-lg">
          {destination.description}
        </p>

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
    </section>
  );
}
