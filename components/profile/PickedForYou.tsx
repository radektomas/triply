import { PickCard, type Pick } from "./PickCard";
import { GeneratePicks } from "./GeneratePicks";
import type { TripInput } from "@/lib/types";

interface Props {
  picks: Pick[];
  /** Highlight picks from this generation (the dashboard landed from it). */
  highlight: boolean;
  input: TripInput;
  remaining: number;
  firstName: string;
}

export function PickedForYou({ picks, highlight, input, remaining, firstName }: Props) {
  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
            Picked for you
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {picks.length ? `Places that fit you, ${firstName}.` : `Let's find your first places, ${firstName}.`}
          </h2>
          <p className="text-sm text-muted mt-1 max-w-xl">
            Picked from your vibes, budget, home airport and free windows. Tap the bell on any
            of them and we&apos;ll email you when a good price shows up.
          </p>
        </div>
        {picks.length > 0 && <GeneratePicks input={input} remaining={remaining} />}
      </div>

      {picks.length === 0 ? (
        <div className="rounded-3xl bg-white border border-border shadow-sm px-6 py-10 text-center">
          <p className="font-display text-xl font-bold text-[#1A1A1A]">No picks yet.</p>
          <p className="text-sm text-muted mt-1 mb-5 max-w-md mx-auto">
            One tap and the planner comes back with three places that fit your profile.
          </p>
          <GeneratePicks input={input} remaining={remaining} label="Find my first picks" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {picks.map((p, i) => (
            <PickCard key={`${p.tripId ?? "x"}-${p.destination.id}`} pick={p} index={i} highlight={highlight} />
          ))}
        </div>
      )}
    </section>
  );
}
