import { HeroSection } from "@/components/landing/HeroSection";
import { TripForm } from "@/components/landing/TripForm";

export default function HomePage() {
  return (
    <main className="flex-1">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <HeroSection />
        <TripForm />
        <p className="text-center text-xs text-muted mt-8">
          6 curated destinations · Real prices · Matched to your budget
        </p>
      </div>
    </main>
  );
}
