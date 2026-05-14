import { GradientMesh } from "./GradientMesh";
import { Wordmark } from "@/components/ui/Wordmark";
import { TicketButton } from "@/components/ui/TicketButton";
import { PalmLeafCorner } from "./PalmLeafCorner";
import { TriplyHeroPresence } from "@/components/triply/TriplyHeroPresence";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center py-24 md:min-h-screen overflow-hidden">
      <GradientMesh />

      {/* Decorative leaf in the top-left corner — independent of the logo */}
      <PalmLeafCorner />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center pt-12 md:pt-16">
        {/* Wordmark — centered, hangs from its native pin/thread, with a slight
            -2° gravity tilt. Native swing animation is preserved. */}
        <div
          className="inline-block mb-12 md:mb-14"
          style={{
            transform: "rotate(-2deg)",
            transformOrigin: "top center",
          }}
        >
          <Wordmark size="md" />
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-[#1A1A1A]">
          Got{" "}
          <span
            className="inline-block bg-accent text-white -rotate-1 rounded-lg align-baseline"
            style={{ padding: "0.1em 0.4em" }}
          >
            €300
          </span>{" "}
          and a{" "}
          <span
            className="inline-block bg-teal-800 text-cream font-mono uppercase rotate-1 rounded-lg align-baseline"
            style={{ padding: "0.1em 0.4em", fontSize: "0.85em", letterSpacing: "0.05em" }}
          >
            Long weekend
          </span>
          ?
        </h1>

        {/* Subheadline */}
        <p className="font-mono text-sm font-medium uppercase text-accent tracking-[0.15em] mb-2">
          Flights · Hotels · Vibes
        </p>
        <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-10">
          3 trips that actually fit. All sorted.
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

        {/* Social proof */}
        <div className="mt-8 flex flex-col items-center">
          <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-4 text-center">
            EARLY TRAVELERS LOVE IT
          </div>
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E]">100+</div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">travelers</div>
            </div>
            <div className="w-px h-8 bg-[#0D7377]/20" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E]">10+</div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">countries</div>
            </div>
            <div className="w-px h-8 bg-[#0D7377]/20" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E]">50+</div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">trips generated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
