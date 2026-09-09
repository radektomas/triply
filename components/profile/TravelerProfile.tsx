import Link from "next/link";
import { TriplyMascot } from "@/components/triply/TriplyMascot";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { AIRPORTS } from "@/lib/data/airports";
import { getGradient } from "@/lib/utils/gradient";
import {
  PARTY_PRESETS,
  formatWindow,
  type TravelerProfile as TravelerProfileData,
} from "@/lib/traveler";
import { VibeChip } from "./VibeChip";

// Profile-page section for everything the onboarding wizard captured.
// Server component: photo URLs are already signed by getTravelerProfile.

export function OnboardingNudge({ firstName }: { firstName: string }) {
  return (
    <section className="mb-10 rounded-3xl bg-white border border-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] items-center gap-6 px-6 sm:px-8 py-6">
        <div className="hidden sm:block">
          <TriplyMascot state="happy" pxSize={96} calm />
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
            2 minutes · makes everything better
          </p>
          <h2 className="font-display text-2xl font-bold text-[#1A1A1A] leading-tight">
            {firstName}, tell Triply what you love.
          </h2>
          <p className="text-sm text-muted mt-1 max-w-lg">
            Your vibes, where you&apos;ve been, your usual budget and when you&apos;re free.
            You get personalized picks straight away, and deal alerts for your dates later.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent hover:bg-accent-deep text-white text-sm font-semibold transition-colors shadow-md"
          >
            Set up my traveler profile <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TravelerProfile({ profile }: { profile: TravelerProfileData }) {
  const { prefs, places, windows } = profile;
  const airport = AIRPORTS.find((a) => a.iata === prefs.homeAirport);
  const party = PARTY_PRESETS.find((p) => p.count === prefs.travelParty)?.label ?? "Solo";
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = windows.filter((w) => w.endDate > today);

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase text-accent tracking-[0.18em] mb-1">
            Your traveler profile
          </p>
          <h2 className="font-display text-2xl font-bold text-[#1A1A1A]">
            What Triply plans around
          </h2>
        </div>
        <Link
          href="/onboarding"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-accent-light hover:text-accent transition-colors"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Preferences card */}
        <div className="md:col-span-1 rounded-3xl bg-white border border-border shadow-sm p-5 space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-2">Vibes</p>
            {prefs.vibes.length ? (
              <div className="flex flex-wrap gap-1.5">
                {prefs.vibes.map((v) => (
                  <VibeChip key={v} vibe={v} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">None picked yet.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-1">Budget</p>
              <p className="font-display text-2xl font-bold text-accent tabular-nums leading-none">
                <FormattedPrice eur={prefs.budgetEur} estimate={false} />
              </p>
              <p className="text-[11px] text-muted mt-1">per person</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-1">Usually</p>
              <p className="font-display text-2xl font-bold text-[#0D3B2E] leading-none">{party}</p>
              <p className="text-[11px] text-muted mt-1">
                from {airport ? `${airport.city} (${airport.iata})` : "anywhere"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted mb-2">
              Free windows
            </p>
            {upcoming.length ? (
              <ul className="space-y-1.5">
                {upcoming.slice(0, 4).map((w) => {
                  const f = formatWindow(w);
                  return (
                    <li key={w.id} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                      <span className="w-7 h-7 rounded-lg bg-teal/10 text-teal flex items-center justify-center font-bold text-xs tabular-nums shrink-0">
                        {f.nights}
                      </span>
                      <span className="font-medium">{f.range}</span>
                    </li>
                  );
                })}
                {upcoming.length > 4 && (
                  <li className="text-xs text-muted">+ {upcoming.length - 4} more</li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                No upcoming windows. Add some and Triply can watch for deals on those dates.
              </p>
            )}
          </div>
        </div>

        {/* Passport */}
        <div className="md:col-span-2 rounded-3xl bg-white border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              Passport · {places.length} {places.length === 1 ? "stamp" : "stamps"}
            </p>
          </div>
          {places.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border px-5 py-8 text-center">
              <p className="font-display text-lg font-bold text-[#1A1A1A]/70">No stamps yet.</p>
              <p className="text-sm text-muted mt-1">
                Add the places you&apos;ve been and Triply won&apos;t send you back there.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {places.map((p, i) => (
                <li
                  key={p.id}
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden ring-2 ring-white shadow-[0_8px_24px_-12px_rgba(13,115,119,0.35)]"
                  style={{ transform: `rotate(${i % 2 === 0 ? -1.2 : 1.2}deg)` }}
                >
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photoUrl}
                      alt={`${p.name}, ${p.country}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: getGradient(p.id) }}
                    >
                      <span className="font-display text-4xl font-bold text-white/25 select-none">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                    <p className="font-display font-bold text-xs leading-tight truncate">{p.name}</p>
                    <p className="text-[10px] text-white/80 truncate">{p.country}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
