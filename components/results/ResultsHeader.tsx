interface Props {
  budget: number;
  dateRange: string;
  nights: number;
}

export function ResultsHeader({ budget, dateRange, nights }: Props) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-1">
        3 trips for <span className="text-accent">€{budget}</span>
      </h1>
      <p className="text-muted">
        {dateRange} · {nights} {nights === 1 ? "night" : "nights"} · per person, all-in
      </p>
    </div>
  );
}
