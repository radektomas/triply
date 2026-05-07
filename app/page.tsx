import { Suspense } from "react";
import { Hero } from "@/components/landing/Hero";
import { PlannerSection } from "@/components/landing/PlannerSection";
import { ExampleDestinations } from "@/components/landing/ExampleDestinations";
import { ExampleDestinationsSkeleton } from "@/components/landing/ExampleDestinationsSkeleton";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PlannerSection />
      <Suspense fallback={<ExampleDestinationsSkeleton />}>
        <ExampleDestinations />
      </Suspense>
    </>
  );
}
