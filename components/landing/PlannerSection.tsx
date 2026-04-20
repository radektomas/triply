import { TripForm } from "@/components/landing/TripForm";

export function PlannerSection() {
  return (
    <section
      id="planner"
      className="py-24 md:py-32"
      style={{ backgroundColor: "#FFE4CC" }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
            Ready?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">
            Let&apos;s find your escape.
          </h2>
        </div>
        <TripForm />
      </div>
    </section>
  );
}
