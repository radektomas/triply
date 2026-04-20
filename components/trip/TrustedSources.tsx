import type { TrustedSources as TrustedSourcesType, TrustedSource } from "@/lib/types";

interface Props {
  sources: TrustedSourcesType;
}

const SECTIONS = [
  { key: "flights" as const, label: "Flights", icon: "✈️" },
  { key: "hotels" as const, label: "Hotels", icon: "🏨" },
  { key: "activities" as const, label: "Activities", icon: "🎟️" },
  { key: "reviews" as const, label: "Reviews", icon: "⭐" },
];

function trustDots(score: number): string {
  const rounded = Math.round(score * 2) / 2;
  const full = Math.floor(rounded);
  const hasHalf = rounded % 1 >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return "●".repeat(full) + (hasHalf ? "◑" : "") + "○".repeat(empty);
}

function SourceCard({ source }: { source: TrustedSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-accent hover:bg-accent-light transition-all group"
    >
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-accent transition-colors">
          {source.name}
        </p>
        <p className="text-xs text-muted font-mono tracking-tight mt-0.5">
          {trustDots(source.trustScore)}
        </p>
      </div>
      <span className="text-xs text-accent font-semibold shrink-0 ml-3">
        Check now →
      </span>
    </a>
  );
}

export function TrustedSources({ sources }: Props) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">Book Your Trip</h2>
      <div className="space-y-6">
        {SECTIONS.map(({ key, label, icon }) => {
          const list = sources[key];
          if (!list?.length) return null;
          return (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
                {icon} {label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {list.map((source) => (
                  <SourceCard key={source.name} source={source} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted mt-6 italic">
        Prices are estimates. Verify current rates on these trusted sources.
      </p>
    </section>
  );
}
