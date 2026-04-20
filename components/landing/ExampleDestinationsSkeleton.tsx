import { getGradient } from "@/lib/utils/gradient";

const EXAMPLES = [
  { id: "porto", name: "Porto", country: "Portugal" },
  { id: "krakow", name: "Kraków", country: "Poland" },
  { id: "valencia", name: "Valencia", country: "Spain" },
];

export function ExampleDestinationsSkeleton() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            Where €500 takes you in August
          </h2>
          <p className="text-muted mt-3 text-lg">
            Click any destination to see the full plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXAMPLES.map(({ id, name, country }) => (
            <div key={id} className="rounded-2xl overflow-hidden border border-border shadow-sm">
              <div
                className="aspect-[4/3] animate-pulse opacity-60"
                style={{ background: getGradient(id) }}
              />
              <div className="bg-card px-4 py-3">
                <div className="h-3 w-16 bg-gray-200 rounded-full animate-pulse mb-1.5" />
                <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse" />
                <p className="sr-only">{name}, {country}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-8 animate-pulse">
          Loading destinations…
        </p>
      </div>
    </section>
  );
}
