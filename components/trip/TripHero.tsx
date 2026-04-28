import Link from "next/link";
import { getCityPhotos } from "@/lib/photos";
import { getGradient } from "@/lib/utils/gradient";
import { formatRange } from "@/lib/dates";
import { PhotoCarousel } from "./PhotoCarousel";
import type { TripDetail } from "@/lib/types/trip";

const precipLabel = { dry: "Dry", mixed: "Some rain", wet: "Wet" } as const;

interface Props {
  trip: TripDetail;
  returnUrl: string;
  returnLabel?: string;
}

export async function TripHero({ trip, returnUrl, returnLabel = "Back to results" }: Props) {
  const photos = await getCityPhotos(trip.destination, trip.country);
  const gradient = getGradient(trip.id);

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "clamp(420px, 70dvh, 640px)" }}
    >
      <PhotoCarousel
        photos={photos}
        fallbackGradient={gradient}
        destinationName={trip.destination}
        country={trip.country}
      />

      {/* Back chip — floating, safe-area aware */}
      <div
        className="absolute top-0 left-0 right-0 z-20 max-w-2xl mx-auto px-4 sm:px-6"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
      >
        <Link
          href={returnUrl}
          className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/25 transition-all duration-200"
        >
          <span aria-hidden="true">←</span> {returnLabel}
        </Link>
      </div>

      {/* Hero content pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-10">
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">
          <span aria-hidden="true" className="mr-1.5">{trip.countryCode
            .toUpperCase()
            .replace(/./g, (c) =>
              String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)
            )}</span>
          {trip.country}
        </p>

        <h1
          className="font-bold text-white leading-tight mb-3"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
        >
          {trip.destination}
        </h1>

        <p
          className="text-white/80 text-base sm:text-lg leading-relaxed mb-6"
          style={{ maxWidth: "min(52ch, 100%)" }}
        >
          {trip.description}
        </p>

        {/* Stats row — glass cards */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Price */}
          <div
            className="backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <span
              className="text-2xl font-bold text-white"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              €{trip.budget.total}
            </span>
            <span className="text-white/70 text-sm ml-1.5">typical</span>
            <p className="text-white/55 text-xs mt-0.5">
              €{trip.budget.range.min}–€{trip.budget.range.max}
            </p>
          </div>

          {/* Dates */}
          <div
            className="backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <span
              className="font-bold text-white text-sm"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              {formatRange(trip.checkIn, trip.checkOut)}
            </span>
            <span className="text-white/60 mx-1.5">·</span>
            <span className="text-white/70 text-sm">
              {trip.nights} {trip.nights === 1 ? "night" : "nights"}
            </span>
          </div>

          {/* Weather */}
          <div
            className="backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-white text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
          >
            <span className="font-semibold">{trip.weather.temperature}°C</span>
            <span className="text-white/60 mx-1.5">·</span>
            <span>{trip.weather.sunHours}h sun</span>
            <span className="text-white/60 mx-1.5">·</span>
            <span>{precipLabel[trip.weather.precipitation]}</span>
            {trip.weather.seaTemperature > 0 && (
              <>
                <span className="text-white/60 mx-1.5">·</span>
                <span>{trip.weather.seaTemperature}°C sea</span>
              </>
            )}
            <span className="text-white/55 ml-1.5">in {trip.weather.month}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
