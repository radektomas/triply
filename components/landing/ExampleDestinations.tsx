import Link from "next/link";
import { getCityPhoto } from "@/lib/photos";
import { getGradient } from "@/lib/utils/gradient";

const EXAMPLES = [
  { id: "porto", name: "Porto", country: "Portugal", price: 360 },
  { id: "krakow", name: "Kraków", country: "Poland", price: 340 },
  { id: "valencia", name: "Valencia", country: "Spain", price: 375 },
];

const RESULTS_HREF =
  "/results?budget=500&month=august&nights=6&vibe=city&originCity=Prague";

export async function ExampleDestinations() {
  const photoUrls = await Promise.all(
    EXAMPLES.map(({ name, country }) => getCityPhoto(name, country))
  );

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
          {EXAMPLES.map(({ id, name, country, price }, i) => {
            const photoUrl = photoUrls[i];
            const gradient = getGradient(id);

            return (
              <Link
                key={id}
                href={RESULTS_HREF}
                className="group block rounded-2xl overflow-hidden shadow-sm border border-border hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
              >
                <div
                  className="h-48 relative flex items-end p-4"
                  style={{
                    background: photoUrl
                      ? `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%), url('${photoUrl}') center/cover, ${gradient}`
                      : gradient,
                  }}
                >
                  <span className="absolute top-3 right-3 bg-white/90 text-[#1A1A1A] text-sm font-bold px-3 py-1 rounded-full">
                    €{price}
                  </span>
                  <div>
                    <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-0.5">
                      {country}
                    </p>
                    <h3 className="text-white text-2xl font-bold leading-tight group-hover:text-white transition-colors">
                      {name}
                    </h3>
                  </div>
                </div>
                <div className="bg-card px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted">6 nights · August · City</span>
                  <span className="text-sm font-semibold text-accent">See plan →</span>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted mt-8 opacity-70">
          Examples based on flights from Prague. Your results will vary by origin city.
        </p>
      </div>
    </section>
  );
}
