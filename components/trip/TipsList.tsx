const TIP_ICON_RULES: ReadonlyArray<{ pattern: RegExp; icon: string }> = [
  { pattern: /\b(boat|ferry|island|cruise)\b/, icon: "🛥️" },
  { pattern: /\b(beach|swim|sea|coast)\b/, icon: "🏖️" },
  { pattern: /\b(eat|dine|food|restaurant|meal)\b/, icon: "🍽️" },
  { pattern: /\b(temple|museum|visit|see|view)\b/, icon: "🏛️" },
  { pattern: /\b(hike|walk|trek|climb)\b/, icon: "🥾" },
  { pattern: /\b(bus|train|taxi|transport|metro)\b/, icon: "🚌" },
];

function getTipIcon(tip: string): string {
  const t = tip.toLowerCase();
  for (const { pattern, icon } of TIP_ICON_RULES) {
    if (pattern.test(t)) return icon;
  }
  // Fallback for generic advice (book/early/avoid/…) — matches the lightbulb
  // already used on the TopPlaces tip rows so visual language stays consistent.
  return "💡";
}

interface Props {
  tips: string[];
}

export function TipsList({ tips }: Props) {
  if (!tips || tips.length === 0) return null;

  return (
    <section>
      {/* Eyebrow ribbon — matches the Top Places rhythm (eyebrow → coral
          underline accent → bold heading) so the section reads as a peer of
          Top Places and Budget Breakdown. */}
      <div className="mb-4">
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#0D7377] mb-1.5">
          Good to know · {tips.length} {tips.length === 1 ? "tip" : "tips"}
        </p>
        <div className="h-0.5 w-10 bg-[#FF6B47] mb-3" />
        <h2
          className="font-semibold text-[#1A1A1A] leading-tight"
          style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)" }}
        >
          Practical tips
        </h2>
      </div>

      <div className="bg-accent-light rounded-2xl p-5 sm:p-6">
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden="true"
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-base leading-none"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              >
                {getTipIcon(tip)}
              </span>
              <span className="text-[#374151] leading-relaxed pt-1">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
