import Link from "next/link";
import { getCityPhoto } from "@/lib/photos";
import { getGradient } from "@/lib/utils/gradient";
import { TypewriterHeadline } from "./TypewriterHeadline";

const EXAMPLES = [
  {
    slug: "prague",
    name: "Prague",
    country: "Czech Republic",
    price: 280,
    vibeLabel: "City",
  },
  {
    slug: "algarve",
    name: "Algarve",
    country: "Portugal",
    price: 340,
    vibeLabel: "Beach",
  },
  {
    slug: "hallstatt",
    name: "Hallstatt",
    country: "Austria",
    price: 395,
    vibeLabel: "Mountains",
  },
];

const NIGHTS = 6;
const MONTH_LABEL = "June";

export async function ExampleDestinations() {
  const photoUrls = await Promise.all(
    EXAMPLES.map(({ name, country }) => getCityPhoto(name, country)),
  );

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <TypewriterHeadline />
          <p className="text-muted mt-3 text-lg">
            Click any destination to see the full plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {EXAMPLES.map(({ slug, name, country, price, vibeLabel }, i) => {
            const photoUrl = photoUrls[i];
            const gradient = getGradient(slug);

            return (
              <Link
                key={slug}
                href={`/examples/${slug}`}
                prefetch
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
                    <h3 className="text-white text-2xl font-bold leading-tight">
                      {name}
                    </h3>
                  </div>
                </div>
                <div className="bg-card px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted">
                    {NIGHTS} nights · {MONTH_LABEL} · {vibeLabel}
                  </span>
                  <span className="text-sm font-semibold text-accent">
                    See plan →
                  </span>
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
