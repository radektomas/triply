// Loading skeletons for /trip/[id] — one per branch of the page, rendered as
// Suspense fallbacks chosen by the presence of ?d= (which is known instantly,
// before any data fetch). This replaced the route-level loading.tsx, which
// could only render ONE shape and always showed the detail-page skeleton —
// wrong-layout flash on the common landing (the 3-card selector).
//
// Placeholder tones are warm brand neutrals (cream-tinted sand), not Tailwind
// grey — the grey blocks read cold and template-y on the warm palette.
// animate-pulse animates opacity only (compositor-cheap, AGENTS.md-clean).

const TONE = "bg-[#F3E4D2]";
const TONE_SOFT = "bg-[#F8EEE1]";

// Mirrors DestinationCard's real dimensions (rounded-2xl border, photo band
// h-64/72/80, p-5 body) so the real card paints over it without layout shift.
function SelectorCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className={`h-64 sm:h-72 lg:h-80 ${TONE} animate-pulse`} />
      <div className="p-5">
        <div className={`h-3 w-5/6 rounded-full ${TONE} animate-pulse mb-2`} />
        <div className={`h-3 w-3/5 rounded-full ${TONE_SOFT} animate-pulse mb-4`} />
        <div className="flex gap-1.5 mb-4">
          <div className={`h-6 w-16 rounded-full ${TONE_SOFT} animate-pulse`} />
          <div className={`h-6 w-20 rounded-full ${TONE_SOFT} animate-pulse`} />
          <div className={`h-6 w-14 rounded-full ${TONE_SOFT} animate-pulse`} />
        </div>
        <div className="space-y-2 pb-4">
          <div className={`h-3 w-2/5 rounded-full ${TONE_SOFT} animate-pulse`} />
          <div className={`h-3 w-1/3 rounded-full ${TONE_SOFT} animate-pulse`} />
          <div className={`h-3 w-2/5 rounded-full ${TONE_SOFT} animate-pulse`} />
        </div>
        <div className="pt-4 border-t border-border">
          <div className={`h-3 w-24 rounded-full ${TONE_SOFT} animate-pulse mb-2`} />
          <div className={`h-9 w-28 rounded-lg ${TONE} animate-pulse`} />
          <div className={`h-12 w-full rounded-full ${TONE} animate-pulse mt-4`} />
        </div>
      </div>
    </div>
  );
}

// Shape of DestinationSelector: header block + the same responsive grid.
export function SelectorSkeleton() {
  return (
    <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className={`h-9 sm:h-10 w-72 max-w-full rounded-xl ${TONE} animate-pulse mb-3`} />
          <div className={`h-4 w-64 max-w-full rounded-full ${TONE_SOFT} animate-pulse`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <SelectorCardSkeleton />
          <SelectorCardSkeleton />
          <SelectorCardSkeleton />
        </div>
      </div>
    </main>
  );
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`h-3 w-16 ${TONE} rounded-full animate-pulse`} />
      <div className={`h-2 flex-1 ${TONE_SOFT} rounded-full animate-pulse`} />
      <div className={`h-3 w-10 ${TONE} rounded-full animate-pulse`} />
    </div>
  );
}

function SkeletonDay() {
  return (
    <div className="flex gap-4 pb-6">
      <div className={`w-8 h-8 rounded-full ${TONE} animate-pulse shrink-0`} />
      <div className="flex-1 pt-0.5">
        <div className={`h-4 w-1/2 ${TONE} rounded-full animate-pulse mb-2`} />
        <div className={`h-3 w-full ${TONE_SOFT} rounded-full animate-pulse mb-1.5`} />
        <div className={`h-3 w-4/5 ${TONE_SOFT} rounded-full animate-pulse mb-1.5`} />
        <div className={`h-3 w-2/3 ${TONE_SOFT} rounded-full animate-pulse`} />
      </div>
    </div>
  );
}

// Shape of TripDetailView: hero band, budget breakdown card, itinerary, tips,
// sources — the structure the old loading.tsx had, in warm tones.
export function DetailSkeleton() {
  return (
    <div>
      <div className={`h-72 ${TONE} animate-pulse`} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <div>
          <div className={`h-5 w-44 ${TONE} rounded-full animate-pulse mb-4`} />
          <div className="bg-card rounded-2xl border border-border p-6">
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <div className="flex justify-between pt-4 border-t border-border">
              <div className={`h-4 w-12 ${TONE} rounded-full animate-pulse`} />
              <div className={`h-6 w-16 ${TONE} rounded-full animate-pulse`} />
            </div>
          </div>
        </div>

        <div>
          <div className={`h-5 w-36 ${TONE} rounded-full animate-pulse mb-6`} />
          <SkeletonDay />
          <SkeletonDay />
          <SkeletonDay />
          <SkeletonDay />
        </div>

        <div>
          <div className={`h-5 w-32 ${TONE} rounded-full animate-pulse mb-4`} />
          <div className={`${TONE_SOFT} rounded-2xl h-40 animate-pulse`} />
        </div>

        <div>
          <div className={`h-5 w-32 ${TONE} rounded-full animate-pulse mb-4`} />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((section) => (
              <div key={section}>
                <div className={`h-3 w-20 ${TONE} rounded-full animate-pulse mb-2`} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className={`h-14 ${TONE_SOFT} rounded-xl animate-pulse`} />
                  <div className={`h-14 ${TONE_SOFT} rounded-xl animate-pulse`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
