"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { AIRPORTS } from "@/lib/data/airports";
import {
  PARTY_PRESETS,
  buildFirstPicksInput,
  formatWindow,
  type TravelerProfile,
} from "@/lib/traveler";
import { VIBE_BY_VALUE } from "./vibePresets";
import { StepShell } from "./StepShell";

interface Props {
  profile: Pick<TravelerProfile, "prefs" | "places" | "windows">;
  firstName: string;
}

export function StepDone({ profile, firstName }: Props) {
  const reduceMotion = useReducedMotion();
  const { format } = useCurrency();
  const { prefs, places, windows } = profile;
  const airport = AIRPORTS.find((a) => a.iata === prefs.homeAirport);
  const party = PARTY_PRESETS.find((p) => p.count === prefs.travelParty)?.label ?? "Solo";
  const picks = buildFirstPicksInput(profile);
  const firstWindow = formatWindow({ startDate: picks.checkIn, endDate: picks.checkOut });

  const rows: { k: string; v: React.ReactNode }[] = [
    {
      k: "Vibes",
      v: (
        <span className="flex flex-wrap gap-1.5">
          {prefs.vibes.map((v) => {
            const p = VIBE_BY_VALUE[v];
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                style={{ backgroundColor: p?.color ?? "#0D7377" }}
              >
                {p && <p.Icon color="#fff" size={13} />}
                {p?.label ?? v}
              </span>
            );
          })}
        </span>
      ),
    },
    { k: "Been to", v: places.length ? `${places.length} ${places.length === 1 ? "country" : "countries"}` : "Nowhere yet" },
    { k: "Budget", v: `${format(prefs.budgetEur, { rounded: true })} per person` },
    { k: "Traveling as", v: party },
    { k: "Flying from", v: airport ? `${airport.city} (${airport.iata})` : "Prague (PRG)" },
    {
      k: "Windows",
      v: windows.length ? `${windows.length} saved · first picks for ${firstWindow.range}` : `None yet · first picks for ${firstWindow.range}`,
    },
  ];

  return (
    <StepShell
      eyebrow="All set"
      title={
        <>
          Nice one, {firstName}. <span className="text-accent">Triply gets you now.</span>
        </>
      }
      sub="Here's what we'll plan around. Change any of it later from your profile."
    >
      <motion.dl
        initial={reduceMotion ? false : "hidden"}
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="mx-auto w-full max-w-xl rounded-3xl bg-white/80 ring-1 ring-black/5 shadow-sm divide-y divide-black/5 overflow-hidden"
      >
        {rows.map((r) => (
          <motion.div
            key={r.k}
            variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4 px-5 py-3.5"
          >
            <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]/50 pt-0.5">
              {r.k}
            </dt>
            <dd className="text-sm font-medium text-[#1a1a1a] min-w-0">{r.v}</dd>
          </motion.div>
        ))}
      </motion.dl>
    </StepShell>
  );
}
