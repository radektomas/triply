import Link from "next/link";
import { formatRange, computeNights } from "@/lib/dates";
import type { APIDestination, TripInput } from "@/lib/types";

interface HistoryRow {
  id: string;
  created_at: string;
  trip: {
    tripId?: string;
    input: TripInput;
    destinations: APIDestination[];
    searchSummary?: string | null;
  };
}

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.floor((now - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function GenerationHistory({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">Recent trip ideas</h2>
        <p className="text-sm text-muted mb-5">Every plan you generate lands here.</p>
        <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
          <p className="text-sm text-muted">No trips yet — head to the planner and try one.</p>
          <Link
            href="/#planner"
            className="inline-block mt-4 px-5 py-2.5 rounded-full bg-orange-700 hover:bg-orange-800 text-white text-sm font-semibold transition"
          >
            Start planning →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Recent trip ideas</h2>
        <span className="text-xs text-muted">{rows.length} total</span>
      </div>
      <ul className="space-y-4">
        {rows.map((row) => {
          const { input, destinations, tripId } = row.trip;
          const hasDates = input?.checkIn && input?.checkOut;
          const nights = hasDates
            ? computeNights(input.checkIn, input.checkOut)
            : null;
          const dateRange = hasDates
            ? formatRange(input.checkIn, input.checkOut)
            : "—";
          return (
            <li
              key={row.id}
              className="rounded-2xl bg-white border border-border shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-accent text-white text-xs font-bold rounded-md px-2 py-0.5">
                    €{input?.budget ?? "—"}
                  </span>
                  <span className="text-sm text-[#1A1A1A] font-semibold">
                    {dateRange}
                  </span>
                  {nights !== null && (
                    <span className="text-xs text-muted">
                      · {nights} {nights === 1 ? "night" : "nights"}
                    </span>
                  )}
                  {input?.originCity && (
                    <span className="text-xs text-muted">
                      · from {input.originCity}
                    </span>
                  )}
                  {input?.vibe && (
                    <span className="text-[10px] uppercase tracking-widest font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      {input.vibe}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">{relativeDate(row.created_at)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {destinations.slice(0, 3).map((d) => {
                  const dHref = tripId ? `/trip/${tripId}?d=${d.id}` : null;
                  const card = (
                    <div className="rounded-xl bg-[#F8F7F5] border border-border px-3 py-3 h-full hover:bg-white hover:border-accent/30 transition">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                        {d.country}
                      </p>
                      <p className="text-sm font-bold text-[#1A1A1A] mt-0.5">
                        {d.name}
                      </p>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{d.tagline}</p>
                    </div>
                  );
                  return dHref ? (
                    <Link key={d.id} href={dHref} prefetch className="block">
                      {card}
                    </Link>
                  ) : (
                    <div key={d.id}>{card}</div>
                  );
                })}
              </div>

              {tripId && (
                <div className="mt-3 text-right">
                  <Link
                    href={`/trip/${tripId}`}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Re-open trip →
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
