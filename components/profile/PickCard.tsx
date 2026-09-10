"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { VibeTag } from "@/components/ui/VibeTag";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { getGradient } from "@/lib/utils/gradient";
import { watchDestination, unwatchDestination } from "@/app/profile/watch-actions";
import type { APIDestination } from "@/lib/types";

export interface Pick {
  destination: APIDestination;
  tripId: string | null;
  photoUrl: string | null;
  /** Reconciled per-person total for the trip it was generated in. */
  totalEur: number | null;
  nights: number;
  budgetFit: "under" | "fit" | "over" | null;
  /** From the most recent generation. */
  fresh: boolean;
  /** Existing watch id, if the user already watches this place. */
  watchId: string | null;
}

const fitLabel = { under: "Under budget", fit: "Fits budget", over: "Over budget" } as const;
const fitClass = {
  under: "text-emerald-700 bg-emerald-50",
  fit: "text-slate-700 bg-slate-100",
  over: "text-rose-700 bg-rose-50",
} as const;

function BellIcon({ size = 15, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function PickCard({ pick, index, highlight }: { pick: Pick; index: number; highlight: boolean }) {
  const reduceMotion = useReducedMotion();
  const { destination: d, tripId, photoUrl } = pick;
  const [watchId, setWatchId] = useState<string | null>(pick.watchId);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const href = tripId ? `/trip/${tripId}?d=${d.id}` : null;
  const watching = watchId !== null;

  function toggleWatch() {
    setError(null);
    startTransition(async () => {
      if (watching) {
        const prev = watchId;
        setWatchId(null);
        const r = await unwatchDestination(prev!);
        if (!r.ok) {
          setWatchId(prev);
          setError(r.error);
        }
      } else {
        const r = await watchDestination({
          name: d.name,
          country: d.country,
          countryCode: d.countryCode,
          destinationId: d.id,
          tripId: tripId ?? undefined,
        });
        if (r.ok) setWatchId(r.id);
        else setError(r.error);
      }
    });
  }

  const photo = (
    <div className="absolute inset-0" style={{ background: getGradient(d.id) }}>
      {photoUrl && (
        <>
          <Image
            src={photoUrl}
            alt={`${d.name}, ${d.country}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.12) 60%, transparent 100%)",
            }}
          />
        </>
      )}
    </div>
  );

  return (
    <motion.article
      initial={reduceMotion || !highlight ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
      className={`group bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        highlight && pick.fresh ? "border-accent/40 ring-2 ring-accent/20" : "border-border hover:ring-1 hover:ring-accent/25"
      }`}
    >
      <div className="h-44 relative shrink-0 overflow-hidden">
        {href ? (
          <Link href={href} prefetch aria-label={`View ${d.name} trip`} className="absolute inset-0">
            {photo}
          </Link>
        ) : (
          photo
        )}
        {pick.fresh && highlight && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 shadow">
            New for you
          </span>
        )}
        <button
          type="button"
          onClick={toggleWatch}
          disabled={busy}
          aria-pressed={watching}
          aria-label={watching ? `Stop watching prices for ${d.name}` : `Watch prices for ${d.name}`}
          title={watching ? "Watching prices" : "Watch prices"}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm ring-1 ring-black/5 transition cursor-pointer disabled:opacity-50 ${
            watching ? "bg-teal text-white" : "bg-white/85 text-slate-600 hover:text-teal"
          }`}
        >
          <BellIcon filled={watching} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 z-[1] p-4 pointer-events-none">
          <p className="text-white/75 text-xs font-semibold uppercase tracking-widest mb-0.5">
            {d.country}
          </p>
          <h3 className="text-white text-xl font-bold leading-tight">{d.name}</h3>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm text-muted mb-3 leading-relaxed line-clamp-2">{d.tagline}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(d.vibes ?? []).slice(0, 3).map((v) => (
            <VibeTag key={v} label={v} />
          ))}
        </div>
        <div className="mt-auto pt-3 border-t border-slate-200 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mb-1">
              {pick.nights} {pick.nights === 1 ? "night" : "nights"} · per person
            </p>
            <p className="font-display text-xl font-bold text-[#1A1A1A] tabular-nums leading-none">
              {pick.totalEur !== null ? <FormattedPrice eur={pick.totalEur} /> : "—"}
            </p>
          </div>
          {pick.budgetFit && (
            <span className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${fitClass[pick.budgetFit]}`}>
              {fitLabel[pick.budgetFit]}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleWatch}
            disabled={busy}
            aria-pressed={watching}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
              watching
                ? "bg-teal text-white hover:bg-teal-deep"
                : "bg-teal/10 text-teal hover:bg-teal/20"
            }`}
          >
            <BellIcon filled={watching} />
            {watching ? "Watching prices" : "Email me deals"}
          </button>
          {href && (
            <Link
              href={href}
              prefetch
              className="inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold text-[#1A1A1A] bg-[#F5F5F5] hover:bg-accent-light hover:text-accent transition-colors"
            >
              View <span aria-hidden>→</span>
            </Link>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs text-rose-600">
            {error}
          </p>
        )}
      </div>
    </motion.article>
  );
}
