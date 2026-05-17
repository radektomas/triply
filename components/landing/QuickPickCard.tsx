import Link from "next/link";
import Image from "next/image";
import { getVibeGradient } from "@/lib/vibeGradient";
import { getVibeIcon } from "@/components/landing/VibeIcons";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import type { QuickPick } from "@/types/quickPick";

interface Props {
  pick: QuickPick;
}

export function QuickPickCard({ pick }: Props) {
  const VibeIcon = getVibeIcon(pick.vibe);
  const gradient = getVibeGradient(pick.vibe);

  return (
    <Link
      href={`/trips/${pick.slug}`}
      prefetch
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.02]"
      style={{ background: gradient }}
      aria-label={`${pick.title} — ${pick.destination}`}
    >
      {/* Hero image */}
      <Image
        src={pick.hero_image_url}
        alt=""
        fill
        sizes="(max-width: 768px) 85vw, (max-width: 1280px) 25vw, 320px"
        className="object-cover transition-[filter] duration-300 group-hover:brightness-110"
        priority={pick.display_order <= 4}
      />

      {/* Vibe-tinted gradient overlay — fades bottom to top so text reads */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 45%, transparent 70%)",
        }}
      />

      {/* Bottom-aligned content stack */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col gap-2">
        {/* Vibe icon — chip in top of content stack */}
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
          <VibeIcon color="#FFFFFF" size={22} />
        </div>

        {/* Title + destination */}
        <div>
          <h3
            className="text-white font-semibold leading-tight text-xl sm:text-2xl"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
          >
            {pick.title}
          </h3>
          <p
            className="text-white/85 text-sm mt-0.5"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {pick.destination}
          </p>
        </div>

        {/* Chips row */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Chip>
            {pick.duration_days} {pick.duration_days === 1 ? "day" : "days"}
          </Chip>
          <Chip>{pick.travelers}</Chip>
          <Chip>
            from <FormattedPrice eur={pick.budget_from_eur} />
          </Chip>
        </div>
      </div>
    </Link>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-medium border border-white/15 whitespace-nowrap">
      {children}
    </span>
  );
}
