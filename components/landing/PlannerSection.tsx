import { TripForm } from "@/components/landing/TripForm";

export function PlannerSection() {
  return (
    <section
      id="planner"
      // Desktop only: trim the top padding (was md:py-32 → 128px) so the fork
      // sits closer to the hero and the #planner anchor lands its heading near
      // the top of the viewport (80px, clear of the 56px fixed header) instead
      // of pushed down behind a big empty band. Bottom padding (md:pb-32) and
      // the mobile py-24 are unchanged.
      className="py-24 md:pt-20 md:pb-32"
      style={{ backgroundColor: "#FFE4CC" }}
    >
      {/* data-planner-frame: the nav-scroll target for TripForm's commit /
          step / Back re-anchoring. scroll-mt matches the form's own offsets
          (24px mobile / 80px desktop, clearing the 56px fixed header). The
          old "Let's find your escape." section heading is gone: with the
          frameless form every screen carries ONE display-scale heading of
          its own (the fork's "Where are we headed?", then each wizard step's
          question) — a second hero heading stacked above them read as two
          competing titles. */}
      <div
        data-planner-frame
        className="max-w-3xl mx-auto px-6 scroll-mt-6 md:scroll-mt-20"
      >
        <TripForm />
      </div>
    </section>
  );
}
