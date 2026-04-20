interface Props {
  tips: string[];
}

export function TipsList({ tips }: Props) {
  return (
    <section>
      <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Practical Tips</h2>
      <div className="bg-accent-light rounded-2xl p-6">
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-accent font-bold shrink-0 mt-px">→</span>
              <span className="text-[#374151] leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
