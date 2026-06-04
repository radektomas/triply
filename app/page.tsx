import { Hero } from "@/components/landing/Hero";
import { PlannerSection } from "@/components/landing/PlannerSection";
import { CreateProfileShowcase } from "@/components/landing/CreateProfileShowcase";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PlannerSection />
      <CreateProfileShowcase />
    </>
  );
}
