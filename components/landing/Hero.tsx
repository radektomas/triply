import { GradientMesh } from "./GradientMesh";
import { Wordmark } from "@/components/ui/Wordmark";
import { TicketButton } from "@/components/ui/TicketButton";

const TRUST_BADGES = [
  "✈️ Skyscanner",
  "🏨 Booking.com",
  "🎟️ GetYourGuide",
  "⭐ TripAdvisor",
];

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center py-24 md:min-h-screen overflow-hidden">
      <GradientMesh />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Wordmark */}
        <div className="mt-8 mb-14 w-fit mx-auto">
          <Wordmark size="md" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-[#1A1A1A]">
          <span className="text-accent">€300?</span>{" "}
          I&apos;ll find you a trip.
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-10">
          Tell me your budget and when you want to travel. I&apos;ll find 3 destinations
          that match — with real flight prices, hotel estimates, and day-by-day plans.
        </p>

        {/* CTA */}
        <TicketButton href="#planner" size="lg" serial="BOARDING · 001">
          Start planning →
        </TicketButton>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-8 opacity-70 hover:opacity-100 transition-opacity duration-300">
          <p className="w-full text-xs text-muted mb-1">Powered by</p>
          {TRUST_BADGES.map((badge) => (
            <span key={badge} className="text-sm text-muted font-medium">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
