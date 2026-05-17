import { Hero } from "@/components/landing/Hero";
import { PlannerSection } from "@/components/landing/PlannerSection";
import { QuickPicks } from "@/components/landing/QuickPicks";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PlannerSection />
      <QuickPicks />
    </>
  );
}
