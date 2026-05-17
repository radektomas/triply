import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeIn } from "@/components/ui/FadeIn";
import { GradientMesh } from "@/components/landing/GradientMesh";
import { BudgetBreakdown } from "@/components/trip/BudgetBreakdown";
import { DayPlans } from "@/components/trip/DayPlans";
import { BookingHub } from "@/components/trip/BookingHub";
import { PhotoCarousel } from "@/components/trip/PhotoCarousel";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { getQuickPickBySlug, listQuickPicks } from "@/lib/data/getQuickPick";
import { getQuickPickTrip } from "@/lib/data/quickPickTrips";
import { getCityPhotos, type CityPhoto } from "@/lib/photos";
import { getGradient } from "@/lib/utils/gradient";

// ISR: regenerate at most once per hour so manual jsonb edits in Supabase
// surface without a redeploy. The 8 known slugs are still pre-rendered at
// build via generateStaticParams below.
export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

// "Prague, Czech Republic" → "Prague"
// "Lago di Como, Italy"    → "Lago di Como"
// "Slovenia (Bled + Soča)" → "Slovenia"
// "Albanian Riviera"       → "Albanian Riviera"
function extractCityName(destination: string): string {
  return destination.split(/[,(]/)[0].trim();
}

// Fallback used only when the slug has no in-repo TripDetail entry. When
// `getQuickPickTrip(slug)` returns a TripDetail, prefer its `country` and
// `countryCode` fields verbatim.
const COUNTRY_CODE_BY_NAME: Record<string, string> = {
  Italy: "IT",
  "Czech Republic": "CZ",
  Albania: "AL",
  Greece: "GR",
  Portugal: "PT",
  Slovenia: "SI",
  Georgia: "GE",
};

// "Prague, Czech Republic" → "Czech Republic"
// "Slovenia (Bled + Soča)" → "Slovenia"
// "Albanian Riviera"       → "Albania"  (special-cased — region name, not country)
function countryFromDestination(destination: string): string {
  if (destination === "Albanian Riviera") return "Albania";
  const commaIdx = destination.indexOf(",");
  if (commaIdx >= 0) return destination.slice(commaIdx + 1).trim();
  const parenIdx = destination.indexOf("(");
  if (parenIdx >= 0) return destination.slice(0, parenIdx).trim();
  return "";
}

// "IT" → "🇮🇹"  — regional indicator letters from a 2-letter ISO code
function flagFromCountryCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

export async function generateStaticParams() {
  const picks = await listQuickPicks();
  return picks.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const pick = await getQuickPickBySlug(slug);
  if (!pick) return { title: "Trip — Triply" };

  const tripDetail = getQuickPickTrip(slug);
  const title = `${pick.title} — ${pick.destination} | Triply`;
  const description =
    tripDetail?.description ??
    `${pick.duration_days}-day ${pick.travelers.toLowerCase()} trip to ${pick.destination} from €${pick.budget_from_eur}. Hand-picked by Triply.`;
  const canonical = `/trips/${pick.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Triply",
      images: [{ url: pick.hero_image_url }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [pick.hero_image_url],
    },
  };
}

export default async function QuickPickPage({ params }: { params: Params }) {
  const { slug } = await params;
  const pick = await getQuickPickBySlug(slug);
  if (!pick) notFound();

  // Trip body comes from the in-repo `QUICK_PICK_TRIPS` map (typed TripDetail).
  // Supabase still provides the card metadata (title, hero image, etc.).
  // Slugs without an in-repo entry fall back to the hero-only view below.
  const detail = getQuickPickTrip(slug);
  const hasBudget = !!detail?.budget?.breakdown?.length;
  const hasDayPlans = !!detail?.dayPlans?.length;
  const hasBooking = !!detail?.booking;

  const remixHref = `/?vibe=${encodeURIComponent(pick.vibe)}&destination=${encodeURIComponent(pick.destination)}`;

  // Country + flag — prefer the TripDetail's ISO fields, fall back to parsing
  // the Supabase `destination` string when no in-repo entry exists.
  const cityName = detail?.destination ?? extractCityName(pick.destination);
  const country = detail?.country ?? countryFromDestination(pick.destination);
  const countryCode =
    detail?.countryCode ?? (country ? COUNTRY_CODE_BY_NAME[country] ?? "" : "");
  const flag = countryCode ? flagFromCountryCode(countryCode) : "";

  // Pexels photo carousel — same helper TripHero uses, cached via Supabase
  // photo_cache. Empty array (network failure or no results) falls through to
  // the static `pick.hero_image_url` Image below.
  let photos: CityPhoto[] = [];
  try {
    photos = await getCityPhotos(cityName, country);
  } catch {
    photos = [];
  }
  const heroGradient = getGradient(pick.slug);

  return (
    <>
      <GradientMesh variant="fixed" />
      <main className="flex-1 pb-16">
        {/* Custom hero — image + title + destination + 3 chips */}
        <FadeIn>
          <section
            className="relative overflow-hidden"
            style={{ height: "clamp(420px, 70dvh, 640px)" }}
          >
            {photos.length > 0 ? (
              <PhotoCarousel
                photos={photos}
                fallbackGradient={heroGradient}
                destinationName={cityName}
                country={country}
              />
            ) : (
              <>
                <Image
                  src={pick.hero_image_url}
                  alt=""
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 35%, transparent 50%, rgba(0,0,0,0.65) 100%)",
                  }}
                />
              </>
            )}

            {/* Back chip */}
            <div
              className="absolute top-0 left-0 right-0 z-20 max-w-4xl mx-auto px-4 sm:px-6"
              style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))" }}
            >
              <Link
                href="/#quick-picks"
                className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-white text-sm font-medium hover:bg-white/25 transition-all duration-200"
              >
                <span aria-hidden="true">←</span> Quick picks
              </Link>
            </div>

            {/* Title + chips pinned to bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-10">
              {country && (
                <p
                  className="text-white/90 text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 12px rgba(0,0,0,0.4)" }}
                >
                  {flag && (
                    <span aria-hidden="true" className="mr-1.5">
                      {flag}
                    </span>
                  )}
                  {country}
                </p>
              )}
              <p
                className="text-white/90 text-xs font-bold uppercase tracking-widest mb-2"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 12px rgba(0,0,0,0.4)" }}
              >
                {pick.title}
              </p>
              <h1
                className="font-bold text-white leading-tight mb-4"
                style={{
                  fontSize: "clamp(2.5rem, 8vw, 5rem)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.55), 0 0 20px rgba(0,0,0,0.35)",
                }}
              >
                {cityName}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <HeroChip>
                  {pick.duration_days} {pick.duration_days === 1 ? "day" : "days"}
                </HeroChip>
                <HeroChip>{pick.travelers}</HeroChip>
                <HeroChip>
                  from <FormattedPrice eur={pick.budget_from_eur} />
                </HeroChip>
              </div>
            </div>
          </section>
        </FadeIn>

        {hasBudget && detail && (
          <FadeIn delay={0.18} className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
            <section>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Budget Breakdown</h2>
              <div className="bg-white rounded-2xl border border-border p-6 sm:p-10 shadow-sm">
                <BudgetBreakdown
                  total={detail.budget.total}
                  range={detail.budget.range}
                  breakdown={detail.budget.breakdown}
                />
              </div>
            </section>
          </FadeIn>
        )}

        {hasDayPlans && detail && (
          <FadeIn delay={0.26} className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
            <DayPlans
              dayPlans={detail.dayPlans ?? []}
              destinationName={pick.destination}
            />
          </FadeIn>
        )}

        {hasBooking && detail && (
          <FadeIn delay={0.34}>
            <BookingHub detail={detail} />
          </FadeIn>
        )}

        {/* Make-your-own-version CTA */}
        <FadeIn delay={0.42} className="max-w-3xl mx-auto px-4 sm:px-6 pt-16">
          <div
            className="rounded-3xl p-6 sm:p-10 text-center"
            style={{
              background: "linear-gradient(135deg, #0D7377 0%, #0A5D60 100%)",
              boxShadow: "0 12px 32px -12px rgba(13,115,119,0.35)",
            }}
          >
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/70 mb-2">
              Want a twist on this trip?
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
              Make your own version
            </h2>
            <p className="text-white/85 text-sm sm:text-base max-w-xl mx-auto mb-6">
              Same vibe, your dates and budget. We&apos;ll generate a fresh plan around{" "}
              {pick.destination}.
            </p>
            <Link
              href={remixHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-[#0D7377] font-semibold px-6 py-3 text-[15px] hover:-translate-y-0.5 transition-transform"
            >
              Plan it
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </FadeIn>
      </main>
    </>
  );
}

function HeroChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 text-white text-sm font-medium"
      style={{ backgroundColor: "rgba(255,255,255,0.12)", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
    >
      {children}
    </span>
  );
}
