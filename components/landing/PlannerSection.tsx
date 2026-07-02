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
          step / Back re-anchoring. It wraps the "Let's find your escape."
          heading TOGETHER with the form card, so scrolling frames both — the
          heading unhides exactly at commit (data-fork flips), and anchoring
          the card alone would push the newly-visible heading off the top.
          scroll-mt matches the card's own offsets (24px mobile / 80px desktop,
          clearing the 56px fixed header). On the fork the heading is hidden
          (display:none, zero height), so this wrapper's top equals the card's
          top and fork framing is unchanged. */}
      <div
        data-planner-frame
        className="group max-w-3xl mx-auto px-6 scroll-mt-6 md:scroll-mt-20"
      >
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
