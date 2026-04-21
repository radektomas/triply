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
          Give me a budget. I&apos;ll find 3 trips that actually fit. Flights, hotels, vibes.
        </p>

        {/* CTA */}
        <TicketButton href="#planner" size="lg" serial="BOARDING · 001">
          Start planning →
        </TicketButton>

        {/* Trust badges */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-widest text-muted font-medium">Book with the names you know</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {TRUST_BADGES.map((badge) => (
              <span key={badge} className="text-sm text-slate-700 font-medium">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
