import { Hero } from "@/components/landing/Hero";
import { PlannerSection } from "@/components/landing/PlannerSection";
import { CreateProfileShowcase } from "@/components/landing/CreateProfileShowcase";
import { LandingView } from "@/components/analytics/LandingView";

export default function HomePage() {
  return (
    <>
      <LandingView />
      <Hero />
      <PlannerSection />
      <CreateProfileShowcase />
    </>
  );
}
