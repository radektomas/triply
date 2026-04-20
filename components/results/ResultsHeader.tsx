interface Props {
  budget: number;
  month: string;
  nights: number;
}

export function ResultsHeader({ budget, month, nights }: Props) {
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-1">
        3 trips for <span className="text-accent">€{budget}</span>
      </h1>
      <p className="text-muted">
        {nights} {nights === 1 ? "night" : "nights"} · {monthLabel} · per person, all-in
      </p>
    </div>
  );
}
