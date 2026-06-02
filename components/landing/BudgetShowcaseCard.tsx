"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { VibeTag } from "@/components/ui/VibeTag";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { HeartIcon, ArrowRightIcon } from "@/components/landing/VibeIcons";
import { dispatchPrefill } from "@/lib/prefill";
import type { ShowcaseExample } from "@/lib/budgetShowcase";

// Brand-aligned palette for the photo-header fallback. Deterministic per
// city so the same destination always reads the same tile before a curated
// photo lands. Mirrors the fallback approach in VibeSearch's thumbnail.
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #FF6B47 0%, #FF8A6B 100%)",
  "linear-gradient(135deg, #0D7377 0%, #14A0A5 100%)",
  "linear-gradient(135deg, #F4A261 0%, #FFB088 100%)",
  "linear-gradient(135deg, #8E7CC3 0%, #B19FE0 100%)",
  "linear-gradient(135deg, #2A9D8F 0%, #57C0B2 100%)",
] as const;

function pickFallbackGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length];
}

interface Props {
  example: ShowcaseExample;
  /** EUR — the active tier's budget. Pre-filled into the planner on click. */
  budget: number;
}

export function BudgetShowcaseCard({ example, budget }: Props) {
  const router = useRouter();
  const [imgErrored, setImgErrored] = useState(false);
  const seed = `${example.city}-${example.country}`;
  const gradient = useMemo(() => pickFallbackGradient(seed), [seed]);

  // Reset image error when the underlying url changes (tier swap reuses
  // card slots — different example, fresh attempt).
  useEffect(() => {
    setImgErrored(false);
  }, [example.photo?.url]);

  function handleClick() {
    // Preferred path: a pre-generated trip exists for this destination+budget.
    // Falls back to prefilling the planner so the user completes the missing
    // fields (dates, travelers, origin) and triggers a real generation.
    if (example.slug) {
      router.push(`/trips/${example.slug}`);
      return;
    }
    dispatchPrefill({
      budget,
      city: {
        kind: "city",
        cityName: example.city,
        countryName: example.country,
        countryCode: example.countryCode,
        lat: example.lat,
        lng: example.lng,
      },
    });
  }

  const showImage = !!example.photo && !imgErrored;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`See full plan for ${example.city}, ${example.country}`}
      className="group relative bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col text-left w-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-orange-200"
    >
      {/* Photo header — fixed height, identical to the live results card.
          The gradient sits behind the <Image> so onError / missing photo
          gracefully reveals it with no layout shift, no broken-image icon. */}
      <div
        className="h-44 relative shrink-0 overflow-hidden"
        style={{ background: gradient }}
      >
        {showImage && (
          <Image
            src={example.photo!.url}
            alt={example.photo!.alt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            loading="lazy"
            onError={() => setImgErrored(true)}
            className="object-cover"
          />
        )}
        {/* Legibility scrim: dark at the bottom (where country/city sit) →
            transparent at the top. Sits below the heart + Fits-budget chips
            via DOM order. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
          }}
        />
        {/* Top-right: FITS BUDGET badge — frosted white pill, warm text */}
        <span className="absolute top-3 right-3 bg-white/85 backdrop-blur-sm ring-1 ring-black/5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full text-emerald-700">
          Fits budget
        </span>
        {/* Top-left: heart icon — visual parity with the live save affordance */}
        <span
          className="absolute top-3 left-3 text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          aria-hidden="true"
        >
          <HeartIcon color="currentColor" size={20} />
        </span>
        {/* Country + city pinned to bottom — same treatment as the live card */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {example.country}
          </p>
          <h3 className="text-white text-2xl font-bold leading-tight">
            {example.city}
          </h3>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Vibe tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {example.vibes.map((v) => (
            <VibeTag key={v} label={v} />
          ))}
        </div>

        {/* Weather line — single row, mirrors the live card chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mb-4 pb-4 border-b border-border">
          <span className="inline-flex items-center gap-1">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
            {example.weather.tempC}°C
          </span>
          <span className="inline-flex items-center gap-1">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
            {example.weather.sunHours}h sun
          </span>
          <span>{example.weather.conditions}</span>
        </div>

        {/* Per-person total */}
        <div className="mt-auto">
          <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Per-person total
          </p>
          <p className="text-3xl font-bold text-slate-900 leading-none">
            <FormattedPrice eur={example.perPersonEur} />
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:gap-1.5 transition-all">
            See full plan
            <ArrowRightIcon color="currentColor" size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}
