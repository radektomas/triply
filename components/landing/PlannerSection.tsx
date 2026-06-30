import { TripForm } from "@/components/landing/TripForm";

export function PlannerSection() {
  return (
    <section
      id="planner"
      className="py-24 md:py-32"
      style={{ backgroundColor: "#FFE4CC" }}
    >
      <div className="group max-w-3xl mx-auto px-6">
        {/* Hidden while the frameless destination fork is active (TripForm
            sets data-fork="true"), so its own "Where are we headed?" heading
            is the only one on the bare peach. Returns once a mode is chosen
            and the white form card begins. */}
        <div className="text-center mb-10 group-has-[[data-fork=true]]:hidden">
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
