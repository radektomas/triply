import Image from "next/image";
import { GradientMesh } from "./GradientMesh";
import { TicketButton } from "@/components/ui/TicketButton";
import { PalmLeafCorner } from "./PalmLeafCorner";
import { TriplyHeroPresence } from "@/components/triply/TriplyHeroPresence";
import { HowItWorksTrigger } from "./HowItWorksTrigger";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center py-24 md:min-h-screen overflow-hidden">
      <GradientMesh />

      {/* Decorative leaf in the top-left corner — independent of the logo */}
      <PalmLeafCorner />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-12 md:pt-16">
        {/* Logo — statically placed, slight -2.5° toss to feel hand-laid.
            Two layered drop-shadows trace the tag's actual silhouette
            (drop-shadow follows alpha, unlike box-shadow), giving a
            grounded lift on the cream/peach background. */}
        <div className="mb-12 md:mb-14 flex justify-center animate-logo-fade-in">
          <Image
            src="/triply-logo-tropical.webp"
            alt="Triply"
            width={936}
            height={279}
            priority
            className="w-[260px] md:w-[340px] h-auto select-none"
            style={{
              transform: "rotate(-2.5deg)",
              filter:
                "drop-shadow(0 8px 14px rgba(56, 27, 8, 0.22)) drop-shadow(0 2px 4px rgba(56, 27, 8, 0.16))",
            }}
          />
        </div>

        {/* Headline — the period sits INSIDE the highlight span so it can
            never wrap alone to the next line. */}
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] mb-6 text-[#1A1A1A] text-balance">
          Tell us your{" "}
          <span
            className="inline-block bg-accent text-white -rotate-1 rounded-lg align-baseline"
            style={{ padding: "0.1em 0.4em" }}
          >
            budget.
          </span>{" "}
          We&apos;ll find the trip.
        </h1>

        {/* Subheadline */}
        <p className="font-mono text-sm font-medium uppercase text-accent tracking-[0.15em] mb-2">
          Flights · Hotels · Vibes
        </p>
        <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-10 text-balance">
          Real trips, real prices, in seconds. Free.
        </p>

        {/* CTA — boarding pass centered. On md+ Triply floats absolutely to
            the right so the CTA stays at true page center; on mobile Triply
            stacks underneath via the block below. */}
        <div className="relative flex justify-center">
          <TicketButton href="#planner" size="lg" serial="BOARDING · 001">
            Start planning →
          </TicketButton>
          <div
            className="absolute left-1/2 top-0 h-full pointer-events-none hidden md:block"
            style={{ transform: "translateX(calc(50% + 2.5rem))" }}
          >
            <div className="h-full flex items-center">
              <TriplyHeroPresence />
            </div>
          </div>
        </div>

        {/* Secondary CTA — opens the "How it works" modal. Stacked below the
            boarding pass to keep TriplyHeroPresence's calibrated centering
            intact, and to stay subtle vs. the primary CTA. */}
        <div className="mt-4 flex justify-center">
          <HowItWorksTrigger />
        </div>

        {/* Social proof */}
        <div className="mt-8 flex flex-col items-center">
          <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-4 text-center">
            EARLY TRAVELERS LOVE IT
          </div>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E]">150+</div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">travelers</div>
            </div>
            <div className="w-px h-8 bg-[#0D7377]/20" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E]">15+</div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">countries</div>
            </div>
            <div className="w-px h-8 bg-[#0D7377]/20" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E]">100+</div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">trips generated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
