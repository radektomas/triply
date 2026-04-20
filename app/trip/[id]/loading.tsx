function SkeletonBar() {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-3 w-16 bg-[#E5E7EB] rounded-full animate-pulse" />
      <div className="h-2 flex-1 bg-[#E5E7EB] rounded-full animate-pulse" />
      <div className="h-3 w-10 bg-[#E5E7EB] rounded-full animate-pulse" />
    </div>
  );
}

function SkeletonDay() {
  return (
    <div className="flex gap-4 pb-6">
      <div className="w-8 h-8 rounded-full bg-[#E5E7EB] animate-pulse shrink-0" />
      <div className="flex-1 pt-0.5">
        <div className="h-4 w-1/2 bg-[#E5E7EB] rounded-full animate-pulse mb-2" />
        <div className="h-3 w-full bg-[#E5E7EB] rounded-full animate-pulse mb-1.5" />
        <div className="h-3 w-4/5 bg-[#E5E7EB] rounded-full animate-pulse mb-1.5" />
        <div className="h-3 w-2/3 bg-[#E5E7EB] rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default function TripLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="h-72 bg-[#E5E7EB] animate-pulse" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Budget breakdown */}
        <div>
          <div className="h-5 w-44 bg-[#E5E7EB] rounded-full animate-pulse mb-4" />
          <div className="bg-card rounded-2xl border border-border p-6">
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <div className="flex justify-between pt-4 border-t border-border">
              <div className="h-4 w-12 bg-[#E5E7EB] rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-[#E5E7EB] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Itinerary */}
        <div>
          <div className="h-5 w-36 bg-[#E5E7EB] rounded-full animate-pulse mb-6" />
          <SkeletonDay />
          <SkeletonDay />
          <SkeletonDay />
          <SkeletonDay />
        </div>

        {/* Tips */}
        <div>
          <div className="h-5 w-32 bg-[#E5E7EB] rounded-full animate-pulse mb-4" />
          <div className="bg-[#E5E7EB] rounded-2xl h-40 animate-pulse" />
        </div>

        {/* Trusted sources */}
        <div>
          <div className="h-5 w-32 bg-[#E5E7EB] rounded-full animate-pulse mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((section) => (
              <div key={section}>
                <div className="h-3 w-20 bg-[#E5E7EB] rounded-full animate-pulse mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="h-14 bg-[#E5E7EB] rounded-xl animate-pulse" />
                  <div className="h-14 bg-[#E5E7EB] rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
