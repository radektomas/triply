interface Stat {
  label: string;
  value: number | string;
}

export function StatsBar({
  tripsGenerated,
  destinationsSaved,
  countriesExplored,
}: {
  tripsGenerated: number;
  destinationsSaved: number;
  countriesExplored: number;
}) {
  const stats: Stat[] = [
    { label: "trips generated", value: tripsGenerated },
    { label: "destinations saved", value: destinationsSaved },
    { label: "countries explored", value: countriesExplored },
  ];
  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm px-4 sm:px-6 py-5 mb-10">
      <div className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-3 text-center">
        Your travel snapshot
      </div>
      <div className="flex items-center justify-center gap-6 sm:gap-10">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-[#0D3B2E] tabular-nums">
                {s.value}
              </div>
              <div className="text-[11px] font-medium tracking-[0.15em] uppercase text-[#0D7377]/70 mt-1">
                {s.label}
              </div>
            </div>
            {i < stats.length - 1 && <div className="w-px h-8 bg-[#0D7377]/20" />}
          </div>
        ))}
      </div>
    </div>
  );
}
