import { listQuickPicks } from "@/lib/data/getQuickPick";
import { QuickPickCard } from "./QuickPickCard";

export async function QuickPicks() {
  const picks = await listQuickPicks();
  if (picks.length === 0) return null;

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-10 md:mb-12 text-center md:text-left">
          {/* Premium editorial eyebrow: thin rule above, serif uppercase below */}
          <div className="h-0.5 w-8 bg-accent mb-3 mx-auto md:mx-0" />
          <p className="font-serif uppercase tracking-[0.2em] font-medium text-accent text-xs mb-3">
            Quick picks
          </p>
          <h2
            className="font-semibold text-[#1A1A1A] leading-tight mb-2"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            Not sure where to go? Start here.
          </h2>
          <p className="text-[15px] sm:text-base" style={{ color: "rgba(13,115,119,0.7)" }}>
            8 hand-picked trips. Ready in one tap.
          </p>
        </div>

        {/* Mobile: horizontal snap-scroll. Desktop (md+): 4-col × 2-row grid. */}
        <div
          className="
            -mx-4 sm:-mx-6 px-4 sm:px-6
            flex md:grid md:grid-cols-4 md:gap-6 md:mx-0 md:px-0
            gap-4 overflow-x-auto snap-x snap-mandatory
            md:overflow-visible md:snap-none
            pb-4 md:pb-0
            scroll-pl-4 sm:scroll-pl-6
          "
        >
          {picks.map((pick) => (
            <div
              key={pick.id}
              className="snap-start shrink-0 w-[85%] sm:w-[60%] md:w-auto"
            >
              <QuickPickCard pick={pick} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
