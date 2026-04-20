function SkeletonBar() {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="h-3 w-16 bg-[#E5E7EB] rounded-full animate-pulse" />
      <div className="h-2 flex-1 bg-[#E5E7EB] rounded-full animate-pulse" />
      <div className="h-3 w-10 bg-[#E5E7EB] rounded-full animate-pulse" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="h-44 bg-[#E5E7EB] animate-pulse" />
      <div className="p-5">
        <div className="h-3 w-1/3 bg-[#E5E7EB] rounded-full animate-pulse mb-1.5" />
        <div className="h-5 w-3/5 bg-[#E5E7EB] rounded-full animate-pulse mb-3" />
        <div className="flex gap-1.5 mb-4">
          <div className="h-6 w-14 bg-[#E5E7EB] rounded-full animate-pulse" />
          <div className="h-6 w-16 bg-[#E5E7EB] rounded-full animate-pulse" />
          <div className="h-6 w-12 bg-[#E5E7EB] rounded-full animate-pulse" />
        </div>
        <div className="h-3 w-3/4 bg-[#E5E7EB] rounded-full animate-pulse mb-5" />
        <div className="h-3 w-28 bg-[#E5E7EB] rounded-full animate-pulse mb-3" />
        <SkeletonBar />
        <SkeletonBar />
        <SkeletonBar />
        <SkeletonBar />
        <SkeletonBar />
        <div className="flex justify-between items-center pt-3 mt-1 border-t border-border">
          <div className="h-7 w-14 bg-[#E5E7EB] rounded-full animate-pulse" />
          <div className="h-9 w-28 bg-[#E5E7EB] rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ResultsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="h-8 w-60 bg-[#E5E7EB] rounded-full animate-pulse mb-2" />
      <div className="h-4 w-44 bg-[#E5E7EB] rounded-full animate-pulse mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <p className="text-center text-xs text-muted mt-6">
        First search takes up to 10 seconds while AI plans your trip.
      </p>
    </div>
  );
}
