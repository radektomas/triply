import { GradientMesh } from "./GradientMesh";
import { Wordmark } from "@/components/ui/Wordmark";
import { TicketButton } from "@/components/ui/TicketButton";
import { PalmLeafCorner } from "./PalmLeafCorner";
import { TriplyHeroPresence } from "@/components/triply/TriplyHeroPresence";
import {
  PlaneIcon,
  HotelIcon,
  TicketIcon,
  StarIcon,
} from "@/components/TrustBadgeIcons";

const TRUST_BADGES = [
  { name: "Skyscanner", Icon: PlaneIcon },
  { name: "Booking.com", Icon: HotelIcon },
  { name: "GetYourGuide", Icon: TicketIcon },
  { name: "TripAdvisor", Icon: StarIcon },
];

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

        {/* Trust badges */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-muted font-medium">Book with the names you know</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {TRUST_BADGES.map(({ name, Icon }) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 text-sm text-slate-700 font-medium"
              >
                <Icon size={20} className="text-teal shrink-0" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
