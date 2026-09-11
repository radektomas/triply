"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VibeTag } from "@/components/ui/VibeTag";
import { FormattedPrice } from "@/components/shared/FormattedPrice";
import { HeartIcon } from "@/components/auth/AuthIcons";
import { getGradient } from "@/lib/utils/gradient";
import { saveDestination, unsaveDestination } from "@/app/actions/saved";
import type { APIDestination, SavedTripContext } from "@/lib/types";

export interface Pick {
  destination: APIDestination;
  tripId: string | null;
  photoUrl: string | null;
  /** Reconciled per-person total for the trip it was generated in. */
  totalEur: number | null;
  nights: number;
  budgetFit: "under" | "fit" | "over" | null;
  /** Trip context embedded on save so the watchlist can deep-link back. */
  context: SavedTripContext;
  /** saved_destinations row id when this place is already on the watchlist. */
  savedId: string | null;
}

const fitLabel = { under: "Under budget", fit: "Fits budget", over: "Over budget" } as const;
const fitClass = {
  under: "text-emerald-700 bg-emerald-50",
  fit: "text-slate-700 bg-slate-100",
  over: "text-rose-700 bg-rose-50",
} as const;

export function PickCard({ pick, index, highlight }: { pick: Pick; index: number; highlight: boolean }) {
  const reduceMotion = useReducedMotion();
  const { destination: d, tripId, photoUrl } = pick;
  const [savedId, setSavedId] = useState<string | null>(pick.savedId);
  // Re-sync when the server re-renders with a different value (e.g. the
  // place was removed from the watchlist below). Done during render, per
  // React's "adjusting state when a prop changes" pattern.
  const [seenSavedId, setSeenSavedId] = useState(pick.savedId);
  if (pick.savedId !== seenSavedId) {
    setSeenSavedId(pick.savedId);
    setSavedId(pick.savedId);
  }
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const href = tripId ? `/trip/${tripId}?d=${d.id}` : null;
  const saved = savedId !== null;

  function toggleSave() {
    setError(null);
    startTransition(async () => {
      if (saved) {
        const prev = savedId!;
        setSavedId(null);
        setJustSaved(false);
        const r = await unsaveDestination(prev);
        if (!r.ok) {
          setSavedId(prev);
          setError(r.error);
        }
      } else {
        const r = await saveDestination({ destination: d, context: pick.context });
        if (r.ok) {
          setSavedId(r.rowId);
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 3000);
        } else {
          setError("Couldn't save that place. Please try again.");
        }
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
        highlight ? "border-accent/40 ring-2 ring-accent/20" : "border-border hover:ring-1 hover:ring-accent/25"
      }`}
    >
      <div className="h-48 relative shrink-0 overflow-hidden">
        {href ? (
          <Link href={href} prefetch aria-label={`View ${d.name} trip`} className="absolute inset-0">
            {photo}
          </Link>
        ) : (
          photo
        )}
        {highlight && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 shadow">
            New for you
          </span>
        )}
        <button
          type="button"
          onClick={toggleSave}
          disabled={busy}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${d.name} from your watchlist` : `Save ${d.name} to your watchlist`}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-sm ring-1 ring-black/5 transition-all duration-150 cursor-pointer disabled:opacity-50 ${
            saved ? "text-rose-500" : "text-slate-500 hover:text-rose-500 hover:scale-110"
          }`}
        >
          <HeartIcon filled={saved} size={18} />
        </button>
        <AnimatePresence>
          {justSaved && (
            <motion.span
              key="hint"
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-14 right-3 z-10 rounded-full bg-[#1a1a1a]/85 text-white text-[11px] font-semibold px-3 py-1.5 shadow"
            >
              Added to your watchlist
            </motion.span>
          )}
        </AnimatePresence>
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
            onClick={toggleSave}
            disabled={busy}
            aria-pressed={saved}
            className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 ${
              saved
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-accent text-white hover:bg-accent-deep"
            }`}
          >
            <HeartIcon filled={saved} size={15} color="currentColor" />
            {saved ? "On your watchlist" : "Save to watchlist"}
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
